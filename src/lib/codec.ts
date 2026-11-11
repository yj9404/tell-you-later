// 링크 형식: #v1.<base64url>
// 바이트 배열: [theme 1][tint 1][round 4][created 4][to 길이 1][to][from 길이 1][from][body ...]
// - theme: 테마 등록 번호. tint: 팔레트 인덱스(색을 고르지 않는 테마는 0).
// - round: 개봉 시각의 drand 라운드. created: 쓴 시각(1970년부터 분 단위).
// - body만 타임락 암호문이고 나머지는 평문이다.

export interface Letter {
  theme: number
  tint: number
  to: string
  from: string
  round: number
  /** 쓴 시각, epoch 분 */
  created: number
  body: Uint8Array
}

export const LINK_PREFIX = 'v1.'
export const NAME_MAX = 20
// 암호문 최소 길이: stanza 128 + mac 32 + nonce 16 + tag 16 + 평문 1바이트 이상
const MIN_BODY = 193

export class LinkError extends Error {}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new LinkError('링크에 쓸 수 없는 글자가 있습니다.')
  let bin: string
  try {
    bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    throw new LinkError('링크가 잘렸습니다.')
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function encodeLink(letter: Letter): string {
  const enc = new TextEncoder()
  const to = enc.encode(letter.to)
  const from = enc.encode(letter.from)
  if (to.length > 255 || from.length > 255) throw new LinkError('이름이 너무 깁니다.')
  const out = new Uint8Array(12 + to.length + from.length + letter.body.length)
  const view = new DataView(out.buffer)
  out[0] = letter.theme
  out[1] = letter.tint
  view.setUint32(2, letter.round)
  view.setUint32(6, letter.created)
  let p = 10
  out[p++] = to.length
  out.set(to, p)
  p += to.length
  out[p++] = from.length
  out.set(from, p)
  p += from.length
  out.set(letter.body, p)
  return LINK_PREFIX + toBase64Url(out)
}

// 이미 보낸 링크는 몇 년 뒤에 열린다. 형식을 바꿀 때는 여기에 v2를 추가하고,
// 옛 디코더는 지우거나 고치지 않는다. (src/lib/fixtures/의 옛 링크가 계속 열리는지 테스트한다.)
const DECODERS: Record<string, (payload: string) => Letter> = {
  v1: decodeV1,
}

/** fragment는 '#'가 붙어 있어도, 없어도 된다. 형식이 틀리면 LinkError를 던진다. */
export function decodeLink(fragment: string): Letter {
  const text = fragment.replace(/^#/, '').trim()
  const dot = text.indexOf('.')
  const decode = dot > 0 ? DECODERS[text.slice(0, dot)] : undefined
  if (!decode) throw new LinkError('알 수 없는 링크 형식입니다.')
  return decode(text.slice(dot + 1))
}

function decodeV1(payload: string): Letter {
  const bytes = fromBase64Url(payload)
  const view = new DataView(bytes.buffer)
  const dec = new TextDecoder('utf-8', { fatal: true })
  try {
    let p = 10
    const toLen = bytes[p++]
    const to = dec.decode(bytes.subarray(p, p + toLen))
    p += toLen
    const fromLen = bytes[p++]
    const from = dec.decode(bytes.subarray(p, p + fromLen))
    p += fromLen
    const body = bytes.subarray(p)
    if (toLen === undefined || fromLen === undefined || body.length < MIN_BODY) throw new LinkError('링크가 잘렸습니다.')
    const round = view.getUint32(2)
    if (round < 1) throw new LinkError('개봉 시각이 올바르지 않습니다.')
    return { theme: bytes[0], tint: bytes[1], round, created: view.getUint32(6), to, from, body }
  } catch (e) {
    if (e instanceof LinkError) throw e
    throw new LinkError('링크가 깨졌습니다.')
  }
}

/** 링크별 기록(연출 재생 여부)의 키와 의사난수 시드로 쓰는 짧은 해시. 보안 용도가 아니다. */
export function linkHash(fragment: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < fragment.length; i++) {
    h ^= fragment.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
