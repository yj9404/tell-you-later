import { useEffect, useMemo, useRef, useState } from 'react'
import { splitLines } from '../../lib/bubbles.ts'
import { fullDate, hm, monthDot, teaser, whenText } from '../../lib/date.ts'
import { fitSize, LockError, remaining, st } from '../shared.tsx'
import type { LockedProps, OpenProps, Theme } from '../types.ts'

// 플레이어 테마 (디자인: K-player, K-open)
const FONT = "'Noto Sans KR',sans-serif"
const DISPLAY = "'Bricolage Grotesque',sans-serif"
const DEFAULT_TINT = '#2F6BFF'
const OUTLINE = `height:54px;border:1px solid #BDBDBD;border-radius:27px;background:#FFFFFF;color:#000000;font-family:${FONT};font-size:15px;font-weight:700;cursor:pointer`
const SOLID = `height:54px;border:0;border-radius:27px;background:#000000;color:#FFFFFF;font-family:${FONT};font-size:15px;font-weight:700;cursor:pointer`

function Locked(p: LockedProps) {
  const { letter, now } = p
  const today = new Date(now)
  const date = monthDot(letter.unlockAt)
  return (
    <div
      className="tyl-screen tyl-focus-dark"
      style={st(`min-height:var(--screen-h, 100dvh);box-sizing:border-box;background:#FFFFFF;color:#000000;font-family:${FONT};padding:32px 28px 26px;display:flex;flex-direction:column;gap:22px`)}
    >
      <p className="tyl-keep" style={st('margin:0;font-size:14px;font-weight:500;text-align:center;color:#5C5C5C')}>
        {letter.to}에게 온 예약 편지
      </p>

      <div
        style={{
          ...st('width:100%;max-width:334px;aspect-ratio:1;align-self:center;box-sizing:border-box;border-radius:10px;color:#FFFFFF;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden'),
          background: letter.tint ?? DEFAULT_TINT,
        }}
      >
        <span style={st('font-size:24px;font-weight:700;letter-spacing:-0.5px')}>{letter.unlockAt.getFullYear()}</span>
        <span style={{ ...st(`font-family:${DISPLAY};font-weight:800;line-height:0.85;letter-spacing:-0.047em;margin-left:-6px;white-space:nowrap`), fontSize: fitSize(date, 170) }}>{date}</span>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:4px')}>
        <h1 className="tyl-keep" style={st('margin:0;font-size:22px;font-weight:900;letter-spacing:-0.8px;line-height:1.35')}>
          {teaser(letter.unlockAt, today)}
        </h1>
        <span style={st('font-size:15px;color:#5C5C5C')}>{letter.from}</span>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:8px')}>
        <div role="img" aria-label="아직 재생 전" style={st('height:4px;background:#E2E2E2;border-radius:2px;position:relative')}>
          <div style={st('position:absolute;left:0;top:-5px;width:14px;height:14px;border-radius:50%;background:#000000')} />
        </div>
        <div style={st('display:flex;justify-content:space-between;font-size:12px;color:#5C5C5C')}>
          <span>오늘</span>
          <span style={st('font-variant-numeric:tabular-nums')}>{p.status === 'waiting' ? `-${remaining(p)}` : remaining(p)}</span>
        </div>
      </div>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px')}>
        {p.status === 'error' ? (
          <LockError {...p} />
        ) : (
          <>
            <div aria-hidden="true" style={st('width:68px;height:68px;border-radius:50%;background:#000000;display:flex;align-items:center;justify-content:center')}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
            <span style={st('font-size:14px;font-weight:500;text-align:center;line-height:1.6')}>
              {whenText(letter.unlockAt, today)}부터 열 수 있어요.
              <br />그 전엔 보낸 사람도 못 열어요.
            </span>
          </>
        )}
      </div>

      <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 저장
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 예약 편지 쓰기
        </button>
      </div>
    </div>
  )
}

// 가사처럼 한 줄씩 강조되며 올라간다 (K-open 스크립트의 값)
const START_DELAY = 700
const LINE_TIME = 1700
const ROW = 72
// 한 줄(72px)에 두 줄까지 들어가는 글자 수. 좁은 화면(360px) 기준이다.
const LINE_MAX = 24

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const lines = useMemo(() => splitLines(text, LINE_MAX), [text])
  const total = lines.length
  const [idx, setIdx] = useState(autoplay ? -1 : total)
  const [run, setRun] = useState(autoplay ? 1 : 0)
  const timer = useRef(0)

  useEffect(() => {
    if (run === 0) return
    const step = (n: number) => {
      setIdx(n)
      if (n < total) timer.current = window.setTimeout(() => step(n + 1), LINE_TIME)
    }
    setIdx(-1)
    timer.current = window.setTimeout(() => step(0), START_DELAY)
    return () => clearTimeout(timer.current)
  }, [run, total])

  const done = idx >= total
  const row = done ? 0 : Math.max(0, idx - 1)
  const cur = Math.min(Math.max(idx + 1, 0), total)
  const date = monthDot(letter.unlockAt)
  const showAll = () => {
    clearTimeout(timer.current)
    setIdx(total)
  }

  return (
    <div
      className="tyl-screen tyl-focus-dark"
      style={st(`height:var(--screen-h, 100dvh);box-sizing:border-box;background:#FFFFFF;color:#000000;font-family:${FONT};padding:28px 28px 26px;display:flex;flex-direction:column;gap:20px`)}
    >
      <div style={st('display:flex;align-items:center;gap:14px')}>
        <div
          aria-hidden="true"
          style={{
            ...st(`width:76px;height:76px;flex-shrink:0;border-radius:8px;color:#FFFFFF;display:flex;align-items:flex-end;padding:6px 8px;box-sizing:border-box;font-family:${DISPLAY};font-weight:800;line-height:0.9;letter-spacing:-0.055em;overflow:hidden;white-space:nowrap`),
            background: letter.tint ?? DEFAULT_TINT,
            fontSize: fitSize(date, 36),
          }}
        >
          {date}
        </div>
        <div style={st('display:flex;flex-direction:column;gap:3px;min-width:0')}>
          <h1 className="tyl-keep" style={st('margin:0;font-size:17px;font-weight:900;letter-spacing:-0.5px;line-height:1.35')}>
            {teaser(letter.unlockAt, letter.createdAt)}
          </h1>
          <span style={st('font-size:14px;color:#5C5C5C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{letter.from}</span>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:8px')}>
        <div role="img" aria-label="재생 진행" style={st('height:4px;background:#E2E2E2;border-radius:2px')}>
          <div style={{ ...st('height:4px;background:#000000;border-radius:2px'), width: `${total ? Math.round((cur / total) * 100) : 100}%`, transition: run > 0 ? 'width 1.7s linear' : undefined }} />
        </div>
        <div style={st('display:flex;justify-content:space-between;font-size:12px;color:#5C5C5C')}>
          <span>
            {fullDate(letter.unlockAt)} {hm(letter.unlockAt)}
          </span>
          <span>
            {cur} / {total}
          </span>
        </div>
      </div>

      {/* 재생 중에는 줄이 올라가고, 끝나면 처음부터 직접 넘겨 읽는다. */}
      <div style={{ ...st('flex-grow:1;min-height:0;overflow-x:hidden;position:relative'), overflowY: done ? 'auto' : 'hidden' }}>
        <div style={{ transform: `translateY(-${row * ROW}px)`, transition: run > 0 ? 'transform 0.6s cubic-bezier(0.3,0,0.2,1)' : undefined }}>
          {lines.map((line, k) => (
            <div
              key={k}
              className="tyl-keep"
              style={{ ...st('height:72px;display:flex;align-items:center;font-size:23px;font-weight:900;letter-spacing:-1px;line-height:1.3;transition:color 0.4s'), color: done || k === idx ? '#000000' : '#8A8A8A' }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')}>
        {done ? (
          <button type="button" style={st(OUTLINE)} onClick={() => (reducedMotion ? showAll() : setRun((r) => r + 1))}>
            처음부터 듣기
          </button>
        ) : (
          <button type="button" style={st(OUTLINE)} onClick={showAll}>
            한 번에 보기
          </button>
        )}
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          나도 예약 편지 쓰기
        </button>
      </div>
    </div>
  )
}

const TINTS = [
  { hex: '#2F6BFF', name: '파랑' },
  { hex: '#FF5A1F', name: '주황' },
  { hex: '#12A150', name: '초록' },
  { hex: '#FF3D8B', name: '분홍' },
]

export const player: Theme = {
  id: 'player',
  code: 5,
  name: '플레이어',
  tints: TINTS,
  fonts: ['Bricolage+Grotesque:opsz,wght@12..96,800', 'Noto+Sans+KR:wght@400;500;700;900'],
  tile: { bg: '#FFFFFF', markW: '40px', markH: '40px', markRadius: '6px' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: FONT, bubbleBg: 'TINT', bubbleFg: '#FFFFFF', radius: '10px', pad: '14px 16px', size: '18px' },
  Locked,
  Open,
}
