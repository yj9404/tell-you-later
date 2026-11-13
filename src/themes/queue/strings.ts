// queue 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g, enDates } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ordinal = new Intl.PluralRules('en', { type: 'ordinal' })
const SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }

const ko = {
  header: '예약 입장',
  myTurn: '나의 대기순서',
  /** 큰 숫자 뒤의 작은 글자: "번째" (영어는 서수 접미사 "th") */
  suffix: (_n: number) => '번째',
  progress: (percent: number) => (percent < 1 ? '대기 진행률 1퍼센트 미만' : `대기 진행률 ${percent}퍼센트`),
  entryTime: '입장 시각',
  entryValue: (unlock: Date) => `${d.fullDate(unlock)} ${d.clock(unlock)}`,
  timeLeft: '남은 시간',
  until: '그 전에는',
  nobody: '누구도 입장할 수 없어요',
  note: ['대기순서는 1초에 한 번씩 줄어요.', '창을 닫았다가 다시 와도 순서는 그대로예요.'],
  status: { opening: '입장하는 중', error: '입장하지 못했어요', wait: '접속 대기 중', run: '순서가 다가오고 있어요', go: '입장하는 중' },
  preparing: '입장 준비 중…',
  writeOwn: '나도 줄 세우기',
  entered: '입장 완료',
  message: (from: string) => `${d.iGa(from)} 남긴 말`,
  written: (at: Date) => `${d.fullDate(at)}에 씀`,
  waited: (days: number) => (days > 0 ? `${days}일 기다림` : '같은 날 열림'),
  enterAgain: '다시 입장하기',
}

const en: typeof ko = {
  header: 'Scheduled entry',
  myTurn: 'Your place in line',
  suffix: (n) => SUFFIX[ordinal.select(n)] ?? 'th',
  progress: (percent) => (percent < 1 ? 'Queue progress under 1%' : `Queue progress ${percent}%`),
  entryTime: 'Entry time',
  entryValue: (unlock) => g.date.dateClockZone(unlock),
  timeLeft: 'Time left',
  until: 'Until then',
  nobody: 'Nobody gets in',
  note: ['Your place moves up once every second.', "Close this and come back later. You won't lose your spot."],
  status: { opening: 'Getting you in', error: "Couldn't get in", wait: 'Waiting to connect', run: 'Almost your turn', go: 'Getting you in' },
  preparing: 'Getting ready…',
  writeOwn: 'Start my own queue',
  entered: "You're in",
  message: (from) => `A message from ${from}`,
  written: (at) => `Written ${g.date.fullDate(at)}`,
  waited: (days) => (days > 0 ? `Waited ${enDates.plural(days, 'day')}` : 'Opened the same day'),
  enterAgain: 'Enter again',
}

export const strings = { ko, en }
