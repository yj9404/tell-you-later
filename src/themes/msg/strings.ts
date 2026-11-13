// msg 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  introLast: '그게 뭐냐면…',
  typingShown: '입력 중 표시',
  typing: '입력 중',
  /** 점선 칩: "문자 1통, 1월 1일 0시에 도착" */
  pill: (unlock: Date, now: Date) => `문자 1통, ${d.whenText(unlock, now)}에 도착`,
  nobody: '그 전에는 누구도 읽을 수 없어요.',
  countdownLabel: '도착까지',
  receiving: '받는 중…',
  writeOwn: '나도 예약 문자 보내기',
  reply: '답장도 예약해서 보내기',
}

const en: typeof ko = {
  introLast: "So here's the thing…",
  typingShown: 'Typing indicator',
  typing: 'Typing…',
  pill: (unlock, now) => `1 text · ${g.date.whenZone(unlock, now)}`,
  nobody: 'Nobody can read it before then.',
  countdownLabel: 'Arrives in',
  receiving: 'Receiving…',
  writeOwn: 'Schedule a text too',
  reply: 'Schedule a reply',
}

export const strings = { ko, en }
