import { describe, expect, it } from 'vitest'
import { decodeLink, encodeLink, LinkError, linkHash, type Letter } from './codec.ts'
import { androidIntentUrl, detectPlatform, eventTitle, googleCalendarUrl, icsDataUrl, isInAppBrowser, outlookCalendarUrl } from './calendar.ts'
import { buildIcs } from './ics.ts'
import { callName, chatStamp, clock, countdown, dateClock, longDate, shareText, teaserDate } from './date.ts'
import { lyricLines, splitBubbles } from './bubbles.ts'
import { QUICKNET, roundForTime, timeForRound } from './drand.ts'
import { lockLetter, openLetter } from './timelock.ts'
import type { ChainClient } from 'drand-client'
import v1 from './fixtures/v1.json' with { type: 'json' }
import { fragmentOf, homePath, letterLink } from './route.ts'
import { THEMES } from '../themes/registry.ts'
import themePages from '../../scripts/themes.json' with { type: 'json' }

const letter = (over: Partial<Letter> = {}): Letter => ({
  theme: 3,
  tint: 2,
  to: '지민',
  from: '영진',
  round: 28_000_000,
  created: 29_700_000,
  body: Uint8Array.from({ length: 300 }, (_, i) => (i * 7) % 256),
  ...over,
})

describe('링크 코덱', () => {
  it('왕복', () => {
    const l = letter()
    const link = encodeLink(l)
    expect(link).toMatch(/^v1\.[A-Za-z0-9_-]+$/)
    expect(decodeLink(link)).toEqual(l)
    expect(decodeLink('#' + link)).toEqual(l)
  })

  it('한글·이모지 이름, 빈 이름', () => {
    for (const [to, from] of [['👩‍👧 엄마', 'José 🎄'], ['', ''], ['가'.repeat(20), 'a b']]) {
      const l = letter({ to, from })
      expect(decodeLink(encodeLink(l))).toEqual(l)
    }
  })

  it('큰 본문과 라운드 최댓값', () => {
    const l = letter({ round: 0xffffffff, body: Uint8Array.from({ length: 7000 }, (_, i) => i % 251) })
    expect(decodeLink(encodeLink(l))).toEqual(l)
  })

  it('깨진 입력은 LinkError', () => {
    const link = encodeLink(letter())
    const broken = ['', '#', 'v1.', 'v2.abcd', 'hello', 'v1.!!!!', 'v1.AAAA', link.slice(0, 40), link.slice(0, 200), link + '=%']
    for (const b of broken) expect(() => decodeLink(b), b).toThrow(LinkError)
  })

  it('이름 길이 바이트가 본문을 넘어가면 LinkError', () => {
    const bytes = new Uint8Array(250)
    bytes[5] = 1
    bytes[10] = 255
    const link = 'v1.' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(() => decodeLink(link)).toThrow(LinkError)
  })

  it('같은 링크는 같은 해시', () => {
    expect(linkHash('v1.abc')).toBe(linkHash('v1.abc'))
    expect(linkHash('v1.abc')).not.toBe(linkHash('v1.abd'))
  })
})

describe('예고 문구의 날짜 표기', () => {
  const now = new Date(2026, 10, 11, 14, 0)
  it('1년 이내는 월·일만', () => {
    expect(teaserDate(new Date(2027, 0, 1), now)).toBe('1월 1일')
    expect(teaserDate(new Date(2026, 10, 11, 15, 0), now)).toBe('11월 11일')
    expect(teaserDate(new Date(2027, 10, 10, 23, 59), now)).toBe('11월 10일')
  })
  it('1년 뒤 같은 날부터는 연도를 붙인다', () => {
    expect(teaserDate(new Date(2027, 10, 11, 14, 0), now)).toBe('2027년 11월 11일')
    expect(teaserDate(new Date(2030, 4, 5), now)).toBe('2030년 5월 5일')
  })
  it('긴 표기', () => {
    expect(longDate(new Date(2027, 0, 1))).toBe('2027년 1월 1일 금요일 0시')
    expect(longDate(new Date(2026, 11, 25, 9, 30))).toBe('2026년 12월 25일 금요일 9시 30분')
  })
  it('오전·오후 시각: 자정은 "오전 0:00", 정오는 "오후 12:00"', () => {
    const at = (h: number, m = 0) => new Date(2027, 0, 1, h, m)
    expect(clock(at(0))).toBe('오전 0:00')
    expect(clock(at(0, 5))).toBe('오전 0:05')
    expect(clock(at(1))).toBe('오전 1:00')
    expect(clock(at(11, 59))).toBe('오전 11:59')
    expect(clock(at(12))).toBe('오후 12:00')
    expect(clock(at(13, 6))).toBe('오후 1:06')
    expect(clock(at(23, 59))).toBe('오후 11:59')
    // clock을 쓰는 표기도 같은 규칙
    expect(dateClock(at(0))).toBe('2027년 1월 1일 오전 0:00')
    expect(chatStamp(at(0), at(9))).toBe('오늘 오전 0:00')
    expect(chatStamp(at(12), new Date(2026, 10, 12))).toBe('2027년 1월 1일 오후 12:00')
  })
  it('카운트다운', () => {
    expect(countdown((50 * 24 + 12) * 3600_000)).toBe('50일 12시간')
    expect(countdown(3 * 3600_000 + 5 * 60_000)).toBe('3시간 5분')
    expect(countdown(61_000)).toBe('1분 1초')
    expect(countdown(900)).toBe('1초')
    expect(countdown(-5)).toBe('0초')
  })
  it('공유 문구: 받침 있으면 "아", 없으면 "야", 한글이 아니면 조사 없이', () => {
    const jan1 = new Date(2027, 0, 1)
    expect(shareText('지민', jan1, now)).toBe('지민아, 할 말이 있는데 1월 1일에 할게')
    expect(shareText('하나', jan1, now)).toBe('하나야, 할 말이 있는데 1월 1일에 할게')
    expect(shareText(' 영진 ', jan1, now)).toBe('영진아, 할 말이 있는데 1월 1일에 할게')
    expect(shareText('Alex', jan1, now)).toBe('Alex, 할 말이 있는데 1월 1일에 할게')
    expect([callName('지민'), callName('하나'), callName('Alex'), callName('  ')]).toEqual(['지민아', '하나야', 'Alex', ''])
    expect(shareText('하나 🎄', jan1, now)).toBe('하나 🎄, 할 말이 있는데 1월 1일에 할게')
    expect(shareText('', jan1, now)).toBe('할 말이 있는데 1월 1일에 할게')
    expect(shareText('  ', new Date(2030, 4, 5), now)).toBe('할 말이 있는데 2030년 5월 5일에 할게')
  })
})

describe('말풍선 나누기', () => {
  it('빈 줄 단위로 나누고, 줄바꿈 하나는 같은 말풍선에 둔다', () => {
    expect(splitBubbles('지민아\n잘 지내?\n\n나는 잘 지내.\r\n\r\n\n새해 복 많이 받아')).toEqual([
      '지민아\n잘 지내?',
      '나는 잘 지내.',
      '새해 복 많이 받아',
    ])
  })
  it('짧은 글은 말풍선 하나', () => {
    expect(splitBubbles('  안녕. 잘 지내? 나는 잘 지내!  ')).toEqual(['안녕. 잘 지내? 나는 잘 지내!'])
    expect(splitBubbles(' \n\n ')).toEqual([])
  })
  it('빈 줄 없는 긴 글은 문장 단위로 묶어 120자 이하로 나눈다', () => {
    const sentence = '이걸 쓰는 지금은 11월이고 너는 아직 고민 중이야. ' // 31자
    const text = sentence.repeat(12).trim()
    const bubbles = splitBubbles(text)
    expect(bubbles.length).toBeGreaterThan(2)
    for (const b of bubbles) {
      expect(b.length).toBeLessThanOrEqual(120)
      expect(b.endsWith('.')).toBe(true)
    }
    for (const b of bubbles.slice(0, -1)) expect(b.length).toBeGreaterThanOrEqual(80)
    expect(bubbles.join(' ')).toBe(text)
  })
  it('문장 부호가 없는 긴 글도 잘린다', () => {
    const bubbles = splitBubbles('가나다라 '.repeat(100))
    for (const b of bubbles) expect(b.length).toBeLessThanOrEqual(120)
    expect(splitBubbles('가'.repeat(2000)).every((b) => b.length <= 120)).toBe(true)
    expect(splitBubbles('가'.repeat(2000)).join('')).toBe('가'.repeat(2000))
  })
})

describe('가사 줄 나누기', () => {
  const upTo = (n: number) => (line: string) => line.length <= n
  it('빈 줄로 구분된 문단이 한 줄이고, 문단 안의 줄바꿈은 공백이 된다', () => {
    expect(lyricLines('지민아,\n잘 지내?\n\n새해 복 많이 받아', upTo(24))).toEqual(['지민아, 잘 지내?', '새해 복 많이 받아'])
  })
  it('긴 문단은 문장 단위로 max자까지 묶는다', () => {
    const sentence = '이걸 쓰는 지금은 11월이야. ' // 17자
    const text = sentence.repeat(5).trim()
    const lines = lyricLines(text, upTo(24))
    expect(lines).toEqual(Array(5).fill(sentence.trim()))
    expect(lyricLines(text, upTo(40))).toEqual([...Array(2).fill(`${sentence}${sentence.trim()}`), sentence.trim()])
  })
  it('문장 하나가 max자를 넘으면 공백이나 글자 수로 자르고, 글자를 잃지 않는다', () => {
    const lines = lyricLines('가나다라 '.repeat(30), upTo(24))
    expect(lines.every((l) => l.length <= 24)).toBe(true)
    expect(lines.join(' ')).toBe('가나다라 '.repeat(30).trim())
    expect(lyricLines('가'.repeat(100), upTo(24)).join('')).toBe('가'.repeat(100))
  })
})

describe('라운드 ↔ 시각', () => {
  it('라운드의 시각은 요청한 시각 이후이고 한 주기 안이다', () => {
    for (const t of [Date.UTC(2027, 0, 1), Date.UTC(2027, 0, 1) + 1, Date.UTC(2026, 11, 31, 15, 0, 1), Date.now() + 61_234]) {
      const round = roundForTime(t)
      expect(timeForRound(round)).toBeGreaterThanOrEqual(t)
      expect(timeForRound(round) - t).toBeLessThan(QUICKNET.period * 1000)
      expect(roundForTime(timeForRound(round))).toBe(round)
    }
  })
})

describe('타임락 암호문', () => {
  // 네트워크 없이 확인한다: 서명이 아직 없다고 답하는 클라이언트.
  const offline: ChainClient = {
    options: { disableBeaconVerification: true, noCache: false },
    chain: () => ({ baseUrl: '', info: async () => QUICKNET }),
    get: async () => {
      throw new Error('offline')
    },
    latest: async () => {
      throw new Error('offline')
    },
  }

  it('잠근 편지는 링크에 실려도 그대로이고, 개봉 전에는 열리지 않는다', async () => {
    const round = roundForTime(Date.now() + 3600_000)
    const body = await lockLetter('안녕 🎉\n잘 지내?', round, offline)
    const back = decodeLink(encodeLink(letter({ round, body })))
    expect(back.body).toEqual(body)
    await expect(openLetter(back.body, back.round, offline)).rejects.toMatchObject({ kind: 'not-yet' })
  })

  // 옛 형식으로 이미 보낸 링크가 계속 열려야 한다. 픽스처는 실제 메인넷 라운드로 만든 것이고,
  // 그 라운드의 서명을 함께 저장해 두어 네트워크 없이 확인한다. 형식을 늘리면 픽스처도 추가한다.
  // 주소 형태: 경로 없는 옛 링크(/#v1.…)와 테마 경로가 붙은 링크(/t/dm/#v1.…) 모두 앱이 읽는 방식(fragmentOf)으로 연다.
  it.each([
    ['v1', '/#', v1],
    ['v1', '/t/dm/#', v1],
  ])('%s 픽스처 링크가 그대로 복호화된다 (%s…)', async (_name, path, fixture) => {
    const saved: ChainClient = { ...offline, get: async () => fixture.beacon }
    const l = decodeLink(fragmentOf(`https://example.com${path}${fixture.link}`))
    expect(l.to).toBe(fixture.to)
    expect(l.from).toBe(fixture.from)
    expect(l.round).toBe(fixture.beacon.round)
    expect(await openLetter(l.body, l.round, saved)).toBe(fixture.text)
  })

  it('2,000자 편지: 한글·이모지·줄바꿈', async () => {
    const text = Array.from('지민아, 이걸 쓰는 지금은 11월이야 🍂\n\n너는 아직 고민 중이고…\n'.repeat(60)).slice(0, 2000).join('')
    const round = roundForTime(Date.now() + 3600_000)
    const body = await lockLetter(text, round, offline)
    const link = encodeLink(letter({ round, body }))
    expect(decodeLink(link).body).toEqual(body)
    // 반복이 많은 글이라 압축이 잘 된다. 평문 UTF-8(약 5KB)보다 훨씬 짧아야 한다.
    expect(link.length).toBeLessThan(1500)
  })
})

describe('캘린더 링크', () => {
  const ev = { title: '영진이 할 말이 있는 날', start: new Date('2026-12-24T15:00:00Z'), link: 'https://example.com/#abc&d=1' }

  it('제목 조사: 받침 있으면 "이", 없거나 한글이 아니면 "가"', () => {
    expect(eventTitle('영진')).toBe('영진이 할 말이 있는 날')
    expect(eventTitle('지민 ')).toBe('지민이 할 말이 있는 날')
    expect(eventTitle('하나')).toBe('하나가 할 말이 있는 날')
    expect(eventTitle('엄마')).toBe('엄마가 할 말이 있는 날')
    expect(eventTitle('Alex')).toBe('Alex가 할 말이 있는 날')
    expect(eventTitle('영진 🎄')).toBe('영진 🎄가 할 말이 있는 날')
    expect(eventTitle('ㄱ')).toBe('ㄱ가 할 말이 있는 날')
  })

  it('Android 인텐트: 값은 인코딩, 시각은 ms, 구글 캘린더 웹 링크로 대체', () => {
    const s = androidIntentUrl(ev)
    expect(s.startsWith('intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event;')).toBe(true)
    expect(s.endsWith(';end')).toBe(true)
    const parts = Object.fromEntries(s.split(';').slice(1, -1).map((p) => [p.slice(0, p.indexOf('=')), p.slice(p.indexOf('=') + 1)]))
    expect(decodeURIComponent(parts['S.title'])).toBe(ev.title)
    expect(decodeURIComponent(parts['S.description'])).toBe(ev.link)
    expect(parts['l.beginTime']).toBe(String(Date.UTC(2026, 11, 24, 15, 0)))
    expect(parts['l.endTime']).toBe(String(Date.UTC(2026, 11, 24, 15, 10)))
    expect(decodeURIComponent(parts['S.browser_fallback_url'])).toBe(googleCalendarUrl(ev))
    // 값 안의 ; # & = 가 인텐트 구분자를 깨지 않는다
    expect(parts['S.description']).not.toMatch(/[;#&=]/)
  })

  it('구글 캘린더: 10분 일정, UTC 시각, 링크 전체를 설명에 넣는다', () => {
    const u = new URL(googleCalendarUrl(ev))
    expect(u.origin + u.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(u.searchParams.get('action')).toBe('TEMPLATE')
    expect(u.searchParams.get('text')).toBe('영진이 할 말이 있는 날')
    expect(u.searchParams.get('dates')).toBe('20261224T150000Z/20261224T151000Z')
    expect(u.searchParams.get('details')).toBe(ev.link)
  })

  it('Outlook: ISO 8601 시각, 공백을 +로 바꾸지 않는다', () => {
    const s = outlookCalendarUrl(ev)
    expect(s.startsWith('https://outlook.live.com/calendar/0/deeplink/compose?')).toBe(true)
    expect(s).not.toContain('+')
    const u = new URL(s)
    expect(u.searchParams.get('subject')).toBe('영진이 할 말이 있는 날')
    expect(u.searchParams.get('startdt')).toBe('2026-12-24T15:00:00Z')
    expect(u.searchParams.get('enddt')).toBe('2026-12-24T15:10:00Z')
    expect(u.searchParams.get('body')).toBe(ev.link)
  })

  it('.ics: 10분 일정, 제목을 그대로 쓴다', () => {
    const ics = buildIcs({ title: ev.title, unlockAt: ev.start, link: ev.link, uid: 'x' })
    expect(ics).toContain('\r\nDTSTART:20261224T150000Z\r\n')
    expect(ics).toContain('\r\nDTEND:20261224T151000Z\r\n')
    expect(ics).toContain('\r\nSUMMARY:영진이 할 말이 있는 날\r\n')
  })

  it('data URL은 ics를 그대로 되돌릴 수 있게 인코딩한다', () => {
    const ics = 'BEGIN:VCALENDAR\r\nSUMMARY:편지, 열림 #&+\r\nEND:VCALENDAR'
    const u = icsDataUrl(ics)
    expect(u.startsWith('data:text/calendar;charset=utf-8,')).toBe(true)
    expect(decodeURIComponent(u.slice(u.indexOf(',') + 1))).toBe(ics)
  })

  it('UA로 기기와 인앱 브라우저를 가른다', () => {
    const android = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'
    expect(detectPlatform(android)).toBe('android')
    expect(detectPlatform(iphone)).toBe('ios')
    expect(detectPlatform(mac, 5)).toBe('ios')
    expect(detectPlatform(mac, 0)).toBe('desktop')
    expect(isInAppBrowser(iphone)).toBe(false)
    expect(isInAppBrowser(iphone + ' KAKAOTALK 10.8.5')).toBe(true)
    expect(isInAppBrowser(android.replace('Mobile Safari', 'Mobile Safari Instagram 350.0.0'))).toBe(true)
  })
})

describe('링크 주소', () => {
  it('테마 경로를 붙여 만들고, 경로와 상관없이 # 뒤만 읽는다', () => {
    expect(letterLink('https://example.com', 'cookie', 'v1.abc')).toBe('https://example.com/t/cookie/#v1.abc')
    expect(fragmentOf('https://example.com/t/cookie/#v1.abc')).toBe('v1.abc')
    expect(fragmentOf('https://example.com/#v1.abc')).toBe('v1.abc')
    expect(fragmentOf('https://example.com/t/cookie/')).toBe('')
  })

  it('쓰기 화면으로 돌아갈 때는 테마 경로를 떼어 낸다', () => {
    expect(homePath('/t/dm/')).toBe('/')
    expect(homePath('/t/dm')).toBe('/')
    expect(homePath('/')).toBe('/')
  })

  // 빌드 후처리와 OG 이미지 스크립트는 TSX를 못 읽어 scripts/themes.json을 쓴다. 테마를 추가하면 거기도 더한다.
  it('scripts/themes.json이 테마 목록과 같다', () => {
    expect(themePages.map(({ id, name }) => ({ id, name }))).toEqual(THEMES.map((t) => ({ id: t.id, name: t.name })))
  })

  it('OG 이미지 문구는 테마 이름 + "으로/로 도착"이다', () => {
    for (const { name, og } of themePages) expect(og.label).toMatch(new RegExp(`^${name}(으로|로) 도착$`))
  })
})
