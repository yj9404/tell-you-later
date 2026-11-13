// 영어 날짜·시각 표기. 받는 사람 기기의 지역 관습(월·일 순서, 12/24시간제)을 Intl로 따른다.
// 한국어 표기(src/lib/date.ts)와 같은 이름·같은 쓰임의 함수를 둔다. 모두 기기의 현지 시간대 기준이다.
import { durationParts } from '../lib/date.ts'

/**
 * Intl에 넘길 영어 로케일. 기기 언어 목록에 영어가 있으면 그것을, 없으면 첫 언어의 지역으로 "en-{지역}"을 만든다.
 * (독일어 기기 → en-DE: 24시간제, "1 Jan". 한국어 기기 → en-KR은 Intl이 en으로 맞춘다.)
 */
export function enLocale(prefs: readonly string[]): string {
  const en = prefs.find((tag) => /^en(-|$)/i.test(tag))
  if (en) return en
  for (const tag of prefs) {
    try {
      const region = new Intl.Locale(tag).maximize().region
      if (region) return `en-${region}`
    } catch {
      // 잘못된 언어 태그는 건너뛴다.
    }
  }
  return 'en-US'
}

type Opts = Intl.DateTimeFormatOptions

export function makeEnDates(locale: string) {
  const cache = new Map<string, Intl.DateTimeFormat>()
  const fmt = (opts: Opts) => (d: Date) => {
    const key = JSON.stringify(opts)
    let f = cache.get(key)
    if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, opts)))
    return f.format(d)
  }
  const plural = new Intl.PluralRules('en')
  const number = new Intl.NumberFormat(locale)

  // 24시간제 지역은 "00:05"처럼 시를 두 자리로 쓴다(numeric이면 "0:05"). 12시간제는 "9:05 AM".
  const h24 = /^h2[34]$/.test(new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle ?? '')
  const TIME: Opts = { hour: h24 ? '2-digit' : 'numeric', minute: '2-digit' }
  const md = fmt({ month: 'short', day: 'numeric' })
  const ymd = fmt({ year: 'numeric', month: 'short', day: 'numeric' })

  /** 예고 문장의 날짜: 1년 안이면 "Jan 1", 그보다 멀면 "Jan 1, 2028". 규칙은 한국어 teaserDate와 같다. */
  const teaserDate = (unlock: Date, now: Date) => {
    const sameDayNextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    return unlock < sameDayNextYear ? md(unlock) : ymd(unlock)
  }

  /** 남은 시간. 큰 단위부터 units개: "50d 12h", "3h 5m", "4m 12s", "9s" */
  const countdown = (ms: number, units = 2) =>
    durationParts(ms, units)
      .map(([n, unit]) => `${n}${{ d: 'd', h: 'h', m: 'm', s: 's' }[unit]}`)
      .join(' ')

  return {
    teaserDate,
    /** "Jan 1, 2027" */
    fullDate: ymd,
    /** "12:00 AM" (24시간제 지역은 "00:00") */
    clock: fmt(TIME),
    /** "Jan 1, 2027, 12:00 AM" */
    dateClock: fmt({ year: 'numeric', month: 'short', day: 'numeric', ...TIME }),
    /** "Friday, Jan 1, 2027" */
    dayDate: fmt({ weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }),
    /** "Friday, Jan 1, 2027, 12:00 AM" */
    longDate: fmt({ weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', ...TIME }),
    /** 예고 문장의 날짜에 시각을 붙인 것: "Jan 1, 12:00 AM" */
    whenText: (unlock: Date, now: Date) => `${teaserDate(unlock, now)}, ${fmt(TIME)(unlock)}`,
    /** 시간대 약칭을 붙인 시각: "Jan 1, 2027, 12:00 AM PST". 잠김 화면의 상세 시각에 쓴다. */
    dateClockZone: fmt({ year: 'numeric', month: 'short', day: 'numeric', ...TIME, timeZoneName: 'short' }),
    /** 채팅 화면의 시각: 오늘이면 "Today 11:06 AM", 아니면 날짜를 붙인다 */
    chatStamp: (d: Date, now: Date) => {
      if (d.toDateString() === now.toDateString()) return `Today ${fmt(TIME)(d)}`
      return `${d.getFullYear() === now.getFullYear() ? md(d) : ymd(d)}, ${fmt(TIME)(d)}`
    },
    /** 잠김 화면 상세 시각, 시간대 약칭을 붙인다: "Jan 1, 12:00 AM PST" */
    whenZone: (unlock: Date, now: Date) => `${teaserDate(unlock, now)}, ${fmt({ ...TIME, timeZoneName: 'short' })(unlock)}`,
    /** 시간대 약칭: "PST", "GMT+9" */
    zone: (d: Date) => new Intl.DateTimeFormat(locale, { timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? '',
    /** "Jan 1, 2027, 12:00 AM" (한국어 "2027년 1월 1일 0시"에 해당) */
    dateHour: fmt({ year: 'numeric', month: 'short', day: 'numeric', ...TIME }),
    /** 큰 시계: 오전·오후 없이 "12:00" (24시간제 지역은 "00:00") */
    hm: (d: Date) => {
      const parts = new Intl.DateTimeFormat(locale, TIME).formatToParts(d)
      return parts
        .filter((p) => p.type !== 'dayPeriod')
        .map((p) => p.value)
        .join('')
        .trim()
    },
    /** 요일 약칭: "Fri" */
    weekday: fmt({ weekday: 'short' }),
    /** 요일: "Friday" */
    weekdayName: fmt({ weekday: 'long' }),
    /** 숫자 월·일: "1/1" (지역에 따라 "1/1" 또는 일/월 순서) */
    monthDot: fmt({ month: 'numeric', day: 'numeric' }),
    /** 문서 날짜: "Nov 11, 2026" */
    dotDate: ymd,
    countdown,
    /** 숫자: "1,234" */
    number: (n: number) => number.format(n),
    /** 단·복수: plural(1, 'day') → "1 day", plural(3, 'day') → "3 days". 불규칙 복수는 other로 준다 */
    plural: (n: number, one: string, other = `${one}s`) => `${number.format(n)} ${plural.select(n) === 'one' ? one : other}`,
  }
}

export type EnDates = ReturnType<typeof makeEnDates>
