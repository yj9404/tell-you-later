// 모든 표기는 보는 사람 기기의 현지 시간대 기준이다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const md = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
const ymd = (d: Date) => `${d.getFullYear()}년 ${md(d)}`

/**
 * 예고 문구("할 말이 있는데 {날짜}에 할게")에 들어가는 날짜.
 * 개봉일이 오늘부터 1년 이내면 "n월 n일", 그보다 멀면 "yyyy년 n월 n일".
 * 정확히 1년 뒤 같은 날은 "n월 n일"만 쓰면 오늘로 읽히므로 연도를 붙인다.
 */
export function teaserDate(unlock: Date, now: Date): string {
  const sameDayNextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  return unlock < sameDayNextYear ? md(unlock) : ymd(unlock)
}

export function teaser(unlock: Date, now: Date): string {
  return `할 말이 있는데 ${teaserDate(unlock, now)}에 할게`
}

/**
 * 부르는 말: "지민아", "하나야". 받침 있으면 "아", 없으면 "야", 한글로 끝나지 않으면 조사 없이 "Alex".
 * 이름이 비어 있으면 빈 문자열.
 */
export function callName(to: string): string {
  const name = to.trim()
  if (!name) return ''
  const last = [...name].at(-1)?.codePointAt(0) ?? 0
  const josa = last >= 0xac00 && last <= 0xd7a3 ? ((last - 0xac00) % 28 ? '아' : '야') : ''
  return name + josa
}

/** 공유·복사에 붙이는 문구: "지민아, 할 말이 있는데 1월 1일에 할게". 이름이 없으면 예고 문구만. */
export function shareText(to: string, unlock: Date, now: Date): string {
  const call = callName(to)
  return call ? `${call}, ${teaser(unlock, now)}` : teaser(unlock, now)
}

/** "2027년 1월 1일 금요일 0시" (분이 0이 아니면 "0시 30분") */
export function longDate(d: Date): string {
  const min = d.getMinutes() ? ` ${d.getMinutes()}분` : ''
  return `${ymd(d)} ${WEEKDAYS[d.getDay()]}요일 ${d.getHours()}시${min}`
}

/** "2027년 1월 1일 0시" */
export function dateHour(d: Date): string {
  const min = d.getMinutes() ? ` ${d.getMinutes()}분` : ''
  return `${ymd(d)} ${d.getHours()}시${min}`
}

/** "오전 11:06" */
export function clock(d: Date): string {
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 여는 날을 고를 때의 시각 표기. 자정을 "오전 0:00"으로 써서 그날 밤 12시와 헷갈리지 않게 한다. 정오는 "오후 12:00". */
export function openClock(d: Date): string {
  const h = d.getHours()
  return `${h < 12 ? `오전 ${h}` : `오후 ${h % 12 || 12}`}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "2026년 11월 11일 오전 11:06" */
export function dateClock(d: Date): string {
  return `${ymd(d)} ${clock(d)}`
}

/** 채팅 화면의 시각 표기. 오늘이면 "오늘 오전 11:06", 아니면 날짜를 붙인다. */
export function chatStamp(d: Date, now: Date): string {
  if (d.toDateString() === now.toDateString()) return `오늘 ${clock(d)}`
  return `${d.getFullYear() === now.getFullYear() ? md(d) : ymd(d)} ${clock(d)}`
}

/** 남은 시간. 큰 단위 두 개만 보여준다: "50일 12시간", "3시간 5분", "4분 12초", "9초" */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d > 0) return `${d}일 ${h}시간`
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

/** "2026년 11월 12일 목요일" */
export function dayDate(d: Date): string {
  return `${ymd(d)} ${WEEKDAYS[d.getDay()]}요일`
}

/** "2026. 11. 11." */
export function dotDate(d: Date): string {
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

/** "2026년 11월 11일" */
export function fullDate(d: Date): string {
  return ymd(d)
}

/** 새해 0시 */
export function nextNewYear(now: Date): Date {
  return new Date(now.getFullYear() + 1, 0, 1)
}

/** 1년 뒤 지금: 같은 날 같은 시각(분 단위) */
export function oneYearLater(now: Date): Date {
  return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
}

/** "0시", "0시 30분" */
export function hourMin(d: Date): string {
  return `${d.getHours()}시${d.getMinutes() ? ` ${d.getMinutes()}분` : ''}`
}

/** 예고 문구의 날짜에 시각을 붙인 것: "1월 1일 0시" */
export function whenText(unlock: Date, now: Date): string {
  return `${teaserDate(unlock, now)} ${hourMin(unlock)}`
}

/** "1.1" */
export function monthDot(d: Date): string {
  return `${d.getMonth() + 1}.${d.getDate()}`
}

/** "0:00" */
export function hm(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "00:00" */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "2027. 1. 1.(금) 00:00" */
export function dotDateTime(d: Date): string {
  return `${dotDate(d)}(${WEEKDAYS[d.getDay()]}) ${hhmm(d)}`
}

/** 요일 한 글자: "금" */
export function weekday(d: Date): string {
  return WEEKDAYS[d.getDay()]
}

/** 주격 조사를 붙인다: 영진 → "영진이", 민지 → "민지가". 한글로 끝나지 않으면 "Kim(이)가". */
export function iGa(name: string): string {
  const code = name.charCodeAt(name.length - 1)
  if (!(code >= 0xac00 && code <= 0xd7a3)) return `${name}(이)가`
  return name + ((code - 0xac00) % 28 ? '이' : '가')
}

/** 두 시각 사이의 날 수(달력 기준) */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86400_000)
}
