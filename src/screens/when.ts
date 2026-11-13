import { nextNewYear, oneYearLater } from '../lib/date.ts'

/** 언제 열릴지. 빠른 선택은 링크를 만드는 순간을 기준으로 다시 계산한다. */
export type When = { kind: 'newyear' } | { kind: 'year' } | { kind: 'custom'; at: Date }

export function resolveWhen(when: When, now: Date): Date {
  if (when.kind === 'newyear') return nextNewYear(now)
  if (when.kind === 'year') return oneYearLater(now)
  return when.at
}

/** 내일 이 시각(분 단위): 11월 13일 14:19 → 11월 14일 14:19 */
export function tomorrowSameTime(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes())
}

/**
 * "직접 고르기" 칸을 처음 채울 시각. 이미 직접 고른 시각이 아직 안 지났으면 그것을, 아니면 내일 이 시각.
 * 고르자마자 "이미 지난 시각"이 뜨지 않는다.
 */
export function customStart(prev: When | null, now: Date): Date {
  return prev?.kind === 'custom' && prev.at.getTime() > now.getTime() ? prev.at : tomorrowSameTime(now)
}
