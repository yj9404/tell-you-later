import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { loadFonts } from '../lib/fonts.ts'
import { THEMES, themeFonts } from '../themes/registry.ts'
import type { LetterInfo, Theme } from '../themes/types.ts'
import { useModal } from './useModal.ts'
import { useLang, useStrings } from '../i18n/index.ts'
import s from './write.module.css'

/** 미리보기에 필요한 입력값. 복호화 없이 원문을 그대로 테마에 넘긴다. */
export interface Draft {
  themeId: string
  tint: number
  to: string
  from: string
  body: string
  unlockAt: Date
}

export type Side = 'before' | 'after'

// 테마 화면의 기준 크기 (디자인 아트보드)
const W = 390
const H = 844
const noop = () => {}

const themeOf = (draft: Draft): Theme => THEMES.find((t) => t.id === draft.themeId) ?? THEMES[0]

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function useLetter(draft: Draft): { theme: Theme; letter: LetterInfo; text: string; example: boolean } {
  const theme = themeOf(draft)
  const t = useStrings()
  const [createdAt] = useState(() => new Date())
  const text = draft.body.trim()
  const { to, from, tint, unlockAt } = draft
  const letter = useMemo<LetterInfo>(
    () => ({
      to: to.trim() || t.preview.to,
      toEmpty: !to.trim(),
      from: from.trim() || t.preview.from,
      tint: theme.tints ? (theme.tints[tint] ?? theme.tints[0]).hex : null,
      createdAt,
      unlockAt,
    }),
    // unlockAt은 매번 새 객체일 수 있으므로 시각으로 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [to, from, tint, theme, createdAt, unlockAt.getTime(), t],
  )
  // 편지가 비어 있을 때 "그날 이후"에는 예시 글을 보여준다.
  return { theme, letter, text: text || t.preview.example, example: !text }
}

// 열림 화면은 1초마다 다시 그릴 필요가 없다.
const OpenScreen = memo(function OpenScreen({ theme, letter, text, autoplay, reducedMotion, preview }: { theme: Theme; letter: LetterInfo; text: string; autoplay: boolean; reducedMotion: boolean; preview?: boolean }) {
  return <theme.Open letter={letter} text={text} autoplay={autoplay} reducedMotion={reducedMotion} onReply={noop} preview={preview} />
})

function LockedScreen({ theme, letter, now, preview }: { theme: Theme; letter: LetterInfo; now: number; preview?: boolean }) {
  return <theme.Locked letter={letter} now={now} status="waiting" onRetry={noop} onSaveCalendar={noop} onWrite={noop} preview={preview} />
}

/** 쓰기 화면의 작은 미리보기 두 개. 실제 테마 화면을 390×844로 그린 뒤 줄여서 넣는다. */
export function PreviewPair({ draft, onOpen }: { draft: Draft; onOpen: (side: Side) => void }) {
  const t = useStrings()
  const { theme, letter, text, example } = useLetter(draft)
  const now = useNow()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.42)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / W)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const frame = { width: W, height: H, transform: `scale(${scale})`, ['--screen-h' as string]: `${H}px` }
  return (
    <div className={s.previews}>
      <div className={s.previewCol}>
        <span className={s.previewLabel}>{t.preview.before}</span>
        <div className={s.previewBox} ref={box}>
          <div className={s.previewFrame} style={frame} inert>
            <LockedScreen theme={theme} letter={letter} now={now} />
          </div>
          <button type="button" className={s.previewHit} aria-label={t.preview.enlargeBefore} onClick={(e) => (e.currentTarget.focus(), onOpen('before'))} />
        </div>
      </div>
      <div className={s.previewCol}>
        <span className={s.previewLabel}>{t.preview.after}</span>
        <div className={s.previewBox}>
          {/* 연출 없이 끝 상태만 보여준다. 글이 바뀌면 새로 그린다. */}
          <div className={s.previewFrame} style={{ ...frame, opacity: example ? 0.45 : 1 }} inert>
            <OpenScreen key={`${theme.id}|${text}`} theme={theme} letter={letter} text={text} autoplay={false} reducedMotion />
          </div>
          <button type="button" className={s.previewHit} aria-label={t.preview.enlargeAfter} onClick={(e) => (e.currentTarget.focus(), onOpen('after'))} />
        </div>
      </div>
    </div>
  )
}

/**
 * 전체 화면 미리보기. 테마 화면 안에서 스크롤·한 번에 보기·다시 보기는 되고,
 * 밖으로 나가는 버튼(나도 쓰기, 답장, 캘린더 저장)만 preview 값으로 비활성이 된다.
 * 재생 기록(localStorage)은 남기지 않는다. 받는 사람의 "처음 한 번" 연출을 써 버리면 안 된다.
 */
export function FullPreview({ draft, start, onClose }: { draft: Draft; start: Side; onClose: () => void }) {
  const t = useStrings()
  const { theme, letter, text, example } = useLetter(draft)
  const now = useNow()
  const [side, setSide] = useState<Side>(start)
  // "그날 이후"로 바꾸거나 다시 보기를 누를 때마다 연출을 처음부터 재생한다.
  const [run, setRun] = useState(0)
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const close = useRef<HTMLButtonElement>(null)

  const lang = useLang()
  useEffect(() => loadFonts(themeFonts(theme, lang)), [theme, lang])

  // 쓰기 화면은 뒤에 그대로 있다. 스크롤만 잠그고, 닫으면 열기 전 자리로 포커스를 돌려준다.
  useModal(onClose)
  useEffect(() => close.current?.focus({ preventScroll: true }), [])

  const show = (next: Side) => {
    setSide(next)
    setRun((r) => r + 1)
  }

  return (
    <div className={s.full} role="dialog" aria-modal="true" aria-label={t.preview.title}>
      <div className={s.band}>
        <div className={s.bandTitle}>
          <span>{t.preview.title}</span>
          {side === 'after' && example && <span className={s.bandNote}>{t.preview.exampleNote}</span>}
        </div>
        <div role="group" aria-label={t.preview.tabs} className={s.bandTabs}>
          <button type="button" aria-pressed={side === 'before'} onClick={() => show('before')}>
            {t.preview.tabBefore}
          </button>
          <button type="button" aria-pressed={side === 'after'} onClick={() => show('after')}>
            {t.preview.tabAfter}
          </button>
        </div>
        {side === 'after' && (
          <button type="button" className={s.bandIcon} aria-label={t.preview.replay} onClick={() => setRun((r) => r + 1)}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
        )}
        <button type="button" ref={close} className={s.bandIcon} aria-label={t.preview.close} onClick={onClose}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      {/* 띠만큼 화면을 아래로 민다. 테마 화면은 남은 높이를 화면 높이로 쓴다. */}
      <div className={s.fullScreen}>
        <div>
          {side === 'before' ? (
            <LockedScreen theme={theme} letter={letter} now={now} preview />
          ) : (
            <OpenScreen key={run} theme={theme} letter={letter} text={text} autoplay={!reducedMotion} reducedMotion={reducedMotion} preview />
          )}
        </div>
      </div>
    </div>
  )
}
