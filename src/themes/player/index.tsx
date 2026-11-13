import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { lyricLines } from '../../lib/bubbles.ts'
import { useStrings } from '../../i18n/index.ts'
import { LockError, remaining, st, useThemeStrings } from '../shared.tsx'
import { strings } from './strings.ts'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'
import './player.css'

// 플레이어 테마 (디자인: K-player, K-open)
const FONT = "'Noto Sans KR',sans-serif"
const DISPLAY = "'Bricolage Grotesque',sans-serif"
const DEFAULT_TINT = '#3A5BD9'
const SCREEN = `position:relative;box-sizing:border-box;background-color:#121212;color:#FFFFFF;font-family:${FONT};display:flex;flex-direction:column;overflow:hidden`
const SHADE = 'position:absolute;top:0;right:0;bottom:0;left:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,0) 40%);pointer-events:none'
const OUTLINE = 'height:52px;border:1px solid rgba(255,255,255,.5);border-radius:26px;background:transparent;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer'
const SOLID = 'height:52px;border:0;border-radius:26px;background:#FFFFFF;color:#121212;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer'
const ICON_BUTTON = 'width:44px;height:44px;border:0;background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center'
const GROOVES = 'repeating-radial-gradient(circle at center,#151515 0 1.6px,#1F1F1F 1.6px 2.6px)'
const SHEEN =
  'conic-gradient(from 20deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,.16) 25deg,rgba(255,255,255,0) 55deg,rgba(255,255,255,0) 180deg,rgba(255,255,255,.12) 205deg,rgba(255,255,255,0) 235deg)'

const background = (letter: LetterInfo) => `linear-gradient(180deg,${letter.tint ?? DEFAULT_TINT} 0%,#121212 68%)`

// 아이콘. 모두 장식이거나 버튼의 aria-label로 이름을 붙인다.
const svg = (size: number, stroke: string, width: number) => ({
  'aria-hidden': true,
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke,
  strokeWidth: width,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}) as const
const Shuffle = () => (
  <svg {...svg(22, '#B3B3B3', 2)}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
)
const Repeat = () => (
  <svg {...svg(22, '#B3B3B3', 2)}>
    <path d="M17 2l4 4-4 4M3 11V10a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
)
const Prev = () => (
  <svg {...svg(28, '#FFFFFF', 2.2)}>
    <path d="M19 20L9 12l10-8z" fill="#FFFFFF" />
    <path d="M5 19V5" />
  </svg>
)
const Next = () => (
  <svg {...svg(28, '#FFFFFF', 2.2)}>
    <path d="M5 4l10 8-10 8z" fill="#FFFFFF" />
    <path d="M19 5v14" />
  </svg>
)
const Heart = () => (
  <svg {...svg(26, '#FFFFFF', 1.8)}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

/** 상단 바. 접기·더보기 아이콘은 장식이다. */
function TopBar({ to }: { to: string }) {
  const t = useThemeStrings(strings)
  return (
    <div style={st('display:flex;align-items:center;justify-content:space-between;gap:8px;height:44px')}>
      <span style={st('width:32px;display:flex;flex-shrink:0')}>
        <svg {...svg(24, '#FFFFFF', 2)}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
      <div style={st('display:flex;flex-direction:column;align-items:center;line-height:1.35;min-width:0')}>
        <span style={st('font-size:11px;color:#E0E0E0')}>{t.playingFrom}</span>
        <span style={st('font-size:13px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{t.toName(to)}</span>
      </div>
      <span style={st('width:32px;display:flex;justify-content:flex-end;flex-shrink:0')}>
        <svg {...svg(24, '#FFFFFF', 2)}>
          <circle cx="5" cy="12" r="1.3" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="1.3" fill="#FFFFFF" />
          <circle cx="19" cy="12" r="1.3" fill="#FFFFFF" />
        </svg>
      </span>
    </div>
  )
}

function TrackTitle({ title, from, small }: { title: string; from: string; small?: boolean }) {
  return (
    <div style={st('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
      <div style={st(`display:flex;flex-direction:column;gap:${small ? 3 : 4}px;min-width:0`)}>
        <h1 className="tyl-keep" style={st(`margin:0;font-size:${small ? 19 : 22}px;font-weight:700;letter-spacing:${small ? -0.5 : -0.6}px;line-height:1.35`)}>
          {title}
        </h1>
        <span style={st(`font-size:${small ? 14 : 15}px;color:#B3B3B3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{from}</span>
      </div>
      <span aria-hidden="true" style={st(`flex-shrink:0;padding-top:${small ? 2 : 3}px`)}>
        <Heart />
      </span>
    </div>
  )
}

// 앨범 재킷과 LP판. 디자인의 px 값(가로 342 기준)을 비율로 바꿔 좁은 화면에서도 같은 모양이다.
interface AlbumSize {
  h: number
  jacket: number
  vinyl: number
  vtop: number
  label: number
  labelFont: number
  sideFont: number
  pad: number
  topFont: number
  big: number
  nameFont: number
}
const BIG: AlbumSize = { h: 290, jacket: 290, vinyl: 276, vtop: 6, label: 99, labelFont: 30, sideFont: 9, pad: 20, topFont: 15, big: 168, nameFont: 14 }
const SMALL: AlbumSize = { h: 176, jacket: 176, vinyl: 166, vtop: 5, label: 60, labelFont: 18, sideFont: 6, pad: 12, topFont: 9, big: 100, nameFont: 8 }
// 재킷 날짜 글자 폭(em). Bricolage 800 기준으로 1과 점은 좁고 나머지 숫자는 넓다. 실측보다 조금 넉넉하다.
const GLYPH_EM: Record<string, number> = { '1': 0.32, '.': 0.2, '/': 0.34 }
/** 재킷 안쪽 폭(inner, 디자인 px)에 들어가는 날짜 글자 크기. 390px보다 좁은 화면에서는 같은 비율로 줄인다. */
function dateSize(date: string, base: number, inner: number): string {
  const em = [...date].reduce((sum, ch) => sum + (GLYPH_EM[ch] ?? 0.6), 0)
  const px = Math.min(base, Math.floor((inner * 0.95) / em))
  return `min(${px}px, ${((px / 390) * 100).toFixed(1)}vw)`
}
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`

function Album({ letter, size: s, left, spin, slide }: { letter: LetterInfo; size: AlbumSize; left: number; spin?: 'running' | 'paused'; slide?: boolean }) {
  const noise = `kn${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const g = useStrings()
  const t = useThemeStrings(strings)
  const tint = letter.tint ?? DEFAULT_TINT
  const date = g.date.monthDot(letter.unlockAt)
  const labelScale = date.length > 4 ? 0.7 : date.length > 3 ? 0.85 : 1
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: '100%', maxWidth: 342, aspectRatio: `342 / ${s.h}` }}>
      <div style={{ ...st('position:absolute;left:0;top:0;height:100%;border-radius:4px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:2'), width: pct(s.jacket, 342), background: tint }}>
        <svg width="100%" height="100%" style={st('position:absolute;top:0;left:0;opacity:.22;mix-blend-mode:overlay')}>
          <filter id={noise}>
            <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${noise})`} />
        </svg>
        <div style={st('position:absolute;top:0;right:0;bottom:0;left:0;background:linear-gradient(135deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 38%,rgba(0,0,0,0) 60%,rgba(0,0,0,.28) 100%)')} />
        <div style={{ ...st('position:absolute;top:0;right:0;bottom:0;left:0;display:flex;flex-direction:column;justify-content:space-between;color:#FFFFFF'), padding: s.pad }}>
          <div style={{ ...st('display:flex;justify-content:space-between;gap:8px;font-weight:700;letter-spacing:-0.2px'), fontSize: s.topFont }}>
            <span style={st('min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{t.jacket}</span>
            <span style={st('flex-shrink:0;opacity:.8')}>{letter.unlockAt.getFullYear()}</span>
          </div>
          {/* 디자인 값(-0.06em)이면 Bricolage에서 점이 양옆 1과 겹친다. 대체 글꼴까지 재 보고 모두 틈이 남는 -0.01em으로 둔다. */}
          <span style={{ ...st(`font-family:${DISPLAY};font-weight:800;line-height:.8;letter-spacing:-0.01em;margin-left:-0.03em;white-space:nowrap`), fontSize: dateSize(date, s.big, s.jacket - s.pad * 2) }}>{date}</span>
          <span style={{ ...st('align-self:flex-end;max-width:100%;font-weight:500;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'), fontSize: s.nameFont }}>{letter.from}</span>
        </div>
      </div>
      <div
        style={{
          ...st('position:absolute;aspect-ratio:1;border-radius:50%;z-index:1;box-shadow:0 10px 30px rgba(0,0,0,.5)'),
          width: pct(s.vinyl, 342),
          top: pct(s.vtop, s.h),
          left: pct(left, 342),
          transition: slide ? 'left .9s cubic-bezier(.3,0,.2,1)' : undefined,
        }}
      >
        <div style={{ ...st('position:absolute;top:0;right:0;bottom:0;left:0;border-radius:50%'), background: GROOVES, animation: spin ? `kspin 1.8s linear infinite ${spin}` : undefined }}>
          <div
            style={{
              ...st('position:absolute;left:50%;top:50%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFFFFF'),
              width: pct(s.label, s.vinyl),
              background: tint,
            }}
          >
            <span style={{ ...st(`font-family:${DISPLAY};font-weight:800;line-height:1;letter-spacing:-0.01em;white-space:nowrap`), fontSize: s.labelFont * labelScale }}>{date}</span>
            <span style={{ ...st('font-weight:700;margin-top:2px;opacity:.85'), fontSize: s.sideFont }}>SIDE A</span>
            <div style={st('position:absolute;width:6px;height:6px;border-radius:50%;background:#121212')} />
          </div>
        </div>
        <div style={{ ...st('position:absolute;top:0;right:0;bottom:0;left:0;border-radius:50%;pointer-events:none'), background: SHEEN }} />
      </div>
    </div>
  )
}

function Locked(p: LockedProps) {
  const { letter, now } = p
  const g = useStrings()
  const t = useThemeStrings(strings)
  const today = new Date(now)
  const plays = t.plays(letter.unlockAt, today)
  return (
    <div className="tyl-screen tyl-focus-light" style={{ ...st(`min-height:var(--screen-h, 100dvh);${SCREEN};padding:14px 24px 26px`), backgroundImage: background(letter) }}>
      <div aria-hidden="true" style={st(SHADE)} />
      <div className="k-col" style={st('position:relative;display:flex;flex-direction:column;gap:22px;flex-grow:1')}>
        <TopBar to={letter.to} />
        <div style={st('margin-top:4px')}>
          <Album letter={letter} size={BIG} left={58} />
        </div>
        <TrackTitle title={g.teaser(letter.unlockAt, today)} from={letter.from} />

        <div style={st('display:flex;flex-direction:column;gap:8px')}>
          <div role="img" aria-label={t.notPlayed} style={st('height:4px;background:rgba(255,255,255,.25);border-radius:2px;position:relative')}>
            <div style={st('position:absolute;left:-2px;top:-4px;width:12px;height:12px;border-radius:50%;background:#FFFFFF')} />
          </div>
          <div style={st('display:flex;justify-content:space-between;font-size:12px;color:#B3B3B3')}>
            <span>{t.today}</span>
            <span style={st('font-variant-numeric:tabular-nums')}>{p.status === 'waiting' ? `-${remaining(p, g)}` : remaining(p, g, t.preparing)}</span>
          </div>
        </div>

        {/* 재생 버튼 자리에 자물쇠. 줄 전체가 장식이다. */}
        <div aria-hidden="true" style={st('display:flex;align-items:center;justify-content:space-between;padding:0 4px')}>
          <span style={st('opacity:.6;display:flex')}>
            <Shuffle />
          </span>
          <span style={st('opacity:.35;display:flex')}>
            <Prev />
          </span>
          <span style={st('width:66px;height:66px;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center')}>
            <svg {...svg(26, '#121212', 2.4)}>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <span style={st('opacity:.35;display:flex')}>
            <Next />
          </span>
          <span style={st('opacity:.6;display:flex')}>
            <Repeat />
          </span>
        </div>

        <div style={st('margin-top:auto')}>
          {p.status === 'error' ? (
            <LockError {...p} />
          ) : (
            <p className="tyl-keep" style={st('margin:0;font-size:14px;line-height:1.6;color:#D0D0D0;text-align:center')}>
              {plays[0]}
              <br />
              {plays[1]}
            </p>
          )}
        </div>
        <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')}>
          <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
            {g.calendar.save}
          </button>
          <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
            {t.writeOwn}
          </button>
        </div>
      </div>
    </div>
  )
}

// LP판이 재킷 밖으로 나온 뒤 돌기 시작하고, 가사가 한 줄씩 넘어간다 (K-open 스크립트의 값)
const SLIDE_DELAY = 400
const SLIDE_TIME = 900
const LINE_TIME = 1700
const RESUME_DELAY = 600
// 재생 시간 표시는 한 줄에 3초로 센다 (디자인 값)
const SECONDS_PER_LINE = 3
// 가사 한 줄은 카드에서 두 줄까지. keep-all 줄바꿈으로 줄 끝에 남는 자리를 감안해 폭을 조금 덜 쓴다.
const LYRIC_FONT = `700 20px ${FONT}`
const LYRIC_SPACING = -0.6
const WRAP_SLACK = 0.88
// 카드 폭을 재기 전(첫 그림)에 쓰는 글자 수 기준. 좁은 화면(360px)에서 두 줄이다.
const FALLBACK_MAX = 24
const LYRIC_PAD = 32
// 전체 보기 상태의 idx. 줄 수가 바뀌어도(카드 폭이 바뀌어도) 전체 보기로 남는다.
const ALL = Number.POSITIVE_INFINITY

let canvas: CanvasRenderingContext2D | null | undefined
function textWidth(s: string): number {
  canvas ??= document.createElement('canvas').getContext('2d')
  if (!canvas) return s.length * 20
  canvas.font = LYRIC_FONT
  return canvas.measureText(s).width + LYRIC_SPACING * s.length
}

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const g = useStrings()
  const t = useThemeStrings(strings)
  const scroller = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth - LYRIC_PAD)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const lines = useMemo(() => lyricLines(text, width > 0 ? (s) => textWidth(s) <= width * 2 * WRAP_SLACK : (s) => s.length <= FALLBACK_MAX), [text, width])
  const total = lines.length
  // idx: 지금 줄. -1은 시작 전, total 이상은 끝(전체 보기).
  const [idx, setIdx] = useState(autoplay ? -1 : ALL)
  const [out, setOut] = useState(!autoplay)
  const [playing, setPlaying] = useState(false)
  const timer = useRef(0)
  const done = idx >= total

  const stop = () => clearTimeout(timer.current)
  const step = (n: number) => {
    setIdx(n)
    timer.current = window.setTimeout(n < total ? () => step(n + 1) : () => setPlaying(false), LINE_TIME)
  }
  const showAll = () => {
    stop()
    setIdx(ALL)
    setOut(true)
    setPlaying(false)
  }
  const play = () => {
    if (reducedMotion) return showAll()
    stop()
    setIdx(-1)
    setOut(false)
    setPlaying(false)
    timer.current = window.setTimeout(() => {
      setOut(true)
      timer.current = window.setTimeout(() => {
        setPlaying(true)
        step(0)
      }, SLIDE_TIME)
    }, SLIDE_DELAY)
  }
  const toggle = () => {
    if (done) return play()
    stop()
    if (playing) return setPlaying(false)
    setPlaying(true)
    setOut(true)
    timer.current = window.setTimeout(() => step(idx + 1), RESUME_DELAY)
  }

  useEffect(() => {
    if (autoplay) play()
    return stop
    // 처음 그릴 때 한 번만 재생한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 줄 높이가 한 줄·두 줄로 다르므로 실제 위치를 재서, 지금 줄이 카드 위쪽 1/3에 오게 한다. 끝나면 맨 위로.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const line = idx >= 0 && idx < total ? (el.firstElementChild?.children[idx] as HTMLElement | undefined) : undefined
    const top = line ? line.offsetTop + line.offsetHeight / 2 - el.clientHeight / 3 : 0
    el.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [idx, total, reducedMotion])

  const cur = Math.min(Math.max(idx + 1, 0), total)
  const secs = cur * SECONDS_PER_LINE
  const tint = letter.tint ?? DEFAULT_TINT

  return (
    <div className="tyl-screen tyl-focus-light" style={{ ...st(`height:max(var(--screen-h, 100dvh), 680px);${SCREEN};padding:14px 24px 24px`), backgroundImage: background(letter) }}>
      <div aria-hidden="true" style={st(SHADE)} />
      <div className="k-col" style={st('position:relative;display:flex;flex-direction:column;gap:16px;height:100%')}>
        <TopBar to={letter.to} />
        <Album letter={letter} size={SMALL} left={out ? 130 : 20} spin={reducedMotion ? undefined : playing ? 'running' : 'paused'} slide={!reducedMotion} />
        <TrackTitle title={g.teaser(letter.unlockAt, letter.createdAt)} from={letter.from} small />

        <div style={st('display:flex;flex-direction:column;gap:7px')}>
          <div role="img" aria-label={t.progress(cur, total)} style={st('height:4px;background:rgba(255,255,255,.25);border-radius:2px;position:relative')}>
            <div style={{ ...st('height:4px;background:#FFFFFF;border-radius:2px'), width: `${total ? Math.round((cur / total) * 100) : 100}%`, transition: reducedMotion ? undefined : 'width 1.7s linear' }} />
          </div>
          <div style={st('display:flex;justify-content:space-between;font-size:12px;color:#B3B3B3;font-variant-numeric:tabular-nums')}>
            <span>
              {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
            </span>
            <span>
              {t.lines(cur, total)}
            </span>
          </div>
        </div>

        <div style={st('display:flex;align-items:center;justify-content:space-between;padding:0 4px')}>
          <span aria-hidden="true" style={st('opacity:.6;display:flex')}>
            <Shuffle />
          </span>
          <button type="button" aria-label={t.fromStart} style={st(ICON_BUTTON)} onClick={play}>
            <Prev />
          </button>
          <button type="button" aria-label={playing ? t.pause : t.play} style={st('width:62px;height:62px;border:0;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer')} onClick={toggle}>
            {playing ? (
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="#121212" />
                <rect x="14" y="4" width="4" height="16" rx="1" fill="#121212" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24">
                <path d="M7 4l13 8-13 8z" fill="#121212" />
              </svg>
            )}
          </button>
          <button type="button" aria-label={g.locked.showAll} style={st(ICON_BUTTON)} onClick={showAll}>
            <Next />
          </button>
          <span aria-hidden="true" style={st('opacity:.6;display:flex')}>
            <Repeat />
          </span>
        </div>

        <div style={{ ...st('flex-grow:1;flex-shrink:1;min-height:150px;border-radius:14px;position:relative;overflow:hidden;display:flex;flex-direction:column'), background: tint }}>
          <div aria-hidden="true" style={st('position:absolute;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.18)')} />
          <span style={st('position:relative;padding:14px 16px 4px;font-size:15px;font-weight:700')}>{t.lyrics}</span>
          {/* 재생 중에는 줄을 따라 자동으로 넘기고, 멈추거나 끝나면 손으로 넘겨 읽는다. */}
          {/* 스크롤 막대 자리를 늘 비워 둔다. 막대가 생겼다 없어지며 폭이 바뀌면 줄 나누기가 다시 된다. */}
          <div ref={scroller} style={{ ...st('position:relative;flex-grow:1;min-height:0;overflow-x:hidden;padding:0 16px;scrollbar-gutter:stable'), overflowY: playing ? 'hidden' : 'auto' }}>
            <div style={st('padding-bottom:12px')}>
              {lines.map((line, k) => (
                <div
                  key={k}
                  className="tyl-keep"
                  style={{
                    ...st('min-height:62px;box-sizing:border-box;padding:4px 0;display:flex;align-items:center;font-size:20px;font-weight:700;letter-spacing:-0.6px;line-height:1.4'),
                    color: done || k === idx ? '#FFFFFF' : k < idx ? 'rgba(255,255,255,.62)' : 'rgba(0,0,0,.5)',
                    transition: reducedMotion ? undefined : 'color .4s',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="button" style={st('height:50px;border:0;border-radius:25px;background:#FFFFFF;color:#121212;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer')} onClick={onReply} disabled={preview}>
          {t.writeOwn}
        </button>
      </div>
    </div>
  )
}

// 링크에는 인덱스가 들어간다. 예전 색(파랑·주황·초록·분홍)과 같은 순서로 가장 가까운 새 색을 둔다.
const TINTS = [
  { hex: '#3A5BD9', name: { ko: '파랑', en: 'Blue' } },
  { hex: '#E0552B', name: { ko: '주황', en: 'Orange' } },
  { hex: '#0F8A6A', name: { ko: '초록', en: 'Green' } },
  { hex: '#C93A78', name: { ko: '분홍', en: 'Pink' } },
]

export const player: Theme = {
  id: 'player',
  code: 5,
  name: { ko: '플레이어', en: 'Player' },
  tints: TINTS,
  fonts: { ko: ['Bricolage+Grotesque:opsz,wght@12..96,800', 'Noto+Sans+KR:wght@400;500;700;900'] },
  tile: { bg: '#121212', markW: '40px', markH: '40px', markRadius: '4px' },
  preview: { bg: '#121212', fg: '#FFFFFF', font: FONT, bubbleBg: 'TINT', bubbleFg: '#FFFFFF', radius: '4px', pad: '14px 16px', size: '18px' },
  Locked,
  Open,
}
