import { timelockEncrypt, timelockDecrypt, Buffer } from 'tlock-js'
import type { ChainClient } from 'drand-client'
import { QUICKNET, drandClient, DrandError } from './drand.ts'
import { AppError } from './errors.ts'

// tlock-js는 age 형식의 텍스트(헤더 + base64 줄바꿈)를 돌려준다. 링크에 그대로 넣으면
// 길어지므로, 다시 만들 수 있는 부분(버전 줄, 라운드, 체인 해시, base64 표기)을 떼고
// 바이트만 남긴다: [stanza 128][mac 32][payload ...]
const STANZA_LEN = 128 // G2 점 96 + V 16 + W 16 (quicknet)
const MAC_LEN = 32
export const MIN_CIPHER_LEN = STANZA_LEN + MAC_LEN + 16 /* nonce */ + 16 /* tag */ + 1

const AGE_HEAD = /^age-encryption\.org\/v1\n-> tlock (\d+) ([0-9a-f]+)\n([A-Za-z0-9+/\n]+)\n--- ([A-Za-z0-9+/]+)\n/

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/=+$/, '')

function buildAge(round: number, cipher: Uint8Array): string {
  const stanza = b64(cipher.subarray(0, STANZA_LEN)).match(/.{1,64}/g)!.join('\n')
  const mac = b64(cipher.subarray(STANZA_LEN, STANZA_LEN + MAC_LEN))
  const payload = Buffer.from(cipher.subarray(STANZA_LEN + MAC_LEN)).toString('binary')
  return `age-encryption.org/v1\n-> tlock ${round} ${QUICKNET.hash}\n${stanza}\n--- ${mac}\n${payload}`
}

function packAge(age: string, round: number): Uint8Array {
  const m = AGE_HEAD.exec(age)
  if (!m || Number(m[1]) !== round || m[2] !== QUICKNET.hash) throw new AppError('lock-failed', '예상하지 못한 암호문 형식입니다.')
  const stanza = Buffer.from(m[3].replace(/\n/g, ''), 'base64')
  const mac = Buffer.from(m[4], 'base64')
  const payload = Buffer.from(age.slice(m[0].length), 'binary')
  if (stanza.length !== STANZA_LEN || mac.length !== MAC_LEN) throw new AppError('lock-failed', '예상하지 못한 암호문 형식입니다.')
  const cipher = new Uint8Array(Buffer.concat([stanza, mac, payload]))
  // 헤더는 MAC에 포함되므로 한 글자라도 다르게 복원되면 영영 못 연다. 만들 때 확인한다.
  if (buildAge(round, cipher) !== age) throw new AppError('lock-failed', '암호문을 줄이는 과정에서 원본과 달라졌습니다.')
  return cipher
}

// 평문 첫 바이트: 0 = 그대로, 1 = deflate-raw 압축
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

async function packText(text: string): Promise<Uint8Array> {
  const raw = new TextEncoder().encode(text)
  let flag = 0
  let data: Uint8Array = raw
  if (typeof CompressionStream !== 'undefined') {
    try {
      const deflated = await pipe(raw, new CompressionStream('deflate-raw'))
      if (deflated.length < raw.length) {
        flag = 1
        data = deflated
      }
    } catch {
      // 압축을 못 쓰는 브라우저: 그대로 넣는다.
    }
  }
  const out = new Uint8Array(data.length + 1)
  out[0] = flag
  out.set(data, 1)
  return out
}

async function unpackText(bytes: Uint8Array): Promise<string> {
  const data = bytes.subarray(1)
  if (bytes[0] === 0) return new TextDecoder().decode(data)
  if (typeof DecompressionStream === 'undefined') {
    throw new AppError('unsupported', 'DecompressionStream이 없어 deflate-raw 평문을 풀 수 없습니다.')
  }
  return new TextDecoder().decode(await pipe(data, new DecompressionStream('deflate-raw')))
}

/** 편지를 round가 지나야 열리도록 잠근다. 네트워크를 쓰지 않는다. */
export async function lockLetter(text: string, round: number, client: ChainClient = drandClient): Promise<Uint8Array> {
  const armored = await timelockEncrypt(round, Buffer.from(await packText(text)), client)
  const age = Buffer.from(armored.replace(/-----[A-Z ]+-----/g, ''), 'base64').toString('binary')
  return packAge(age, round)
}

/** 잠긴 편지를 연다. round의 서명이 아직 없으면 DrandError('not-yet')를 던진다. */
export async function openLetter(cipher: Uint8Array, round: number, client: ChainClient = drandClient): Promise<string> {
  let plain: Uint8Array
  try {
    plain = await timelockDecrypt(buildAge(round, cipher), client)
  } catch (e) {
    if (e instanceof DrandError) throw e
    // tlock-js는 기기 시계 기준으로 이르면 요청 전에 거절한다.
    if (e instanceof Error && e.message.includes('too early')) {
      throw new DrandError('not-yet', '아직 열 수 없는 시각입니다.')
    }
    throw new AppError('corrupt', `복호화 실패: ${e instanceof Error ? e.message : String(e)}`)
  }
  return unpackText(plain)
}
