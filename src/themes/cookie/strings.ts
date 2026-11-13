// cookie 테마 문구. en은 ko와 같은 모양이어야 한다. 말투는 반말.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  bakedFor: (to: string, from: string) => `${to}에게, ${d.iGa(from)} 포춘쿠키 하나 구워놨어`,
  /** 잠김 화면 제목 두 줄: "1월 1일 0시에" / "깨져" */
  breaksAt: (unlock: Date, now: Date) => [`${d.whenText(unlock, now)}에`, '깨져'],
  untilBreak: '깨지기까지',
  breaking: '깨는 중…',
  promise: (_unlock: Date) => '그 전엔 누구도 못 깨. 진짜로.',
  writeOwn: '나도 구워두기',
  /** 열림 연출 중 제목 */
  opening: (unlock: Date, created: Date) => d.whenText(unlock, created),
  slipTitle: (from: string) => `${d.iGa(from)} 넣어둔 쪽지`,
  bakedBy: (from: string) => `${d.iGa(from)} 구움`,
  lucky: (unlock: Date) => `행운의 날짜 ${unlock.getMonth() + 1} . ${unlock.getDate()}`,
  crackAgain: '다시 깨기',
}

const en: typeof ko = {
  bakedFor: (to, from) => `${to}, ${from} baked you a fortune cookie`,
  breaksAt: (unlock, now) => ['Cracks open', g.date.whenText(unlock, now)],
  untilBreak: 'Cracks in',
  breaking: 'Cracking…',
  // 제목에 시간대까지 넣으면 큰 글자로 세 줄이 되어 시간대는 이 문장에 둔다.
  promise: (unlock) => `Nobody can crack it before ${g.date.clock(unlock)} ${g.date.zone(unlock)}. For real.`,
  writeOwn: 'Bake one too',
  opening: (unlock, created) => g.date.whenText(unlock, created),
  slipTitle: (from) => `A fortune from ${from}`,
  bakedBy: (from) => `Baked by ${from}`,
  lucky: (unlock) => `Lucky date ${g.date.monthDot(unlock)}`,
  crackAgain: 'Crack another',
}

export const strings = { ko, en }
