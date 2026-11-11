import { describe, expect, it } from 'vitest'
import { decodeLink, encodeLink, LinkError, linkHash, type Letter } from './codec.ts'
import { countdown, longDate, teaserDate } from './date.ts'
import { splitBubbles } from './bubbles.ts'
import { QUICKNET, roundForTime, timeForRound } from './drand.ts'
import { lockLetter, openLetter } from './timelock.ts'
import type { ChainClient } from 'drand-client'
import v1 from './fixtures/v1.json' with { type: 'json' }

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
  it('카운트다운', () => {
    expect(countdown((50 * 24 + 12) * 3600_000)).toBe('50일 12시간')
    expect(countdown(3 * 3600_000 + 5 * 60_000)).toBe('3시간 5분')
    expect(countdown(61_000)).toBe('1분 1초')
    expect(countdown(900)).toBe('1초')
    expect(countdown(-5)).toBe('0초')
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
  it.each([['v1', v1]])('%s 픽스처 링크가 그대로 복호화된다', async (_name, fixture) => {
    const saved: ChainClient = { ...offline, get: async () => fixture.beacon }
    const l = decodeLink(fixture.link)
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
