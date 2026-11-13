import { EVENT_MINUTES, stamp } from './calendar.ts'

const escape = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n')

/** RFC 5545: 한 줄은 75옥텟까지. 넘으면 다음 줄을 공백으로 시작해 잇는다. */
function fold(line: string): string {
  const enc = new TextEncoder()
  let out = ''
  let width = 0
  for (const ch of line) {
    const w = enc.encode(ch).length
    if (width + w > 74) {
      out += '\r\n '
      width = 1
    }
    out += ch
    width += w
  }
  return out
}

/** note는 일정 설명의 첫 줄(화면 언어)이고, 다음 줄에 링크가 붙는다. */
export function buildIcs(opts: { title: string; note: string; unlockAt: Date; link: string; uid: string }): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tell-you-later//KO',
    'BEGIN:VEVENT',
    `UID:${opts.uid}@tell-you-later`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.unlockAt)}`,
    `DTEND:${stamp(new Date(opts.unlockAt.getTime() + EVENT_MINUTES * 60_000))}`,
    `SUMMARY:${escape(opts.title)}`,
    `DESCRIPTION:${escape(`${opts.note}\n${opts.link}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
}

export function downloadIcs(ics: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'letter.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
