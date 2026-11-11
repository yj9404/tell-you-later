import { roundAt, roundTime } from 'drand-client'
import type { ChainClient, ChainInfo, RandomnessBeacon } from 'drand-client'

// drand 메인넷 quicknet. 타임락에 쓸 수 있는 unchained 체인이다.
// 값은 drand 공식 문서와 각 엔드포인트의 /info 응답으로 확인했다 (2026-11-11).
// 상수로 고정해 두면 암호화할 때 네트워크가 필요 없고, 엔드포인트가 다른 체인 정보를
// 돌려줘도 영향받지 않는다.
export const QUICKNET: ChainInfo = {
  public_key:
    '83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a',
  period: 3,
  genesis_time: 1692803367,
  hash: '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971',
  groupHash: 'f477d5c89f21a17c863a7f937c6a6d15859414d2be09cd448d4279af331c5d3e',
  schemeID: 'bls-unchained-g1-rfc9380',
  metadata: { beaconID: 'quicknet' },
}

// 앞에서부터 차례로 시도한다. 모두 CORS(access-control-allow-origin: *)를 허용한다.
export const DRAND_ENDPOINTS = [
  'https://api.drand.sh',
  'https://drand.cloudflare.com',
  'https://api2.drand.sh',
  'https://api3.drand.sh',
]

const REQUEST_TIMEOUT_MS = 8000

/** 개봉 시각 이후에 처음 나오는 라운드. 이 라운드의 서명이 나와야 편지가 열린다. */
export function roundForTime(timeMs: number): number {
  const round = roundAt(timeMs, QUICKNET)
  return roundTime(QUICKNET, round) < timeMs ? round + 1 : round
}

/** 라운드가 발행되는 시각(ms). */
export function timeForRound(round: number): number {
  return roundTime(QUICKNET, round)
}

export type DrandErrorKind = 'not-yet' | 'network'

export class DrandError extends Error {
  kind: DrandErrorKind
  constructor(kind: DrandErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

async function fetchJson(url: string): Promise<{ status: number; json?: unknown }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return { status: res.status }
    return { status: res.status, json: await res.json() }
  } finally {
    clearTimeout(timer)
  }
}

async function getBeacon(path: string, expectRound?: number): Promise<RandomnessBeacon> {
  let notYet = false
  for (const base of DRAND_ENDPOINTS) {
    try {
      const { status, json } = await fetchJson(`${base}/${QUICKNET.hash}/public/${path}`)
      const beacon = json as RandomnessBeacon | undefined
      if (beacon && typeof beacon.signature === 'string' && (expectRound === undefined || beacon.round === expectRound)) {
        return beacon
      }
      // 아직 발행되지 않은 라운드는 404 또는 425로 응답한다.
      if (status === 404 || status === 425) notYet = true
    } catch {
      // 네트워크 오류·시간 초과: 다음 엔드포인트로 넘어간다.
    }
  }
  throw notYet
    ? new DrandError('not-yet', '아직 열쇠가 발행되지 않았습니다.')
    : new DrandError('network', 'drand 네트워크에 연결하지 못했습니다.')
}

/**
 * tlock-js에 넘기는 클라이언트.
 * tlock-js의 기본 클라이언트 대신 직접 만든 이유: 체인 정보를 상수로 고정하고,
 * 엔드포인트 여러 개를 차례로 시도하기 위해서다.
 * 서명 검증은 따로 하지 않는다. 잘못된 서명으로는 복호화(MAC 검증)가 실패하므로
 * 엔드포인트가 거짓 응답을 해도 편지가 잘못 열리지는 않는다.
 */
export const drandClient: ChainClient = {
  options: {
    disableBeaconVerification: true,
    noCache: false,
    chainVerificationParams: { chainHash: QUICKNET.hash, publicKey: QUICKNET.public_key },
  },
  chain: () => ({
    baseUrl: `${DRAND_ENDPOINTS[0]}/${QUICKNET.hash}`,
    info: async () => QUICKNET,
  }),
  get: (round: number) => getBeacon(String(round), round),
  latest: () => getBeacon('latest'),
}
