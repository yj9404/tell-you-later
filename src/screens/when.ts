import { nextNewYear, oneYearLater } from '../lib/date.ts'

/** 언제 열릴지. 빠른 선택은 링크를 만드는 순간을 기준으로 다시 계산한다. */
export type When = { kind: 'newyear' } | { kind: 'year' } | { kind: 'custom'; at: Date }

export function resolveWhen(when: When, now: Date): Date {
  if (when.kind === 'newyear') return nextNewYear(now)
  if (when.kind === 'year') return oneYearLater(now)
  return when.at
}
