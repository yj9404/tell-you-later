// OG 이미지용 잠김 화면. ?theme={id}의 Locked를 고정된 예시 데이터와 고정된 "지금"으로 그린다.
// 시각은 모두 현지 시간 기준으로 만들어 어느 시간대에서 돌려도 같은 글이 나온다.
import { createRoot } from 'react-dom/client'
import '../../src/base.css'
import { loadFonts } from '../../src/lib/fonts.ts'
import { THEMES, themeFonts } from '../../src/themes/registry.ts'
import type { LetterInfo } from '../../src/themes/types.ts'

const id = new URLSearchParams(location.search).get('theme')
const theme = THEMES.find((t) => t.id === id)
if (!theme) throw new Error(`모르는 테마: ${id}`)

// 실제 사람 이름처럼 보이지 않게 쓰기 화면의 자리표시 글을 그대로 쓴다. 부르는 말("○○아")은 뺀다.
const letter: LetterInfo = {
  to: '받는 사람',
  toEmpty: true,
  from: '보내는 사람',
  tint: theme.tints ? theme.tints[0].hex : null,
  createdAt: new Date(2026, 10, 13, 21, 40),
  unlockAt: new Date(2027, 0, 1, 0, 0),
}
const now = new Date(2026, 11, 7, 20, 34, 12).getTime()
const noop = () => {}

loadFonts(['Noto+Sans+KR:wght@400;700;900'])
loadFonts(themeFonts(theme, 'ko'))
createRoot(document.getElementById('root')!).render(
  <theme.Locked letter={letter} now={now} status="waiting" onRetry={noop} onSaveCalendar={noop} onWrite={noop} />,
)

// 글꼴과 그림을 다 받은 뒤에 표시를 남긴다. make-og-image.mjs가 이 표시를 기다렸다가 찍는다.
async function ready() {
  const sheets = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
  await Promise.all(sheets.map((l) => (l.sheet ? null : new Promise((r) => l.addEventListener('load', r, { once: true })))))
  await new Promise((r) => requestAnimationFrame(r))
  await document.fonts.ready
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})))
  // 한글 글꼴은 글자 범위별 파일로 나뉘어 있어 늦게 요청되는 파일이 있다. 받는 중인 글꼴이 잠시 동안 하나도 없을 때까지 기다린다.
  for (let quiet = 0; quiet < 3; ) {
    await new Promise((r) => setTimeout(r, 150))
    await document.fonts.ready
    quiet = [...document.fonts].some((f) => f.status === 'loading') ? 0 : quiet + 1
  }
  await new Promise((r) => requestAnimationFrame(r))
  document.documentElement.dataset.ready = '1'
}
void ready()
