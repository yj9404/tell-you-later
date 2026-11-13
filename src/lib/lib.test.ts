import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeLink, encodeLink, LinkError, linkHash, type Letter } from './codec.ts'
import { androidIntentUrl, detectPlatform, eventTitle, googleCalendarUrl, icsDataUrl, isInAppBrowser, outlookCalendarUrl } from './calendar.ts'
import { buildIcs } from './ics.ts'
import { callName, chatStamp, clock, countdown, dateClock, iGa, longDate, shareText, teaserDate } from './date.ts'
import { lyricLines, splitBubbles } from './bubbles.ts'
import { QUICKNET, roundForTime, timeForRound } from './drand.ts'
import { lockLetter, openLetter } from './timelock.ts'
import { AppError, errorCode } from './errors.ts'
import { DrandError } from './drand.ts'
import type { ChainClient } from 'drand-client'
import v1 from './fixtures/v1.json' with { type: 'json' }
import { fragmentOf, homePath, langOf, letterLink } from './route.ts'
import { stringsFor } from '../i18n/index.ts'
import { customStart, tomorrowSameTime } from '../screens/when.ts'
import { strings as queueStrings } from '../themes/queue/strings.ts'
import { enLocale, makeEnDates } from '../i18n/date-en.ts'
import { THEMES, themeLang, themesFor } from '../themes/registry.ts'
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

describe('영어 날짜 표기', () => {
  const now = new Date(2026, 10, 11, 11, 6)
  const us = makeEnDates('en-US')
  const gb = makeEnDates('en-GB')
  const jan1 = new Date(2027, 0, 1)

  it('예고 문장: 1년 안이면 월 약칭과 일, 멀면 연도까지. 순서는 지역을 따른다', () => {
    expect(us.teaserDate(jan1, now)).toBe('Jan 1')
    expect(gb.teaserDate(jan1, now)).toBe('1 Jan')
    expect(us.teaserDate(new Date(2027, 10, 11), now)).toBe('Nov 11, 2027')
    expect(stringsFor('en').teaser(jan1, now)).toMatch(/^Got something to tell you\. Tell you on (Jan 1|1 Jan)\.$/)
  })

  it('12/24시간제는 지역을 따른다', () => {
    expect(us.clock(jan1)).toBe('12:00 AM')
    expect(gb.clock(jan1)).toBe('00:00')
    expect(us.clock(new Date(2027, 0, 1, 12))).toBe('12:00 PM')
    expect(us.longDate(new Date(2027, 0, 1, 9, 30))).toMatch(/^Friday, Jan 1, 2027,? (at )?9:30 AM$/)
  })

  it('시간대 약칭을 붙인다', () => {
    expect(us.dateClockZone(jan1)).toMatch(/^Jan 1, 2027, 12:00 AM \S+$/)
  })

  it('채팅 시각', () => {
    expect(us.chatStamp(new Date(2026, 10, 11, 9, 5), now)).toBe('Today 9:05 AM')
    expect(us.chatStamp(jan1, now)).toBe('Jan 1, 2027, 12:00 AM')
    expect(us.chatStamp(new Date(2026, 11, 24, 18), now)).toBe('Dec 24, 6:00 PM')
  })

  it('카운트다운은 "50d 12h", 단위 수를 고를 수 있다(대기열은 세 개)', () => {
    expect(us.countdown((50 * 24 + 12) * 3600_000)).toBe('50d 12h')
    expect(us.countdown(3 * 3600_000 + 5 * 60_000)).toBe('3h 5m')
    expect(us.countdown(61_000)).toBe('1m 1s')
    expect(us.countdown(-5)).toBe('0s')
    expect(us.countdown(((50 * 24 + 12) * 60 + 54) * 60_000, 3)).toBe('50d 12h 54m')
    expect(countdown(((50 * 24 + 12) * 60 + 54) * 60_000, 3)).toBe('50일 12시간 54분')
    expect(countdown(4 * 60_000 + 12_000, 3)).toBe('4분 12초')
  })

  it('복수형', () => {
    expect([us.plural(1, 'day'), us.plural(2, 'day'), us.plural(0, 'day'), us.plural(1234, 'day')]).toEqual(['1 day', '2 days', '0 days', '1,234 days'])
    expect(stringsFor('en').when.opens('Jan 1', 1)).toBe('Opens Jan 1. 1 day to go.')
  })

  it('공유 문구', () => {
    const en = stringsFor('en')
    expect(en.shareText(' Alex ', jan1, now)).toMatch(/^Alex, got something to tell you\. Tell you on (Jan 1|1 Jan)\.$/)
    expect(en.shareText('', jan1, now)).toBe(en.teaser(jan1, now))
  })

  it('테마가 쓰는 표기: 큰 시계, 요일, 숫자 월·일, 시간대', () => {
    expect(us.hm(jan1)).toBe('12:00')
    expect(gb.hm(jan1)).toBe('00:00')
    expect(us.hm(new Date(2027, 0, 1, 21, 5))).toBe('9:05')
    expect([us.weekday(jan1), us.weekdayName(jan1)]).toEqual(['Fri', 'Friday'])
    expect([us.monthDot(new Date(2027, 11, 25)), gb.monthDot(new Date(2027, 11, 25))]).toEqual(['12/25', '25/12'])
    expect(us.zone(jan1)).toMatch(/^\S+$/)
    expect(us.whenZone(jan1, now)).toBe(`Jan 1, 12:00 AM ${us.zone(jan1)}`)
  })

  it('기기 언어로 영어 로케일을 고른다', () => {
    expect(enLocale(['en-GB', 'ko-KR'])).toBe('en-GB')
    expect(enLocale(['de-DE'])).toBe('en-DE')
    expect(enLocale(['ko'])).toBe('en-KR')
    expect(enLocale(['ko-KR', 'en-AU'])).toBe('en-AU')
    expect(enLocale([])).toBe('en-US')
  })
})

describe('여는 날 시트: 직접 고르기의 처음 값', () => {
  const now = new Date(2026, 10, 13, 14, 19, 30)

  it('기본값은 내일 이 시각(분 단위)이다. 프리셋을 골라 두었어도 같다', () => {
    const tomorrow = new Date(2026, 10, 14, 14, 19)
    expect(customStart(null, now)).toEqual(tomorrow)
    expect(customStart({ kind: 'newyear' }, now)).toEqual(tomorrow)
    expect(customStart({ kind: 'year' }, now)).toEqual(tomorrow)
  })

  it('이미 직접 고른 시각이 아직 안 지났으면 그대로, 지났으면 내일 이 시각', () => {
    const later = new Date(2026, 11, 24, 18, 30)
    expect(customStart({ kind: 'custom', at: later }, now)).toEqual(later)
    expect(customStart({ kind: 'custom', at: new Date(2026, 10, 13, 9) }, now)).toEqual(new Date(2026, 10, 14, 14, 19))
  })

  it('월말·연말에는 다음 달·다음 해로 넘어간다', () => {
    expect(tomorrowSameTime(new Date(2026, 10, 30, 23, 59))).toEqual(new Date(2026, 11, 1, 23, 59))
    expect(tomorrowSameTime(new Date(2026, 11, 31, 8, 5))).toEqual(new Date(2027, 0, 1, 8, 5))
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
  it('두 줄 폭 안에서 구두점(쉼표·마침표·물음표·느낌표) 뒤에서 끊을 수 있으면 그 자리를 우선한다', () => {
    // 채울 만큼 채우면 "…this year, you"에서 끊기지만, 쉼표 뒤에서 끊는다.
    expect(lyricLines('Thank you for everything this year, you were always there for me', upTo(40))).toEqual([
      'Thank you for everything this year,',
      'you were always there for me',
    ])
    // 들어가는 만큼 구절을 묶는다(마침표 뒤도 끊는 자리).
    const en = "Hey, it's me. Writing this in November, while you're still figuring things out."
    expect(lyricLines(en, upTo(60))).toEqual(["Hey, it's me. Writing this in November,", "while you're still figuring things out."])
    expect(lyricLines('Are you okay? I miss you so much! Call me when you can', upTo(25))).toEqual(['Are you okay?', 'I miss you so much!', 'Call me when you can'])
    // 한국어: 채우면 "…많았어, 내일은"까지 들어가지만 쉼표 뒤에서 끊는다.
    expect(lyricLines('지민아 오늘 하루도 정말 고생 많았어, 내일은 더 좋은 일만 있을 거야', upTo(26))).toEqual([
      '지민아 오늘 하루도 정말 고생 많았어,',
      '내일은 더 좋은 일만 있을 거야',
    ])
    expect(lyricLines('보고 싶었어. 진짜로! 새해 복 많이 받아', upTo(12))).toEqual(['보고 싶었어. 진짜로!', '새해 복 많이 받아'])
    // 닫는 따옴표·괄호는 앞 구절에 붙고, 공백 없는 구두점(3.5, 1,000)에서는 끊지 않는다.
    expect(lyricLines('She said "hi." Then 3.5 hours and 1,000 words later we talked', upTo(30))).toEqual(['She said "hi."', 'Then 3.5 hours and 1,000 words', 'later we talked'])
  })
  it('구두점 자리에서 끊은 줄은 단어 하나여도 그대로 둔다(구두점 우선)', () => {
    expect(lyricLines('We finally did it, finally', upTo(18))).toEqual(['We finally did it,', 'finally'])
  })
  it('다음 구절이 두 줄보다 길어도 구두점 자리에서 먼저 끊고, 긴 구절은 새 줄부터 단어 단위로 채운다', () => {
    expect(lyricLines('Hi, I have been thinking about what you said the other night at dinner', upTo(30))).toEqual([
      'Hi,',
      'I have been thinking about',
      'what you said the other night',
      'at dinner',
    ])
  })
  it('구두점이 없을 때 채우다 마지막에 단어 하나만 남으면 앞 줄 끝 단어를 옮겨 두 단어로 만든다', () => {
    expect(lyricLines('Writing this in November while you are still figuring things out', upTo(56))).toEqual([
      'Writing this in November while you are still figuring',
      'things out',
    ])
    // 한국어도 어절 하나만 남는 경우 같은 규칙
    expect(lyricLines('이걸 쓰는 지금은 벌써 11월이야', upTo(15))).toEqual(['이걸 쓰는 지금은', '벌써 11월이야'])
    expect(lyricLines('하나 둘 셋 넷 다섯 여섯', upTo(13))).toEqual(['하나 둘 셋 넷', '다섯 여섯'])
    // 긴 구절 중간에서 단어 하나가 다음 구절과 못 붙고 혼자 남는 경우도 같다.
    expect(lyricLines('aaaa bbbb cccc dddd, eeeeeeeeeeeeee', upTo(14))).toEqual(['aaaa bbbb', 'cccc dddd,', 'eeeeeeeeeeeeee'])
  })
  it('옮기면 넘치거나, 글자 단위로 자른 자리면 그대로 둔다', () => {
    expect(lyricLines('가나다 라마바사아자차', upTo(9))).toEqual(['가나다', '라마바사아자차'])
    expect(lyricLines(`a ${'b'.repeat(30)}`, upTo(24))).toEqual(['a', 'b'.repeat(24), 'b'.repeat(6)])
    expect(lyricLines('aaaa bbbb cccc dddd', upTo(14))).toEqual(['aaaa bbbb', 'cccc dddd'])
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
    ['v1', '/en/t/dm/#', v1],
  ])('%s 픽스처 링크가 그대로 복호화된다 (%s…)', async (_name, path, fixture) => {
    const saved: ChainClient = { ...offline, get: async () => fixture.beacon }
    const l = decodeLink(fragmentOf(`https://example.com${path}${fixture.link}`))
    expect(l.to).toBe(fixture.to)
    expect(l.from).toBe(fixture.from)
    expect(l.round).toBe(fixture.beacon.round)
    expect(await openLetter(l.body, l.round, saved)).toBe(fixture.text)
  })

  // 화면은 Error.message가 아니라 코드로 문구를 고른다.
  describe('오류 코드', () => {
    const saved: ChainClient = { ...offline, get: async () => v1.beacon }
    afterEach(() => vi.unstubAllGlobals())

    it('링크 일부가 바뀌면 corrupt', async () => {
      const l = decodeLink(v1.link)
      const body = l.body.slice()
      body[body.length - 1] ^= 1
      await expect(openLetter(body, l.round, saved)).rejects.toSatisfy((e) => errorCode(e) === 'corrupt')
    })

    it('압축을 풀 수 없는 브라우저는 unsupported', async () => {
      // 압축된 평문(첫 바이트 1)이어야 이 경로를 탄다. 픽스처는 압축되어 있다.
      vi.stubGlobal('DecompressionStream', undefined)
      const l = decodeLink(v1.link)
      await expect(openLetter(l.body, l.round, saved)).rejects.toSatisfy((e) => errorCode(e) === 'unsupported')
    })

    it('오류 종류별 코드', () => {
      expect(errorCode(new DrandError('not-yet', 'x'))).toBe('not-yet')
      expect(errorCode(new DrandError('network', 'x'))).toBe('network')
      expect(errorCode(new AppError('lock-failed', 'x'))).toBe('lock-failed')
      expect(errorCode(new LinkError('x'))).toBe('broken-link')
      expect(errorCode(new Error('x'))).toBe('unknown')
      expect(errorCode('x')).toBe('unknown')
    })
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

  it('제목 조사: 받침 있으면 "이", 없으면 "가", 한글로 끝나지 않으면 "(이)가"', () => {
    expect(eventTitle('영진')).toBe('영진이 할 말이 있는 날')
    expect(eventTitle('지민 ')).toBe('지민이 할 말이 있는 날')
    expect(eventTitle('하나')).toBe('하나가 할 말이 있는 날')
    expect(eventTitle('엄마')).toBe('엄마가 할 말이 있는 날')
    expect(eventTitle('Alex')).toBe('Alex(이)가 할 말이 있는 날')
    expect(eventTitle('영진 🎄')).toBe('영진 🎄(이)가 할 말이 있는 날')
    expect(eventTitle('ㄱ')).toBe('ㄱ(이)가 할 말이 있는 날')
  })

  it('조사 규칙은 부르는 말·주격 조사·일정 제목이 같은 판정을 쓴다', () => {
    // 받침 있음 / 없음 / 한글로 끝나지 않음(라틴, 이모지, 자모)
    expect(['영진', '하나', 'Alex', '하나 🎄', 'ㄱ'].map(callName)).toEqual(['영진아', '하나야', 'Alex', '하나 🎄', 'ㄱ'])
    expect(['영진', '하나', 'Alex', '하나 🎄', 'ㄱ'].map(iGa)).toEqual(['영진이', '하나가', 'Alex(이)가', '하나 🎄(이)가', 'ㄱ(이)가'])
  })

  it('영어: 조사 없이 이름 그대로, 일정 제목은 "{from} has something to tell you"', () => {
    const en = stringsFor('en')
    expect([en.callName(' Alex '), en.callName('지민'), en.callName('  ')]).toEqual(['Alex', '지민', ''])
    expect(en.eventTitle(' Alex ')).toBe('Alex has something to tell you')
    expect(stringsFor('ko').eventTitle('영진')).toBe('영진이 할 말이 있는 날')
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
    const ics = buildIcs({ title: ev.title, note: '그날 이 링크에서 열어 볼 수 있어요.', unlockAt: ev.start, link: ev.link, uid: 'x' })
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
    expect(letterLink('https://example.com', 'ko', 'cookie', 'v1.abc')).toBe('https://example.com/t/cookie/#v1.abc')
    expect(letterLink('https://example.com', 'en', 'cookie', 'v1.abc')).toBe('https://example.com/en/t/cookie/#v1.abc')
    expect(fragmentOf('https://example.com/en/t/cookie/#v1.abc')).toBe('v1.abc')
    expect(fragmentOf('https://example.com/t/cookie/#v1.abc')).toBe('v1.abc')
    expect(fragmentOf('https://example.com/#v1.abc')).toBe('v1.abc')
    expect(fragmentOf('https://example.com/t/cookie/')).toBe('')
  })

  it('쓰기 화면으로 돌아갈 때는 테마 경로를 떼어 낸다', () => {
    expect(homePath('/t/dm/')).toBe('/')
    expect(homePath('/t/dm')).toBe('/')
    expect(homePath('/')).toBe('/')
  })

  it('언어는 경로 맨 앞의 /en으로 정하고, 그 밖(옛 링크 포함)은 한국어', () => {
    const cases: [string, string][] = [
      ['/', 'ko'],
      ['/t/dm/', 'ko'],
      ['/index.html', 'ko'],
      ['/en', 'en'],
      ['/en/', 'en'],
      ['/en/t/dm/', 'en'],
      ['/en/index.html', 'en'],
      ['/english/', 'ko'],
      ['/t/en/', 'ko'],
      ['/EN/', 'ko'],
    ]
    for (const [path, lang] of cases) expect(langOf(path), path).toBe(lang)
  })

  it('쓰기 화면으로 돌아갈 때(새로 쓰기·답장) 언어 경로는 남긴다', () => {
    expect(homePath('/en/t/dm/')).toBe('/en/')
    expect(homePath('/en/t/dm')).toBe('/en/')
    expect(homePath('/en/')).toBe('/en/')
    expect(homePath('/en')).toBe('/en/')
  })

  it('영어판 쓰기 화면은 approval, report를 숨기고, 숨긴 테마의 받은 링크는 한국어로 보여준다', () => {
    const en = themesFor('en').map((t) => t.id)
    expect(en).not.toContain('approval')
    expect(en).not.toContain('report')
    expect(en).toContain('dm')
    expect(themesFor('ko')).toHaveLength(THEMES.length)
    const byId = (id: string) => THEMES.find((t) => t.id === id)!
    expect(themeLang(byId('approval'), 'en')).toBe('ko')
    expect(themeLang(byId('report'), 'en')).toBe('ko')
    expect(themeLang(byId('dm'), 'en')).toBe('en')
    expect(themeLang(byId('approval'), 'ko')).toBe('ko')
  })

  it('테마 문구: 영어 대기순서는 서수, 숨긴 테마(approval, report)를 뺀 10개는 영어 이름이 있다', () => {
    const suffix = queueStrings.en.suffix
    expect([1, 2, 3, 4, 11, 12, 13, 21, 4179343].map((n) => `${n}${suffix(n)}`)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '4179343rd'])
    expect(queueStrings.ko.suffix(3)).toBe('번째')
    expect(themesFor('en').map((t) => t.id)).toEqual(['dm', 'msg', 'lock', 'queue', 'player', 'cookie', 'color', 'redact', 'air', 'greet'])
  })

  // 빌드 후처리와 OG 이미지 스크립트는 TSX를 못 읽어 scripts/themes.json을 쓴다. 테마를 추가하면 거기도 더한다.
  it('scripts/themes.json이 테마 목록과 같다', () => {
    expect(themePages.map(({ id, name }) => ({ id, name }))).toEqual(THEMES.map((t) => ({ id: t.id, name: t.name.ko })))
  })

  // 영어 미리보기 페이지(/en/t/{id}/)와 OG 이미지는 themes.json의 en으로 만든다. 영어판에 나오는 테마와 같아야 한다.
  it('scripts/themes.json의 en이 영어판 테마 목록·이름과 같고, OG 문구는 두 줄의 "Arrives …"다', () => {
    const en = themePages.flatMap((p) => ('en' in p && p.en ? [{ id: p.id, name: p.en.name }] : []))
    expect(en).toEqual(themesFor('en').map((t) => ({ id: t.id, name: t.name.en })))
    for (const p of themePages) {
      if (!('en' in p) || !p.en) continue
      expect(p.en.label).toHaveLength(2)
      expect(p.en.label.join(' ')).toMatch(/^Arrives /)
    }
  })

  // OG 문구를 테마 이름과 다르게 따로 지정한 테마. 이 테마들은 "…으로/로 도착" 형식만 본다.
  const CUSTOM_OG_LABEL = new Set(['greet'])

  it('OG 이미지 문구는 테마 이름 + "으로/로 도착"이다 (따로 지정한 테마 제외)', () => {
    for (const { id, name, og } of themePages) {
      const subject = CUSTOM_OG_LABEL.has(id) ? '.+' : name
      expect(og.label).toMatch(new RegExp(`^${subject}(으로|로) 도착$`))
    }
  })
})
