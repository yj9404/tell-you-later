// 책 한 권(color) 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  caption: (from: string, to: string) => `${d.iGa(from)} ${to}에게 보낸 책 한 권`,
  by: (from: string) => `${from} 지음`,
  toName: (to: string) => `${to}에게`,
  /** 띠지 첫 줄 */
  openable: (unlock: Date, now: Date) => `${d.whenText(unlock, now)}에 펼칠 수 있어요`,
  nobody: '그 전에는 누구도 펼칠 수 없어요',
  untilOpen: '펼칠 수 있을 때까지',
  opening: '펼치는 중…',
  writeOwn: '나도 한 권 보내기',
  openedOn: '펼친 날',
  openedValue: (unlock: Date) => `${d.dotDate(unlock)} ${d.hm(unlock)}`,
  reopen: '다시 펼치기',
  reply: '답장 한 권 보내기',
  /** 표지 제목 글자 크기(px). 영어 예고 문장은 길어서 작게 쓴다 */
  coverSize: 25,
}

const en: typeof ko = {
  caption: (from, to) => `A book from ${from} to ${to}`,
  by: (from) => `by ${from}`,
  toName: (to) => `For ${to}`,
  openable: (unlock, now) => `Opens ${g.date.whenZone(unlock, now)}`,
  nobody: 'Nobody can open it before then',
  untilOpen: 'Opens in',
  opening: 'Opening…',
  writeOwn: 'Send a book too',
  openedOn: 'Opened',
  openedValue: (unlock) => g.date.dateClock(unlock),
  reopen: 'Open again',
  reply: 'Send a book back',
  coverSize: 20,
}

export const strings = { ko, en }
