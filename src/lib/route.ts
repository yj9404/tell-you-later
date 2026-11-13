// 편지 링크: https://<도메인>[/en]/t/{테마id}/#v1.<payload>
// - 경로의 테마는 카카오톡 등이 그리는 공유 미리보기(og:image·og:title)를 테마별로 고르기 위한 것이다.
//   빌드 후처리(scripts/make-theme-pages.mjs)가 테마마다 dist/t/{id}/index.html을 만든다.
// - 경로 맨 앞의 /en은 화면 언어다. 보낸 사람이 쓴 언어를 받는 사람에게도 그대로 쓴다.
//   언어는 payload에 넣지 않는다(v1 형식을 바꾸지 않기 위해). 경로가 없거나 /en이 아니면 한국어다.
// - 편지 내용과 테마는 # 뒤만 읽는다. 테마는 payload에 든 값이 기준이다.
// - 경로 없는 옛 링크(/#v1.…)도 같은 방식으로 열린다.
import type { Lang } from '../i18n/lang.ts'

const THEME_PATH = /\/t\/[^/]+\/?$/
const EN_PATH = /^\/en(\/|$)/

/** 주소에서 편지 부분(# 뒤)만 꺼낸다. 없으면 빈 문자열. */
export function fragmentOf(href: string): string {
  return new URL(href).hash.replace(/^#/, '')
}

/** 경로로 화면 언어를 정한다: /en, /en/… 은 영어, 나머지는 한국어. */
export function langOf(pathname: string): Lang {
  return EN_PATH.test(pathname) ? 'en' : 'ko'
}

/** 언어별 사이트 첫 경로: 한국어 "/", 영어 "/en/" */
export function langRoot(lang: Lang): string {
  return lang === 'en' ? '/en/' : '/'
}

/** 보낼 링크. origin은 끝에 /가 없는 사이트 주소. */
export function letterLink(origin: string, lang: Lang, themeId: string, fragment: string): string {
  return `${origin}${langRoot(lang)}t/${themeId}/#${fragment}`
}

/** 쓰기 화면으로 돌아갈 경로. 테마 경로(/t/{id}/)로 들어왔어도 그 언어의 첫 경로로 돌아간다. */
export function homePath(pathname: string): string {
  return langRoot(langOf(pathname.replace(THEME_PATH, '/')))
}
