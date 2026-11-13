// player 테마 문구. en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  playingFrom: '예약 재생목록에서 재생 중',
  toName: (to: string) => `${to}에게`,
  /** 앨범 재킷 윗줄(앨범 이름) */
  jacket: '할 말이 있는데',
  notPlayed: '아직 재생 전',
  today: '오늘',
  preparing: '재생 준비 중…',
  plays: (unlock: Date, now: Date) => [`${d.whenText(unlock, now)}에 재생돼요.`, '그 전에는 누구도 재생할 수 없어요.'],
  writeOwn: '나도 한 곡 남기기',
  progress: (cur: number, total: number) => `재생 진행 ${cur}/${total}줄`,
  lines: (cur: number, total: number) => `${cur} / ${total}줄`,
  fromStart: '처음부터',
  pause: '일시정지',
  play: '재생',
  lyrics: '가사',
}

const en: typeof ko = {
  playingFrom: 'Playing from Scheduled',
  toName: (to) => `For ${to}`,
  // 예고 문장은 재킷 폭에 안 들어가서 서비스 이름을 앨범 이름으로 쓴다.
  jacket: 'Tell You Later',
  notPlayed: 'Not played yet',
  today: 'Today',
  preparing: 'Getting ready…',
  plays: (unlock, now) => [`Plays ${g.date.whenZone(unlock, now)}.`, 'Nobody can play it before then.'],
  writeOwn: 'Leave a track too',
  progress: (cur, total) => `Played ${cur} of ${total} lines`,
  lines: (cur, total) => `${cur} / ${total} lines`,
  fromStart: 'From the start',
  pause: 'Pause',
  play: 'Play',
  lyrics: 'Lyrics',
}

export const strings = { ko, en }
