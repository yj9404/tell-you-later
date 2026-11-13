import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { paragraphs } from '../../lib/bubbles.ts'
import { hhmm } from '../../lib/date.ts'
import { useStrings } from '../../i18n/index.ts'
import { LockError, remaining, st, TeaserLines, useThemeStrings } from '../shared.tsx'
import { strings } from './strings.ts'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 항공 봉투 테마 (디자인: F-airmail, F-open). 받는 사람 이름과 서명만 손글씨체다.
// 글꼴은 언어마다 다르다(strings.ts의 font). 화면 맨 위에서 CSS 변수로 넣는다.
const FONT = 'var(--air-body)'
const PEN = 'var(--air-pen)'
const NAVY = '#1E3A7B'
const SCREEN = `box-sizing:border-box;background:#E3E7EC;color:${NAVY};font-family:${FONT};padding:32px 24px 24px;display:flex;flex-direction:column;overflow:hidden`
const STRIPES = 'repeating-linear-gradient(135deg,#C8322B 0 12px,transparent 12px 22px,#1E3A7B 22px 34px,transparent 34px 44px)'
const OUTLINE = `height:52px;border:1px solid ${NAVY};border-radius:6px;background:transparent;color:${NAVY};font-family:inherit;font-size:15px;cursor:pointer`
const SOLID = `height:52px;border:0;border-radius:6px;background:${NAVY};color:#FFFFFF;font-family:inherit;font-size:15px;cursor:pointer`
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px'

/** 톱니 테두리 우표: 여는 날짜 */
function Stamp({ at, small }: { at: Date; small?: boolean }) {
  const g = useStrings()
  const date = g.date.monthDot(at)
  const scale = date.length > 4 ? 0.7 : date.length > 3 ? 0.85 : 1
  return (
    <div
      aria-hidden="true"
      style={st(
        `position:relative;flex-shrink:0;${small ? 'width:46px;height:56px' : 'width:58px;height:70px'};padding:5px;box-sizing:border-box;background:radial-gradient(circle at 4px 4px,transparent 2.4px,#FFFFFF 2.8px) -4px -4px/8px 8px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))`,
      )}
    >
      <div style={st(`width:100%;height:100%;background:${NAVY};color:#FFFFFF;display:flex;flex-direction:column;justify-content:space-between;padding:5px 6px;box-sizing:border-box`)}>
        <span style={{ fontSize: small ? 7 : 9, opacity: 0.8 }}>{at.getFullYear()}</span>
        <span style={{ fontSize: (small ? 17 : 21) * scale, lineHeight: 1, whiteSpace: 'nowrap' }}>{date}</span>
      </div>
    </div>
  )
}

/** 소인: 쓴 날짜와 시각 */
function Postmark({ at }: { at: Date }) {
  const day = `${at.getFullYear()}.${String(at.getMonth() + 1).padStart(2, '0')}.${String(at.getDate()).padStart(2, '0')}`
  return (
    <svg aria-hidden="true" width="120" height="70" viewBox="0 0 120 70" style={st('position:absolute;right:42px;top:22px;opacity:.75;transform:rotate(-12deg)')}>
      <circle cx="35" cy="35" r="28" fill="none" stroke="#3A3A3A" strokeWidth="1.6" />
      <circle cx="35" cy="35" r="21" fill="none" stroke="#3A3A3A" strokeWidth="1" />
      <text x="35" y="33" textAnchor="middle" fontSize="8" fill="#3A3A3A" fontFamily="sans-serif">
        {day}
      </text>
      <text x="35" y="44" textAnchor="middle" fontSize="7" fill="#3A3A3A" fontFamily="sans-serif">
        {hhmm(at)}
      </text>
      <path d="M68 22 q8 -5 16 0 t16 0 t16 0 M68 35 q8 -5 16 0 t16 0 t16 0 M68 48 q8 -5 16 0 t16 0 t16 0" fill="none" stroke="#3A3A3A" strokeWidth="1.4" />
    </svg>
  )
}

/** 받는 사람 이름 크기. 디자인은 "지민에게"가 44px이고, 긴 이름은 봉투 안에 들어가게 줄인다. label은 봉투에 쓰는 그대로("지민에게", "Alex"). */
const nameSize = (label: string) => Math.max(24, Math.min(44, Math.floor(190 / (Math.max(4, label.length) * 0.62))))

function Envelope({ letter, now }: { letter: LetterInfo; now: Date }) {
  const t = useThemeStrings(strings)
  const notice = t.doNotOpen(letter.unlockAt, now)
  const toLabel = t.toName(letter.to)
  return (
    <div style={st('width:342px;max-width:100%;transform:rotate(-2.5deg)')}>
      <div
        role="img"
        aria-label={t.envelope(letter.from, letter.to, notice)}
        style={{ ...st('position:relative;height:228px;box-sizing:border-box;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.1),0 16px 32px rgba(30,58,123,.14);padding:9px'), background: `${STRIPES},#FBFBF8` }}
      >
        <div style={st('position:relative;height:100%;padding:12px 14px;box-sizing:border-box;background:#FBFBF8')}>
          <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:10px')}>
            <div style={st('display:flex;flex-direction:column;gap:6px;min-width:0')}>
              <span style={st('font-size:11px;line-height:1.5')}>
                {t.from}
                <br />
                <span className="tyl-keep" style={st(`font-family:${PEN};font-size:22px`)}>
                  {letter.from}
                </span>
              </span>
              <span style={st(`align-self:flex-start;border:1.5px solid ${NAVY};padding:2px 7px;font-size:10px;letter-spacing:1px;white-space:nowrap`)}>{t.airmail}</span>
            </div>
            <Stamp at={letter.unlockAt} />
          </div>
          <Postmark at={letter.createdAt} />
          <div style={st('position:absolute;left:96px;right:12px;bottom:40px;display:flex;flex-direction:column')}>
            <span style={st('font-size:11px')}>{t.to}</span>
            <span className="tyl-keep" style={{ ...st(`font-family:${PEN};line-height:1;color:#13254F`), fontSize: nameSize(toLabel) }}>
              {toLabel}
            </span>
          </div>
          <span style={st('position:absolute;right:12px;bottom:10px;left:96px;text-align:right;font-size:11px;color:#C8322B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{notice}</span>
        </div>
      </div>
    </div>
  )
}

/** 언어별 글꼴을 CSS 변수로 넘긴다. */
const fontVars = (font: { body: string; pen: string }) => ({ '--air-body': font.body, '--air-pen': font.pen }) as CSSProperties

function Locked(p: LockedProps) {
  const { letter } = p
  const now = new Date(p.now)
  const g = useStrings()
  const t = useThemeStrings(strings)
  const opens = t.opens(letter.unlockAt, now)
  return (
    <div className="tyl-screen tyl-focus-dark" style={{ ...st(`min-height:var(--screen-h, 100dvh);${SCREEN};gap:22px`), ...fontVars(t.font) }}>
      <h1 className="tyl-keep" style={st('margin:0;font-size:24px;font-weight:400;line-height:1.5;letter-spacing:-0.4px')}>
        <TeaserLines unlock={letter.unlockAt} now={now} />
      </h1>
      <div style={st('flex-grow:1;display:flex;align-items:center;justify-content:center;padding:8px 0')}>
        <Envelope letter={letter} now={now} />
      </div>
      <div style={st('display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-top:1px solid rgba(30,58,123,.25);padding-top:14px')}>
        {p.status === 'error' ? (
          <LockError {...p} />
        ) : (
          <>
            <span className="tyl-keep" style={st('font-size:14px;line-height:1.6;color:#3B4A6B')}>
              {opens[0]}
              <br />
              {opens[1]}
            </span>
            <span style={st('font-size:24px;letter-spacing:-0.5px;flex-shrink:0;font-variant-numeric:tabular-nums')}>{remaining(p, g)}</span>
          </>
        )}
      </div>
      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          {g.calendar.save}
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          {t.writeOwn}
        </button>
      </div>
    </div>
  )
}

// 편지지가 아래에서 0.9초 동안 올라오고, 1.6초 뒤부터 자동 스크롤 (F-open 스크립트의 값)
const RISE_DELAY = 200
const ROLL_DELAY = 1600
// 디자인 예시 편지는 약 320px을 24초 동안 올라간다. 더 긴 편지는 같은 속도로 더 오래 올라간다.
const ROLL_TIME = 24_000
const DESIGN_DISTANCE = 320

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const paras = useMemo(() => paragraphs(text), [text])
  const [up, setUp] = useState(!autoplay)
  const [manual, setManual] = useState(!autoplay)
  const [run, setRun] = useState(0)
  const paper = useRef<HTMLDivElement>(null)
  const t = useThemeStrings(strings)

  useEffect(() => {
    if (up) return
    const id = window.setTimeout(() => setUp(true), RISE_DELAY)
    return () => clearTimeout(id)
  }, [up])

  // CSS 애니메이션 대신 실제 스크롤 위치를 움직인다. 사용자가 편지지를 건드리면 그 자리에서
  // 멈추고 그대로 손으로 넘겨 읽을 수 있다.
  useEffect(() => {
    const el = paper.current
    if (manual || !el) return
    el.scrollTop = 0
    let frame = 0
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t + ROLL_DELAY
      const distance = el.scrollHeight - el.clientHeight
      const duration = ROLL_TIME * Math.max(1, distance / DESIGN_DISTANCE)
      const progress = distance > 0 ? Math.min(1, Math.max(0, (t - start) / duration)) : 1
      el.scrollTop = distance * progress
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setManual(true)
    }
    frame = requestAnimationFrame(tick)
    const stop = () => setManual(true)
    const events = ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const
    events.forEach((e) => el.addEventListener(e, stop, { passive: true }))
    return () => {
      cancelAnimationFrame(frame)
      events.forEach((e) => el.removeEventListener(e, stop))
    }
  }, [manual, run])

  return (
    <div className="tyl-screen tyl-focus-dark" style={{ ...st(`height:max(var(--screen-h, 100dvh), 560px);${SCREEN};gap:20px`), ...fontVars(t.font) }}>
      <h1 className="tyl-keep" style={st('margin:0;font-size:22px;font-weight:400;line-height:1.5;letter-spacing:-0.4px')}>
        {t.opened(letter.unlockAt, letter.createdAt)}
      </h1>
      <div
        style={{
          ...st('flex-grow:1;flex-shrink:1;min-height:0;position:relative'),
          transform: up ? 'translateY(0px)' : 'translateY(120%)',
          transition: reducedMotion ? undefined : 'transform .9s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div style={st('position:absolute;top:0;right:0;bottom:0;left:0;background:#F4F7FC;border-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,.08),0 14px 30px rgba(30,58,123,.12);overflow:hidden')}>
          <div style={{ height: 8, background: STRIPES }} />
          <div ref={paper} tabIndex={0} style={st('position:absolute;top:8px;left:0;right:0;bottom:0;overflow-x:hidden;overflow-y:auto;outline:none')}>
            <div style={st('padding:22px 24px 40px;color:#13254F')}>
              <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:10px;min-height:64px')}>
                <span className="tyl-keep" style={st(`font-family:${PEN};font-size:36px;line-height:1;min-width:0`)}>
                  {t.dear(letter.to)}
                </span>
                <Stamp at={letter.unlockAt} small />
              </div>
              {paras.map((para, i) => (
                <p key={i} className="tyl-text" style={st('margin:0 0 32px;font-size:17px;line-height:32px')}>
                  {para}
                </p>
              ))}
              <p className="tyl-keep" style={st(`margin:0;text-align:right;font-family:${PEN};font-size:26px;line-height:32px`)}>
                {t.signed(letter.from, letter.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div style={st(BUTTONS)}>
        {manual ? (
          <button
            type="button"
            style={st(OUTLINE)}
            onClick={() => {
              if (paper.current) paper.current.scrollTop = 0
              if (!reducedMotion) {
                setManual(false)
                setRun((r) => r + 1)
              }
            }}
          >
            {t.restart}
          </button>
        ) : (
          <button type="button" style={st(OUTLINE)} onClick={() => setManual(true)}>
            {t.manual}
          </button>
        )}
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          {t.reply}
        </button>
      </div>
    </div>
  )
}

export const air: Theme = {
  id: 'air',
  code: 9,
  name: { ko: '항공 봉투', en: 'Airmail' },
  tints: null,
  fonts: { ko: ['Gowun+Dodum', 'Nanum+Pen+Script'], en: ['Nunito:wght@400;600', 'Caveat:wght@500;600'] },
  tile: {
    bg: 'repeating-linear-gradient(135deg,#C8322B 0,#C8322B 7px,#FFFFFF 7px,#FFFFFF 14px,#1E3A7B 14px,#1E3A7B 21px,#FFFFFF 21px,#FFFFFF 28px)',
    markBg: '#FBFBF8',
    markW: '54px',
    markH: '76px',
    markRadius: '2px',
  },
  preview: { bg: '#E3E7EC', fg: NAVY, font: FONT, bubbleBg: '#F4F7FC', bubbleFg: '#13254F', radius: '2px', pad: '14px 16px', size: '17px' },
  Locked,
  Open,
}
