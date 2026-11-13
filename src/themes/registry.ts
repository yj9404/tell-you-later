import type { Lang } from '../i18n/lang.ts'
import type { Theme } from './types.ts'
import { dm } from './dm/index.tsx'
import { msg } from './msg/index.tsx'
import { lock } from './lock/index.tsx'
import { queue } from './queue/index.tsx'
import { player } from './player/index.tsx'
import { cookie } from './cookie/index.tsx'
import { color } from './color/index.tsx'
import { redact } from './redact/index.tsx'
import { air } from './air/index.tsx'
import { greet } from './greet/index.tsx'
import { approval } from './approval/index.tsx'
import { report } from './report/index.tsx'

// 테마를 추가하려면 폴더를 만들고 여기에 한 줄만 더한다. 쓰기 화면에 이 순서로 나온다.
export const THEMES: readonly Theme[] = [dm, msg, lock, queue, player, cookie, color, redact, air, greet, approval, report]

/** 그 언어의 쓰기 화면에 나오는 테마. 이름이 없는 언어에서는 숨긴다(영어판의 approval, report 등). */
export function themesFor(lang: Lang): readonly Theme[] {
  return THEMES.filter((t) => t.name[lang] !== undefined)
}

/** 테마를 보여줄 언어. 그 언어 이름이 없는(숨긴) 테마는 영어 경로로 열어도 한국어 문구 그대로 보여준다. */
export function themeLang(theme: Theme, lang: Lang): Lang {
  return theme.name[lang] !== undefined ? lang : 'ko'
}

/** 모르는 번호(나중에 추가된 테마의 링크를 옛 페이지로 연 경우 등)는 첫 테마로 보여준다. */
export function themeByCode(code: number): Theme {
  return THEMES.find((t) => t.code === code) ?? THEMES[0]
}
