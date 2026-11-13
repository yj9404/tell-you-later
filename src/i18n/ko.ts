// 한국어 화면 문구. 영어(en.ts)는 이 객체와 같은 모양이어야 한다(키가 빠지면 타입 검사가 잡는다).
// 이름·날짜가 들어가는 문장은 어순이 언어마다 달라서 문자열을 잇지 않고 함수로 둔다.
// 테마 화면의 문구는 테마 폴더의 strings.ts에 있다.
import { eventTitle } from '../lib/calendar.ts'
import * as d from '../lib/date.ts'
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

/** 날짜·시각 표기. 영어는 같은 이름의 Intl 함수(date-en.ts)다. */
const date = {
  teaserDate: d.teaserDate,
  fullDate: d.fullDate,
  clock: d.clock,
  dateClock: d.dateClock,
  dayDate: d.dayDate,
  longDate: d.longDate,
  whenText: d.whenText,
  /** 한국어 화면은 받는 사람 대부분이 같은 시간대라 시간대를 붙이지 않는다 */
  dateClockZone: d.dateClock,
  /** 잠김 화면 상세 시각: "1월 1일 0시" (영어는 시간대 약칭을 붙인다) */
  whenZone: d.whenText,
  /** 시간대 약칭("PST"). 한국어 화면은 쓰지 않아 빈 문자열 */
  zone: (_at: Date) => '',
  /** "2027년 1월 1일 0시" */
  dateHour: d.dateHour,
  /** 큰 시계: "0:00" (오전·오후 없이) */
  hm: d.hm,
  /** 요일 한 글자: "금" */
  weekday: d.weekday,
  /** 요일: "금요일" */
  weekdayName: (at: Date) => `${d.weekday(at)}요일`,
  /** 숫자 월·일: "1.1" */
  monthDot: d.monthDot,
  /** 문서 날짜: "2026. 11. 11." */
  dotDate: d.dotDate,
  chatStamp: d.chatStamp,
  countdown: d.countdown,
  number: (n: number) => n.toLocaleString('ko-KR'),
}

export const ko = {
  serviceName: '할 말이 있는데 나중에 할게',
  wordmark: { src: '/wordmark.svg', width: 94, height: 40 },
  /** 쓰기 화면 위의 다른 언어로 가는 링크 */
  otherLang: { label: 'English', href: '/en/', lang: 'en' as Lang },

  date,
  /** 예고 문장: "할 말이 있는데 1월 1일에 할게" */
  teaser: (unlock: Date, now: Date) => d.teaser(unlock, now),
  /** 예고 문장을 날짜 앞뒤로 나눈 것. 날짜만 강조할 때 쓴다: "할 말이 있는데" / "" + 날짜 + "에 할게" */
  teaserParts: { line1: '할 말이 있는데', before: '', after: '에 할게' },
  /** 공유·복사에 붙이는 문구: "지민아, 할 말이 있는데 1월 1일에 할게" */
  shareText: d.shareText,
  /** 부르는 말: "지민아". 이름이 비면 빈 문자열 */
  callName: d.callName,
  /** 캘린더 일정 제목 */
  eventTitle,

  /** 받는 사람 화면에서 편지를 열지 못했을 때 */
  openError,
  /** 쓰기 화면에서 잠그지 못했을 때. 잠그기는 네트워크를 쓰지 않아 원인과 상관없이 같은 안내다 */
  lockError: '링크를 만들지 못했습니다. 다시 시도해 주세요.',

  write: {
    title: ['정한 날이 와야', '열리는 편지를 써요'],
    lead: '완성된 링크를 보내면, 그날 전에는 누구도 열 수 없어요.',
    letter: '편지',
    to: '받는 사람',
    toPlaceholder: '이름이나 별명',
    from: '보내는 사람',
    fromPlaceholder: '내 이름',
    when: '여는 날',
    whenValue: (at: Date) => `${d.fullDate(at)} ${d.clock(at)}`,
    body: '편지 내용',
    bodyPlaceholder: '여기에 하고 싶은 말을 쓰세요.\n\n빈 줄을 넣으면 문단이 나뉘고, 테마에 따라 말풍선이나 장면이 나뉩니다.',
    lockNote: '이 칸만 잠겨요',
    teaserTitle: '링크를 열면 바로 보이는 문장',
    teaserTo: (name: string) => `${name}에게`,
    teaserNote: '이름과 날짜는 위 칸에서 바뀝니다. 편지 내용은 그날까지 보이지 않아요.',
    pastNote: '정한 시각이 이미 지났어요. 여는 날을 눌러 다시 정해 주세요.',
    lookTitle: '어떤 모습으로 도착할까요',
    lookNote: '받는 사람 화면을 미리 볼 수 있어요.',
    color: '색',
    fullPreview: '내 편지로 전체 화면 미리보기',
    submit: '잠그고 링크 만들기',
    submitting: '잠그는 중…',
    bottomNote: '편지는 서버에 저장되지 않아요. 링크를 잃어버리면 다시 찾을 수 없어요.',
    needNames: '받는 사람과 보내는 사람을 적어 주세요.',
    needBody: '그날 할 말을 적어 주세요.',
    needFuture: '열리는 시각은 지금보다 뒤여야 합니다. 날짜를 다시 정해 주세요.',
  },

  when: {
    title: '언제 열리게 할까요',
    newyear: '새해 0시',
    year: '1년 뒤 지금',
    custom: '직접 고르기',
    /** "2027년 1월 1일 금요일 오전 0:00" */
    dayClock: (at: Date) => `${d.dayDate(at)} ${d.clock(at)}`,
    date: '날짜',
    ampm: '오전 오후',
    am: '오전',
    pm: '오후',
    /** 오전/오후 버튼이 시각 입력칸 뒤에 오는지 */
    ampmAfter: false,
    hour: '시',
    minute: '분',
    past: (at: string) => `이미 지난 시각이에요(${at}). 지금보다 뒤로 정해 주세요.`,
    opens: (at: string, days: number) => `${at}에 열려요. ${days > 0 ? `앞으로 ${days}일 남았어요.` : '오늘 안에 열려요.'}`,
    confirm: '이때로 정하기',
  },

  preview: {
    /** 이름을 비워 둔 미리보기의 자리표시 글 */
    to: '받는 사람',
    from: '보내는 사람',
    example: '여기에 그날 할 말이 보입니다.\n\n지금은 예시 문장이에요. 편지를 쓰면 쓴 내용이 이 자리에 그대로 나타납니다.\n\n그날이 되기 전에는 아무도 못 봅니다.',
    before: '여는 날 전',
    after: '여는 날 이후',
    enlargeBefore: '여는 날 전 화면 크게 보기',
    enlargeAfter: '여는 날 이후 화면 크게 보기',
    title: '미리보기',
    exampleNote: '예시 문장입니다',
    tabs: '보여줄 화면',
    tabBefore: '그날 전',
    tabAfter: '그날 이후',
    replay: '다시 보기',
    close: '미리보기 닫기',
  },

  done: {
    title: ['잠갔어요.', '이제 링크를 보내세요'],
    lead: (at: Date) => `${d.longDate(at)}에 열립니다. 그 전에는 누구도 열 수 없습니다.`,
    link: '편지 링크',
    length: (n: string) => `${n}자`,
    tooLong: '링크가 길어서 메신저에 따라 중간에 잘릴 수 있습니다. 보낸 뒤 링크가 열리는지 확인하거나, 편지를 줄여 다시 만들어 주세요.',
    copy: '복사',
    copyLink: '링크만 복사',
    copied: '복사했어요',
    copyFailed: '복사하지 못했습니다. 위 링크를 길게 눌러 직접 복사해 주세요.',
    share: '공유하기',
    view: '받는 사람 화면 보기',
    watch: '열리는 모습 마지막으로 보기',
    watchNote: '이 화면을 떠나면 그날까지 누구도 볼 수 없습니다',
    bottomNote: ['편지는 서버에 저장되지 않습니다. 이 링크가 편지 그 자체예요.', '링크를 잃어버리면 다시 찾을 수 없어요.'],
    again: '새 편지 쓰기',
  },

  broken: {
    title: ['링크가 깨져서', '편지를 열 수 없어요'],
    lead: '링크가 중간에 잘렸거나 일부가 바뀐 것 같습니다. 편지는 링크 안에만 들어 있어서 여기서 되살릴 수 없어요. 보낸 사람에게 링크를 다시 받아 주세요.',
    write: '새로 쓰기',
  },

  calendar: {
    save: '캘린더에 저장',
    google: '구글 캘린더',
    outlook: 'Outlook',
    ics: '파일로 받기(.ics)',
    blocked: 'Safari/Chrome에서 열면 캘린더에 저장할 수 있어요',
    close: '닫기',
    /** .ics 일정 설명의 첫 줄. 다음 줄에 링크가 붙는다 */
    icsNote: '그날 이 링크에서 열어 볼 수 있어요.',
  },

  /** 테마 화면 공통 */
  locked: {
    retry: '다시 시도',
    opening: '여는 중…',
    showAll: '한 번에 보기',
    replay: '다시 보기',
  },
}

export type Strings = typeof ko
