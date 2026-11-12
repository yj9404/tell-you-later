import { useEffect, useMemo, useRef, useState } from 'react'
import { paragraphs } from '../../lib/bubbles.ts'
import { dateHour, fullDate, monthDot, whenText } from '../../lib/date.ts'
import { LockError, remaining, st } from '../shared.tsx'
import type { LockedProps, OpenProps, Theme } from '../types.ts'

// 항공 봉투 테마 (디자인: F-airmail, F-open)
const FONT = "'Gowun Dodum',sans-serif"
const SCREEN = `box-sizing:border-box;background:#EEF1F5;color:#1F3C88;font-family:${FONT};display:flex;flex-direction:column`
const STRIPES =
  'background-image:repeating-linear-gradient(135deg,#D7263D 0,#D7263D 14px,#FFFFFF 14px,#FFFFFF 28px,#1F3C88 28px,#1F3C88 42px,#FFFFFF 42px,#FFFFFF 56px);box-shadow:0 14px 28px rgba(31,60,136,0.16)'
const OUTLINE = `height:54px;border:1.5px solid #1F3C88;border-radius:8px;background:transparent;color:#1F3C88;font-family:${FONT};font-size:16px;cursor:pointer`
const SOLID = `height:54px;border:0;border-radius:8px;background:#1F3C88;color:#FFFFFF;font-family:${FONT};font-size:16px;cursor:pointer`
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px'

function Stamp({ at, small }: { at: Date; small?: boolean }) {
  return (
    <div
      style={st(
        `${small ? 'width:52px;height:60px' : 'width:58px;height:68px'};flex-shrink:0;box-sizing:border-box;border:2px dotted #D7263D;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#D7263D;line-height:1.1`,
      )}
    >
      <span style={{ fontSize: small ? 10 : 11 }}>{at.getFullYear()}</span>
      <span style={{ fontSize: (small ? 22 : 26) * (monthDot(at).length > 4 ? 0.7 : monthDot(at).length > 3 ? 0.85 : 1) }}>{monthDot(at)}</span>
    </div>
  )
}

function Locked(p: LockedProps) {
  const { letter, now } = p
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN};padding:36px 26px 28px;gap:24px;overflow-x:hidden`)}>
      <h1 className="tyl-keep" style={st('margin:0;font-size:26px;font-weight:400;line-height:1.5;letter-spacing:-0.5px')}>
        편지가 도착했어요.
        <br />
        {whenText(letter.unlockAt, new Date(now))}에 열립니다.
      </h1>

      <div style={st('flex-grow:1;display:flex;align-items:center;justify-content:center')}>
        <div style={st(`width:330px;max-width:100%;min-height:226px;box-sizing:border-box;padding:11px;transform:rotate(-3deg);display:flex;${STRIPES}`)}>
          <div style={st('flex-grow:1;min-width:0;box-sizing:border-box;background:#FFFFFF;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;gap:10px')}>
            <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:10px')}>
              <span className="tyl-keep" style={st('font-size:13px;line-height:1.5;min-width:0')}>
                보내는 사람
                <br />
                {letter.from}
              </span>
              <Stamp at={letter.unlockAt} />
            </div>
            <span className="tyl-keep" style={{ ...st('letter-spacing:-0.5px;text-align:center;line-height:1.25'), fontSize: letter.to.length > 6 ? 24 : 34 }}>
              {letter.to}에게
            </span>
            <span style={st('font-size:12px;text-align:right;color:#D7263D')}>{dateHour(letter.unlockAt)} 전 개봉 불가</span>
          </div>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:6px')}>
        <LockError {...p} />
        {p.status !== 'error' && (
          <>
            <span style={st('font-size:15px')}>열리기까지</span>
            <span style={st('font-size:40px;letter-spacing:-1px;line-height:1.1')}>{remaining(p)}</span>
          </>
        )}
        <p style={st('margin:4px 0 0;font-size:14px;line-height:1.65;color:#3B4A6B')}>그 전에는 쓴 사람도, 이 사이트도 열 수 없어요.</p>
      </div>

      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 넣기
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 한 통 쓰기
        </button>
      </div>
    </div>
  )
}

// 편지지가 위로 자동 스크롤된다. 디자인(F-open)은 1.2초 뒤부터 22초 동안 끝까지 올라간다.
const START_DELAY = 1200
const ROLL_TIME = 22_000
// 디자인 예시 편지가 22초 동안 움직이는 거리(약 400px). 더 긴 편지는 같은 속도로 더 오래 올라간다.
const DESIGN_DISTANCE = 400

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const paras = useMemo(() => paragraphs(text), [text])
  const [manual, setManual] = useState(!autoplay)
  const [run, setRun] = useState(0)
  const paper = useRef<HTMLDivElement>(null)

  // CSS 애니메이션 대신 실제 스크롤 위치를 움직인다. 사용자가 화면을 건드리면 그 자리에서
  // 멈추고 그대로 손으로 넘겨 읽을 수 있다.
  useEffect(() => {
    const el = paper.current
    if (manual || !el) return
    el.scrollTop = 0
    const distance = el.scrollHeight - el.clientHeight
    if (distance <= 0) return setManual(true)
    const duration = ROLL_TIME * Math.max(1, distance / DESIGN_DISTANCE)
    let frame = 0
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t + START_DELAY
      const progress = Math.min(1, Math.max(0, (t - start) / duration))
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
    <div className="tyl-screen tyl-focus-dark" style={st(`height:var(--screen-h, 100dvh);${SCREEN};padding:32px 26px 28px;gap:20px`)}>
      <h1 className="tyl-keep" style={st('margin:0;font-size:24px;font-weight:400;line-height:1.5;letter-spacing:-0.5px')}>
        {whenText(letter.unlockAt, letter.createdAt)}, 편지가 열렸어요.
      </h1>

      <div style={st(`flex-grow:1;min-height:0;box-sizing:border-box;padding:11px;${STRIPES}`)}>
        <div ref={paper} tabIndex={0} style={st('height:100%;background:#FFFFFF;overflow-x:hidden;overflow-y:auto;outline:none')}>
          <div style={st('padding:26px 24px 40px')}>
            <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:26px')}>
              <span className="tyl-keep" style={st('font-size:26px;letter-spacing:-0.5px;min-width:0')}>
                {letter.to}에게
              </span>
              <Stamp at={letter.unlockAt} small />
            </div>
            {paras.map((para, i) => (
              <p key={i} className="tyl-text" style={st(`margin:0 0 ${i === paras.length - 1 ? 28 : 20}px;font-size:17px;line-height:2;color:#22305A`)}>
                {para}
              </p>
            ))}
            <p style={st('margin:0;font-size:17px;text-align:right;color:#22305A')}>
              {fullDate(letter.createdAt)}, {letter.from}
            </p>
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
            처음부터 다시
          </button>
        ) : (
          <button type="button" style={st(OUTLINE)} onClick={() => setManual(true)}>
            직접 넘겨 읽기
          </button>
        )}
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          답장 부치기
        </button>
      </div>
    </div>
  )
}

export const air: Theme = {
  id: 'air',
  code: 9,
  name: '항공 봉투',
  tints: null,
  fonts: ['Gowun+Dodum'],
  tile: {
    bg: 'repeating-linear-gradient(135deg,#D7263D 0,#D7263D 7px,#FFFFFF 7px,#FFFFFF 14px,#1F3C88 14px,#1F3C88 21px,#FFFFFF 21px,#FFFFFF 28px)',
    markBg: '#FFFFFF',
    markW: '54px',
    markH: '76px',
    markRadius: '2px',
  },
  preview: { bg: '#EEF1F5', fg: '#1F3C88', font: FONT, bubbleBg: '#FFFFFF', bubbleFg: '#1F3C88', radius: '4px', pad: '14px 16px', size: '19px' },
  Locked,
  Open,
}
