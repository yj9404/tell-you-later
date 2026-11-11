import { hourMin, nextNewYear, oneYearLater, teaserDate } from '../lib/date.ts'

/** 언제 열릴지. 빠른 선택은 링크를 만드는 순간을 기준으로 다시 계산한다. */
export type When = { kind: 'newyear' } | { kind: 'year' } | { kind: 'custom'; at: Date }

export function resolveWhen(when: When, now: Date): Date {
  if (when.kind === 'newyear') return nextNewYear(now)
  if (when.kind === 'year') return oneYearLater(now)
  return when.at
}

/** 쓰기 화면 문장에 들어가는 날짜. 예고 문구 규칙과 같고, 0시 0분이 아니면 시각을 붙인다. */
export function whenLabel(at: Date, now: Date): string {
  const date = teaserDate(at, now)
  return at.getHours() || at.getMinutes() ? `${date} ${hourMin(at)}` : date
}
