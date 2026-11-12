/** 보낸 사람을 모를 때(서버로 이름을 보내지 않는 경로)의 제목 */
export const EVENT_TITLE = '할 말이 있는 날'

/** 일정 길이(분). 모든 저장 방식이 같은 값을 쓴다. */
export const EVENT_MINUTES = 10

/** UTC 기준 YYYYMMDDTHHmmssZ. iCalendar와 구글 캘린더 링크가 같은 형식을 쓴다. */
export const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** "{보낸 사람}{이/가} 할 말이 있는 날". 조사는 마지막 글자의 받침으로, 한글이 아니면 "가". */
export function eventTitle(from: string): string {
  const name = from.trim()
  const last = [...name].at(-1)?.codePointAt(0) ?? 0
  const isSyllable = last >= 0xac00 && last <= 0xd7a3
  const josa = isSyllable && (last - 0xac00) % 28 !== 0 ? '이' : '가'
  return `${name}${josa} ${EVENT_TITLE}`
}

export interface CalendarEvent {
  title: string
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
    `text=${encodeURIComponent(e.title)}`,
    `dates=${stamp(e.start)}/${stamp(endOf(e))}`,
    `details=${encodeURIComponent(e.link)}`,
  ]
  return `https://calendar.google.com/calendar/render?${q.join('&')}`
}

/**
 * Android 캘린더 앱의 일정 추가 화면을 여는 인텐트 주소.
 * 캘린더 앱이 없거나 인텐트를 못 받는 브라우저는 구글 캘린더 웹 링크로 넘어간다.
 */
export function androidIntentUrl(e: CalendarEvent): string {
  const enc = encodeURIComponent
  return [
    'intent:#Intent',
    'action=android.intent.action.INSERT',
    'type=vnd.android.cursor.item/event',
    `S.title=${enc(e.title)}`,
    `S.description=${enc(e.link)}`,
    `l.beginTime=${e.start.getTime()}`,
    `l.endTime=${endOf(e).getTime()}`,
    `S.browser_fallback_url=${enc(googleCalendarUrl(e))}`,
    'end',
  ].join(';')
}

const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

export function outlookCalendarUrl(e: CalendarEvent): string {
  // URLSearchParams는 공백을 +로 바꾸는데 Outlook은 이를 글자 그대로 보여 줄 때가 있어 직접 인코딩한다.
  // path·rru는 예전 딥링크 처리기가 작성 화면을 고르는 데 쓰는 값이라 함께 보낸다.
  const params: Record<string, string> = {
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
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
