// 항공 봉투(air) 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  /** 본문 글꼴과 손글씨(받는 사람·서명) 글꼴 */
  font: { body: "'Gowun Dodum',sans-serif", pen: "'Nanum Pen Script',cursive" },
  from: '보내는 사람',
  airmail: '항공 우편 · AIR MAIL',
  to: '받는 사람',
  /** 봉투의 받는 사람: "지민에게" */
  toName: (to: string) => `${to}에게`,
  doNotOpen: (unlock: Date, now: Date) => `${d.whenText(unlock, now)} 전 개봉 금지`,
  envelope: (from: string, to: string, notice: string) => `보내는 사람 ${from}, 받는 사람 ${to}. ${notice}`,
  opens: (unlock: Date, now: Date) => [`${d.whenText(unlock, now)}에 열려요`, '그 전에는 누구도 뜯어 볼 수 없어요'],
  writeOwn: '나도 한 통 부치기',
  opened: (unlock: Date, created: Date) => `${d.whenText(unlock, created)}, 편지가 열렸어요`,
  /** 편지지 맨 위: "지민에게" */
  dear: (to: string) => `${to}에게`,
  signed: (from: string, created: Date) => `${d.fullDate(created)}, ${from}`,
  restart: '처음부터 다시',
  manual: '직접 넘겨 읽기',
  reply: '답장 부치기',
}

const en: typeof ko = {
  // 한글 손글씨체는 라틴 글자가 작고 가늘어 영어용 손글씨체를 따로 쓴다.
  font: { body: "'Nunito',sans-serif", pen: "'Caveat',cursive" },
  from: 'From',
  airmail: 'PAR AVION · AIR MAIL',
  to: 'To',
  toName: (to) => to,
  // 봉투 오른쪽 아래 좁은 자리라 날짜만 쓴다(시각은 아래 안내 문장에 있다).
  doNotOpen: (unlock, now) => `Do not open before ${g.date.teaserDate(unlock, now)}`,
  envelope: (from, to, notice) => `From ${from}, to ${to}. ${notice}`,
  opens: (unlock, now) => [`Opens ${g.date.whenZone(unlock, now)}`, 'Nobody can tear it open before then'],
  writeOwn: 'Send one too',
  opened: (unlock, created) => `${g.date.whenText(unlock, created)}. Your letter is open`,
  dear: (to) => `Dear ${to},`,
  signed: (from, created) => `${from}, ${g.date.fullDate(created)}`,
  restart: 'Start over',
  manual: 'Read at my own pace',
  reply: 'Send a reply',
}

export const strings = { ko, en }
