import { LinkError } from './codec.ts'
import { DrandError } from './drand.ts'

// 화면에 보여줄 문구는 오류 코드별로 화면 쪽이 정한다. Error.message는 개발자용이라 console에만 남긴다.
// - not-yet: 개봉 라운드의 서명이 아직 없다(기기 시계가 빠르거나 발행이 늦음)
// - network: drand 엔드포인트에 닿지 못했다
// - unsupported: 이 브라우저가 압축된 편지를 풀 수 없다(DecompressionStream 없음)
// - corrupt: 서명은 받았지만 복호화에 실패했다(링크 일부가 잘렸거나 바뀜)
// - broken-link: 링크 형식이 틀렸다
// - lock-failed: 잠그는 중 암호문 형식이 예상과 달랐다
// - unknown: 그 밖의 모든 것
export type ErrorCode = 'not-yet' | 'network' | 'unsupported' | 'corrupt' | 'broken-link' | 'lock-failed' | 'unknown'

/** 코드가 붙은 오류. message는 개발자용이다. */
export class AppError extends Error {
  code: ErrorCode
  constructor(code: ErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export function errorCode(e: unknown): ErrorCode {
  if (e instanceof DrandError) return e.kind
  if (e instanceof AppError) return e.code
  if (e instanceof LinkError) return 'broken-link'
  return 'unknown'
}
