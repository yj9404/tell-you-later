// 가려진 글(redact) 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  /** 문서 머리줄 왼쪽 */
  classified: '비공개 문서',
  /** 문서 머리줄 오른쪽: 잠김 "공개 2027. 1. 1. 00:00" / 열림 "공개됨 …" */
  head: (released: boolean, unlock: Date, _now: Date) => `${released ? '공개됨' : '공개'} ${d.dotDate(unlock)} ${d.hhmm(unlock)}`,
  byline: (from: string, to: string) => `작성 ${from} / 수신 ${to}`,
  /** 도장 자리. 한국어 제목은 짧아 제목 오른쪽에 찍는다 */
  stampPos: 'top:96px',
  stampBefore: '공개 전',
  stampAfter: '공개됨',
  bodyAria: '가려진 문서 본문',
  nobody: '공개 전에는 누구도 볼 수 없어요',
  releasing: '공개하는 중…',
  writeOwn: '나도 비공개 문서 만들기',
  written: (at: Date) => `${d.fullDate(at)} 작성`,
  reply: '답장도 비공개로 보내기',
}

const en: typeof ko = {
  classified: 'Private document',
  head: (released, unlock, now) => `${released ? 'Released' : 'Release'} ${g.date.whenZone(unlock, now)}`,
  byline: (from, to) => `From ${from} / To ${to}`,
  // 영어 제목은 줄이 길어 오른쪽 위에 찍으면 글자를 덮는다. 문서 오른쪽 아래에 찍는다.
  stampPos: 'bottom:28px',
  stampBefore: 'SEALED',
  stampAfter: 'RELEASED',
  bodyAria: 'Redacted document text',
  nobody: 'Nobody can see it before release',
  releasing: 'Releasing…',
  writeOwn: 'Make a private doc',
  written: (at) => `Written ${g.date.fullDate(at)}`,
  reply: 'Reply privately',
}

export const strings = { ko, en }
