// dm 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  typingUntil: (date: string) => `${date}까지 입력 중`,
  introMiddle: '할 말이 있는데',
  introLast: '그게 뭐냐면…',
  typingShown: '입력 중 표시',
  arrival: (unlock: Date) => [`${d.dateHour(unlock)}에 도착해요.`, '그 전에는 누구도 읽을 수 없어요.'],
  countdownLabel: '도착까지',
  receiving: '받는 중…',
  writeOwn: '나도 예약 DM 보내기',
  justArrived: '방금 도착',
  typing: '입력 중',
  reply: '답장도 예약해서 보내기',
}

const en: typeof ko = {
  typingUntil: (date) => `Typing until ${date}`,
  introMiddle: 'Got something to tell you',
  introLast: "So here's the thing…",
  typingShown: 'Typing indicator',
  arrival: (unlock) => [`Arrives ${g.date.dateClockZone(unlock)}.`, 'Nobody can read it before then.'],
  countdownLabel: 'Arrives in',
  receiving: 'Receiving…',
  writeOwn: 'Schedule a DM too',
  justArrived: 'Just now',
  typing: 'Typing…',
  reply: 'Schedule a reply',
}

export const strings = { ko, en }
