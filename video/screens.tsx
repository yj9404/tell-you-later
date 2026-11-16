import { memo, useCallback } from 'react'
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { stringsFor } from '../src/i18n/index.ts'
import { nextNewYear } from '../src/lib/date.ts'
import { letterLink } from '../src/lib/route.ts'
import { Done } from '../src/screens/Done.tsx'
import { Write } from '../src/screens/Write.tsx'
import writeCss from '../src/screens/write.module.css'
import screensCss from '../src/screens/screens.module.css'
import dmCss from '../src/themes/dm/dm.module.css'
import { dm } from '../src/themes/dm/index.tsx'
import type { LockStatus } from '../src/themes/types.ts'
import { DEMO, DEMO_FRAGMENT, LETTER, SITE } from './demo.ts'
import { useScreenFrame, type Step } from './useScreenFrame.ts'

const t = stringsFor('ko')
const noop = () => {}
// 앱 화면은 부모 폭을 그대로 쓴다. Sequence의 flex 상자 안에서 내용 폭으로 줄어들지 않게 꽉 채운다.
const FILL = { position: 'absolute', inset: 0 } as const
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const setTextareaValue = (el: HTMLTextAreaElement, value: string) => {
  // React가 관리하는 입력칸은 value를 바로 바꾸면 변경을 놓친다. 원래 setter로 넣고 input 이벤트를 보낸다.
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

// 앱은 /wordmark.svg를 사이트 루트에서 찾지만 Remotion은 public/을 다른 경로로 내준다.
const fixWordmark = (root: HTMLElement, src: string) => {
  const img = root.querySelector<HTMLImageElement>('img[src="/wordmark.svg"]')
  if (img) img.src = src
}

/* ───────── 쓰기 → 여는 날 고르기 ───────── */

// 쓰기 화면 안에서의 프레임
export const WRITE = {
  typeFrom: 6,
  typeTo: 74,
  openSheet: 84,
  pickNewYear: 96,
  confirm: 108,
}

const BODY_CHARS = Array.from(DEMO.body)
const PREFILL = { to: DEMO.to, from: DEMO.from }

export function WriteScreen({ wordmark }: { wordmark: string }) {
  const step = useCallback<Step>(
    (root, frame) => {
      fixWordmark(root, wordmark)

      const n = Math.round(interpolate(frame, [WRITE.typeFrom, WRITE.typeTo], [0, BODY_CHARS.length], clamp))
      const body = BODY_CHARS.slice(0, n).join('')
      const textarea = root.querySelector('textarea')
      if (textarea && textarea.value !== body) {
        setTextareaValue(textarea, body)
        return frame
      }

      const picked = t.write.whenValue(nextNewYear(new Date()))
      const confirmed = root.querySelector(`.${writeCss.rowValue}`)?.textContent === picked
      if (confirmed) {
        // 시트가 닫히며 날짜 버튼으로 돌아온 포커스 테두리를 지운다. 손가락으로 누르면 생기지 않는 테두리다.
        ;(document.activeElement as HTMLElement | null)?.blur()
        return null
      }
      if (frame < WRITE.openSheet) return null

      const sheet = root.querySelector<HTMLElement>('[role="dialog"]')
      if (!sheet) {
        root.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')?.click()
        return WRITE.openSheet
      }
      // 보기 순서: 직접 고르기, 새해 0시, 1년 뒤 지금
      const newYear = sheet.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]
      if (frame >= WRITE.pickNewYear && !newYear.checked) {
        newYear.click()
        return WRITE.pickNewYear
      }
      if (frame >= WRITE.confirm) {
        sheet.querySelector<HTMLButtonElement>(`.${writeCss.confirmButton}`)?.click()
        return WRITE.confirm
      }
      return null
    },
    [wordmark],
  )
  const { ref, key } = useScreenFrame(step)
  return (
    <div ref={ref} style={FILL}>
      <Write key={key} prefill={PREFILL} onCreated={noop} />
    </div>
  )
}

/* ───────── 링크 완성 ───────── */

const CREATED = {
  fragment: DEMO_FRAGMENT,
  unlockAt: LETTER.unlockAt,
  draft: { themeId: dm.id, tint: 0, to: DEMO.to, from: DEMO.from, body: DEMO.body, unlockAt: LETTER.unlockAt },
}
const LINK = letterLink(SITE, 'ko', dm.id, DEMO_FRAGMENT)

// 다시 그려지면 아래에서 고친 링크가 원래 값(localhost 주소)으로 돌아가므로 props를 고정해 둔다.
const StillDone = memo(function StillDone() {
  return <Done created={CREATED} onPreview={noop} onNew={noop} />
})

const doneStep: Step = (root) => {
  // Done은 지금 페이지 주소(location.origin)로 링크를 만든다. 영상에는 실제 사이트 주소를 보여준다.
  const link = root.querySelector('textarea')
  if (link && link.value !== LINK) {
    link.value = LINK
    const count = root.querySelector(`.${screensCss.count}`)
    if (count) count.textContent = t.done.length(t.date.number(LINK.length))
  }
  return null
}

export function DoneScreen() {
  const { ref, key } = useScreenFrame(doneStep)
  return (
    <div ref={ref} style={FILL}>
      <StillDone key={key} />
    </div>
  )
}

/* ───────── 받는 사람: 잠김 ───────── */

// 받는 사람 화면 안에서의 프레임
export const RECEIVE = {
  countdownTo: 84,
  // 일·시간·분·초를 차례로 세는 구간의 경계
  countdownPhases: [0, 30, 50, 68, 84],
  openAt: 100,
  fade: 12,
  bubbles: [118, 136, 154],
}

const UNITS = [86_400_000, 3_600_000, 60_000, 1000] // 일, 시간, 분, 초

/**
 * 프레임 → 남은 시간(ms). 큰 단위부터 하나씩 0까지 센다: "46일 3시간" → … → "1일 3시간" → "3시간 12분" → … → "9초".
 * 남은 시간을 매끄럽게 줄이면 화면의 둘째 단위(시간·분)가 프레임마다 크게 돌아가 숫자가 오락가락해 보인다.
 * 단위마다 그보다 작은 나머지는 그대로 두고 그 단위만 줄여서, 보이는 두 숫자가 늘 줄어들기만 하게 한다.
 */
function countdownLeft(total: number, frame: number): number {
  const edges = RECEIVE.countdownPhases
  let left = total
  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i]
    const count = Math.floor(left / unit)
    const rest = left - count * unit
    const done = interpolate(frame, [edges[i], edges[i + 1]], [0, count], { ...clamp, easing: Easing.inOut(Easing.quad) })
    if (frame < edges[i + 1]) return (count - Math.floor(done)) * unit + rest
    left = rest
  }
  return 0
}

export function LockedScreen() {
  const frame = useCurrentFrame()
  const left = countdownLeft(LETTER.unlockAt.getTime() - LETTER.createdAt.getTime(), frame)
  const status: LockStatus = frame >= RECEIVE.countdownTo ? 'opening' : 'waiting'
  const { ref, key } = useScreenFrame()
  return (
    <div ref={ref} style={FILL}>
      <dm.Locked key={key} letter={LETTER} now={LETTER.unlockAt.getTime() - left} status={status} onRetry={noop} onSaveCalendar={noop} onWrite={noop} />
    </div>
  )
}

/* ───────── 받는 사람: 열림 ───────── */

const PARAGRAPHS = DEMO.body.split('\n\n')

/**
 * 테마의 말풍선 연출은 setTimeout으로 움직여 프레임에 맞출 수 없다.
 * 대신 연출을 끈 상태(다 보인 화면)로 그리고, 보일 문단만 넘겨서 말풍선이 하나씩 늘게 한다.
 * frame은 이 화면이 시작된 뒤의 프레임이다.
 */
export function OpenScreen() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const starts = RECEIVE.bubbles.map((b) => b - RECEIVE.openAt)
  const shown = starts.filter((s) => frame >= s).length
  const since = shown > 0 ? frame - starts[shown - 1] : 0
  const pop = interpolate(since, [0, 0.3 * fps], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  const { ref, key } = useScreenFrame()
  return (
    <div ref={ref} style={FILL}>
      {/* 막 도착한 말풍선 하나만 아래에서 올라온다(테마의 hPop과 같은 움직임). */}
      <style>{`.${dmCss.chat} > .${dmCss.row}:last-child { opacity: ${pop}; translate: 0 ${(1 - pop) * 8}px; scale: ${0.96 + pop * 0.04}; }`}</style>
      <dm.Open key={`${key}-${shown}`} letter={LETTER} text={PARAGRAPHS.slice(0, shown).join('\n\n')} autoplay={false} reducedMotion onReply={noop} />
    </div>
  )
}
