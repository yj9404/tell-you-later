// 한국어 화면 문구. 영어(en.ts)는 이 객체와 같은 모양이어야 한다(키가 빠지면 타입 검사가 잡는다).
// 이름·날짜가 들어가는 문장은 어순이 언어마다 달라서 문자열을 잇지 않고 함수로 둔다.
import { callName } from '../lib/date.ts'
import { eventTitle } from '../lib/calendar.ts'
import type { ErrorCode } from '../lib/errors.ts'
import type { Lang } from './lang.ts'

const openError: Record<ErrorCode, string> = {
  'not-yet': '아직 열쇠가 나오지 않았어요. 기기 시계가 맞는지 확인하고 잠시 뒤 다시 시도해 주세요.',
  network: '열쇠를 받아오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  unsupported: '이 브라우저에서는 편지를 풀 수 없어요. 다른 브라우저에서 열어 주세요.',
  corrupt: '편지를 풀지 못했어요. 링크가 일부 잘렸을 수 있어요.',
  'broken-link': '링크가 깨져서 편지를 열 수 없어요.',
  'lock-failed': '편지를 열지 못했어요.',
  unknown: '편지를 열지 못했어요.',
}

export const ko = {
  /** 쓰기 화면 위의 다른 언어로 가는 링크 */
  otherLang: { label: 'English', href: '/en/', lang: 'en' as Lang },

  /** 부르는 말: "지민아". 이름이 비면 빈 문자열 */
  callName,
  /** 캘린더 일정 제목 */
  eventTitle,

  /** 받는 사람 화면에서 편지를 열지 못했을 때 */
  openError,
  /** 쓰기 화면에서 잠그지 못했을 때. 잠그기는 네트워크를 쓰지 않아 원인과 상관없이 같은 안내다 */
  lockError: '링크를 만들지 못했습니다. 다시 시도해 주세요.',
}

export type Strings = typeof ko
