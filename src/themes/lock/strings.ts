// lock 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  now: '지금',
  unlockNote: '이 시각이 되면 잠금이 풀려요',
  hidden: (unlock: Date, now: Date) => `알림 내용은 ${d.whenText(unlock, now)}까지 숨겨져 있어요. 그 전에는 누구도 잠금을 풀 수 없어요.`,
  untilUnlock: '잠금 해제까지',
  unlocking: '잠금 해제 중…',
  writeOwn: '나도 예약 메모 남기기',
  /** 홈 화면 아이콘 이름: 메시지, 달력, 사진, 지도, 날씨, 시계, 설정, 메모 */
  apps: ['메시지', '달력', '사진', '지도', '날씨', '시계', '설정', '메모'],
  /** 열릴 때 알림: "1월 1일이야. 이제 말할게" */
  openLine: (date: string) => `${date}이야. 이제 말할게`,
  notes: '메모',
  toTitle: (to: string) => `${to}에게`,
  signed: (from: string, at: Date) => `${from}, ${d.fullDate(at)}에 씀`,
}

const en: typeof ko = {
  now: 'now',
  unlockNote: 'Unlocks at this time',
  hidden: (unlock, now) => `Notification hidden until ${g.date.whenZone(unlock, now)}. Nobody can unlock it before then.`,
  untilUnlock: 'Unlocks in',
  unlocking: 'Unlocking…',
  writeOwn: 'Leave a note too',
  apps: ['Messages', 'Calendar', 'Photos', 'Maps', 'Weather', 'Clock', 'Settings', 'Notes'],
  openLine: (date) => `It's ${date}. Here's what I wanted to say`,
  notes: 'Notes',
  toTitle: (to) => `To ${to}`,
  signed: (from, at) => `${from}, written ${g.date.fullDate(at)}`,
}

export const strings = { ko, en }
