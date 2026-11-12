import { stamp } from './ics.ts'

/** 외부 캘린더에 남는 제목. 누가 보냈는지는 드러내지 않는다. */
export const EVENT_TITLE = '할 말이 있는 날'
const EVENT_MINUTES = 30

export interface CalendarEvent {
  start: Date
  /** 받은 편지 링크(현재 페이지 URL 전체) */
  link: string
}

export type Platform = 'android' | 'ios' | 'desktop'

export function detectPlatform(ua: string, touchPoints = 0): Platform {
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  // iPadOS 13+ Safari는 Mac과 같은 UA를 보낸다. 터치 지점 수로 구분한다.
  if (/Macintosh/.test(ua) && touchPoints > 1) return 'ios'
  return 'desktop'
}

/** 카카오톡·인스타그램 같은 앱 안의 브라우저. 새 창·파일·data URL이 막히는 경우가 많다. */
export function isInAppBrowser(ua: string): boolean {
  return /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|\bLine\/|NAVER\(inapp|DaumApps|everytimeApp|; wv\)/.test(ua)
}

const endOf = (e: CalendarEvent) => new Date(e.start.getTime() + EVENT_MINUTES * 60_000)

export function googleCalendarUrl(e: CalendarEvent): string {
  const q = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(EVENT_TITLE)}`,
    `dates=${stamp(e.start)}/${stamp(endOf(e))}`,
    `details=${encodeURIComponent(e.link)}`,
  ]
  return `https://calendar.google.com/calendar/render?${q.join('&')}`
}

const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

export function outlookCalendarUrl(e: CalendarEvent): string {
  // URLSearchParams는 공백을 +로 바꾸는데 Outlook은 이를 글자 그대로 보여 줄 때가 있어 직접 인코딩한다.
  // path·rru는 예전 딥링크 처리기가 작성 화면을 고르는 데 쓰는 값이라 함께 보낸다.
  const params: Record<string, string> = {
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: EVENT_TITLE,
    startdt: iso(e.start),
    enddt: iso(endOf(e)),
    body: e.link,
  }
  const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.join('&')}`
}

export function icsDataUrl(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}
