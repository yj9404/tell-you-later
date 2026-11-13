import { nextNewYear, oneYearLater } from '../lib/date.ts'

/** 언제 열릴지. 빠른 선택은 링크를 만드는 순간을 기준으로 다시 계산한다. */
export type When = { kind: 'newyear' } | { kind: 'year' } | { kind: 'custom'; at: Date }

export function resolveWhen(when: When, now: Date): Date {
  if (when.kind === 'newyear') return nextNewYear(now)
  if (when.kind === 'year') return oneYearLater(now)
  return when.at
}

/** 지금부터 1시간 뒤를 정각으로 올린 시각: 14:19 → 16:00, 14:00 → 15:00. 늘 1시간 이상 남는다. */
export function hourAfter(now: Date): Date {
  const d = new Date(now.getTime() + 3600_000)
  if (d.getMinutes() || d.getSeconds() || d.getMilliseconds()) d.setHours(d.getHours() + 1, 0, 0, 0)
  return d
}

/**
 * "직접 고르기" 칸을 처음 채울 시각. 직전에 고른 것(프리셋이면 그 프리셋의 시각, 직접 고른 값이면 그 값)을 쓰고,
 * 고른 것이 없거나 그 시각이 이미 지났으면 hourAfter(now). 고르자마자 "이미 지난 시각"이 뜨지 않게 한다.
 */
export function customStart(prev: When | null, now: Date): Date {
  const at = prev && resolveWhen(prev, now)
  return at && at.getTime() > now.getTime() ? at : hourAfter(now)
}
