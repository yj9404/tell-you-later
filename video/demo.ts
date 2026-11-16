import { nextNewYear } from '../src/lib/date.ts'
import fixture from '../src/lib/fixtures/v1.json'
import type { LetterInfo } from '../src/themes/types.ts'

/** 영상 속 편지. 빈 줄마다 DM 말풍선 하나가 된다. */
export const DEMO = {
  to: '진영',
  from: '서연',
  body: '진영아, 새해 복 많이 받아!\n\n올해 내 편이 되어 줘서 정말 고마웠어.\n\n내년에도 잘 부탁해 🎉',
}

/** 링크 완성 화면에 보일 주소. 렌더링 서버(localhost)가 아니라 실제 사이트 주소로 보여준다. */
export const SITE = 'https://tell-you-later.0jin.app'
export const SITE_LABEL = 'tell-you-later.0jin.app'

/**
 * 링크 완성 화면의 링크 모양. 실제로 잠근 편지(테스트 픽스처)를 쓴다.
 * 렌더할 때마다 새로 잠그면 암호문이 매번 달라 프레임끼리 글자가 바뀐다.
 */
export const DEMO_FRAGMENT: string = fixture.link

// 쓰기 화면에서 "새해 0시"를 고르므로 받는 사람 화면도 같은 시각에 열린다.
// 날짜는 렌더하는 날 기준이라 영상 속 날짜도 그에 맞춰 바뀐다.
const START = new Date()

export const LETTER: LetterInfo = {
  to: DEMO.to,
  from: DEMO.from,
  tint: null,
  createdAt: START,
  unlockAt: nextNewYear(START),
}
