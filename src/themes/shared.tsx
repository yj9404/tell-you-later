import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { splitBubbles } from '../lib/bubbles.ts'
import type { LetterInfo, LockedProps } from './types.ts'
import { useLang, useStrings, type Lang, type Strings } from '../i18n/index.ts'
import './shared.css'

const cache = new Map<string, CSSProperties>()

/**
 * 디자인 파일의 인라인 스타일 문자열을 그대로 옮겨 쓰기 위한 변환기.
 * 테마마다 모양이 완전히 달라 공유할 클래스가 거의 없으므로, 디자인의 값을 손으로 다시
 * 적다가 틀리는 것보다 원문 그대로 두는 쪽을 택했다. 같은 문자열은 한 번만 변환한다.
 */
export function st(css: string): CSSProperties {
  let style = cache.get(css)
  if (!style) {
    const out: Record<string, string> = {}
    for (const decl of css.split(';')) {
      const i = decl.indexOf(':')
      if (i < 0) continue
      const key = decl
        .slice(0, i)
        .trim()
        .replace(/^-webkit-/, 'Webkit-')
        .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      out[key] = decl.slice(i + 1).trim()
    }
    style = out as CSSProperties
    cache.set(css, style)
  }
  return style
}

/** 테마 폴더의 strings.ts({ ko, en })에서 지금 언어의 문구를 고른다. */
export function useThemeStrings<T>(strings: Record<Lang, T>): T {
  return strings[useLang()]
}

/** 잠김 화면의 남은 시간 자리에 들어갈 글. 열쇠를 받는 중에는 테마의 말(opening)로 그 사실을 알린다. */
export function remaining(p: Pick<LockedProps, 'letter' | 'now' | 'status'>, t: Strings, opening = t.locked.opening): string {
  return p.status === 'opening' ? opening : t.date.countdown(p.letter.unlockAt.getTime() - p.now)
}

/** 복호화 실패 안내. 글꼴과 색은 놓인 자리(테마)의 것을 그대로 물려받는다. */
export function LockError({ status, error, onRetry }: Pick<LockedProps, 'status' | 'error' | 'onRetry'>) {
  const t = useStrings()
  if (status !== 'error') return null
  return (
    <div role="alert" className="tyl-lock-error">
      <span>{error}</span>
      <button type="button" onClick={onRetry}>
        {t.locked.retry}
      </button>
    </div>
  )
}

/**
 * 시간표대로 단계를 넘기는 열림 연출.
 * steps는 [단계, 시작 후 ms] 목록이고 마지막 단계가 편지가 다 보이는 상태다.
 * steps는 컴포넌트 밖에 상수로 둔다.
 */
export function usePhases<P extends string>(steps: readonly (readonly [P, number])[], autoplay: boolean, reducedMotion: boolean) {
  const first = steps[0][0]
  const last = steps[steps.length - 1][0]
  const [phase, setPhase] = useState<P>(autoplay ? first : last)
  // 0이면 재생하지 않는다. 다시 보기를 누를 때마다 1씩 오른다.
  const [run, setRun] = useState(autoplay ? 1 : 0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (run === 0) return
    setPhase(first)
    timers.current = steps.slice(1).map(([p, at]) => window.setTimeout(() => setPhase(p), at))
    return () => timers.current.forEach(clearTimeout)
  }, [run, steps, first])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    setPhase(last)
  }
  const replay = () => (reducedMotion ? skip() : setRun((r) => r + 1))
  return { phase, run, done: phase === last, skip, replay }
}

// 채팅형 연출(dm, msg)의 타이밍. 디자인(H-open, L-open) 스크립트의 값 그대로다.
const START_DELAY = 600
const GAP = 350
const typingTime = (bubble: string) => Math.min(1800, 500 + bubble.length * 45)

/** 입력 중 표시 → 말풍선이 차례로 도착하는 연출 */
export function useBubblePlayback(text: string, autoplay: boolean, reducedMotion: boolean) {
  const bubbles = useMemo(() => splitBubbles(text), [text])
  const [shown, setShown] = useState(autoplay ? 0 : bubbles.length)
  const [typing, setTyping] = useState(false)
  const [run, setRun] = useState(autoplay ? 1 : 0)
  const timer = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (run === 0) return
    const step = (i: number) => {
      if (i >= bubbles.length) return
      setTyping(true)
      timer.current = window.setTimeout(() => {
        setShown(i + 1)
        setTyping(false)
        timer.current = window.setTimeout(() => step(i + 1), GAP)
      }, typingTime(bubbles[i]))
    }
    setShown(0)
    setTyping(false)
    timer.current = window.setTimeout(() => step(0), START_DELAY)
    return () => clearTimeout(timer.current)
  }, [run, bubbles])

  // 재생 중에는 새 말풍선을 따라 내려간다. 한 번에 보여줄 때는 처음부터 읽게 둔다.
  useEffect(() => {
    if (run > 0 && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [run, shown, typing])

  const showAll = () => {
    clearTimeout(timer.current)
    setShown(bubbles.length)
    setTyping(false)
  }
  const replay = () => (reducedMotion ? showAll() : setRun((r) => r + 1))
  return { bubbles, shown, typing, run, done: shown >= bubbles.length, showAll, replay, scroller }
}

/**
 * 채팅형 테마(dm, msg)의 첫 말풍선들: "지민아" / 가운데 말 / "그게 뭐냐면…".
 * 받는 사람을 비워 둔 미리보기에서는 부르는 말을 뺀다.
 */
export function chatIntro(letter: LetterInfo, t: Strings, middle: string, last: string): string[] {
  const call = letter.toEmpty ? '' : t.callName(letter.to)
  return [...(call ? [call] : []), middle, last]
}

/** 예고 문구를 두 줄로: "할 말이 있는데 / 1월 1일에 할게" */
export function TeaserLines({ unlock, now }: { unlock: Date; now: Date }) {
  const t = useStrings()
  return (
    <>
      {t.teaserParts.line1}
      <br />
      {t.teaserParts.before}
      {t.date.teaserDate(unlock, now)}
      {t.teaserParts.after}
    </>
  )
}

/** 숫자 글자 수에 따라 큰 날짜 글자를 줄인다: "1.1"은 그대로, "12.25"는 작게. */
export function fitSize(text: string, base: number): string {
  const px = Math.round(base * Math.min(1, 3.4 / Math.max(3, text.length * 0.82)))
  // 디자인 폭(390px)보다 좁은 화면에서는 같은 비율로 줄인다.
  return `min(${px}px, ${((px / 390) * 100).toFixed(1)}vw)`
}
