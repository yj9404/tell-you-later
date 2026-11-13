// greet 테마 문구. 한국어는 "좋은 하루"(단톡방 꽃 인사 카드), 영어는 "Blessings"(반짝이 축복 카드)로 그림까지 다르다.
// en은 ko와 같은 모양이어야 한다.
import { en as g } from '../../i18n/en.ts'
import * as d from '../../lib/date.ts'

const ko = {
  /** 맨 위 받는 사람 */
  to: (name: string) => `${name} 님`,
  /** 큰 인사말. 줄마다 색이 다르다(영어는 무지개 한 덩어리) */
  greeting: ['오늘도', '좋은 하루', '되세요'],
  notice: (from: string, unlock: Date) => [`${from} 님의 카드는`, `${d.dateHour(unlock)}에 열립니다`],
  lines: ['그 전에는 누구도 열어 볼 수 없습니다.', '건강이 최고입니다.'],
  /** 카운트다운 앞뒤 */
  before: '앞으로',
  after: '',
  writeOwn: '나도 카드 보내기',
  save: '달력에 적어두기',
  /** 열림 연출 첫 장면 */
  finally: (unlock: Date, created: Date) => `드디어 ${d.whenText(unlock, created)}입니다`,
  opened: '카드가 열렸습니다',
  signed: (from: string) => `${from} 드림`,
  reply: '답장 카드 보내기',
}

const en: typeof ko = {
  to: (name) => `To my dear ${name}`,
  greeting: ['Sending', 'Blessings'],
  notice: (from, unlock) => [`A card from ${from} opens`, g.date.dateClockZone(unlock)],
  lines: ['Nobody can open it before then.', 'Have a blessed day!!'],
  before: 'Only',
  after: 'to go!!!',
  writeOwn: 'Send a blessing too',
  save: 'Save to my calendar',
  finally: (unlock, created) => `Today is the day!! ${g.date.whenText(unlock, created)}`,
  opened: 'Your card is here!!',
  signed: (from) => `With love, ${from}`,
  reply: 'Send a blessing back',
}

export const strings = { ko, en }
