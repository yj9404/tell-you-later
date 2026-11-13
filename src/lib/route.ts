// 편지 링크: https://<도메인>/t/{테마id}/#v1.<payload>
// - 경로의 테마는 카카오톡 등이 그리는 공유 미리보기(og:image·og:title)를 테마별로 고르기 위한 것이다.
//   빌드 후처리(scripts/make-theme-pages.mjs)가 테마마다 dist/t/{id}/index.html을 만든다.
// - 앱은 경로를 보지 않고 # 뒤만 읽는다. 테마는 payload에 든 값이 기준이다.
// - 경로 없는 옛 링크(/#v1.…)도 같은 방식으로 열린다.

const THEME_PATH = /\/t\/[^/]+\/?$/

/** 주소에서 편지 부분(# 뒤)만 꺼낸다. 없으면 빈 문자열. */
export function fragmentOf(href: string): string {
  return new URL(href).hash.replace(/^#/, '')
}

/** 보낼 링크. origin은 끝에 /가 없는 사이트 주소. */
export function letterLink(origin: string, themeId: string, fragment: string): string {
  return `${origin}/t/${themeId}/#${fragment}`
}

/** 쓰기 화면으로 돌아갈 경로. 테마 경로(/t/{id}/)로 들어왔어도 사이트 첫 경로로 돌아간다. */
export function homePath(pathname: string): string {
  return pathname.replace(THEME_PATH, '/')
}
