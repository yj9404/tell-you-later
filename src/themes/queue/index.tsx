import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { paragraphs } from '../../lib/bubbles.ts'
import { daysBetween, fullDate, iGa, openClock } from '../../lib/date.ts'
import { LockError, st, TeaserLines, usePhases } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'
import './queue.css'

// 대기열 테마 (디자인: J-queue, J-open). 대기순서 숫자는 여는 시각까지 남은 초다.
const FONT = "'Noto Sans KR',sans-serif"
const SCREEN = `box-sizing:border-box;background:#F2F3F5;color:#191B1F;font-family:${FONT};padding:18px 18px 24px;display:flex;flex-direction:column;gap:14px`
const CARD = 'flex-grow:1;flex-shrink:1;background:#FFFFFF;border-radius:20px;display:flex;flex-direction:column'
const ROW = 'display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:11px 0;border-top:1px solid #EEF0F3;font-size:14px'
const OUTLINE = 'height:54px;border:1px solid #D1D5DB;border-radius:12px;background:#FFFFFF;color:#191B1F;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer'
const SOLID = 'height:54px;border:0;border-radius:12px;background:#2F54EB;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer'
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px'

/** 남은 시간을 세 단위까지: "50일 12시간 54분", "3시간 5분 12초", "4분 12초", "9초" */
function waitText(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d > 0) return `${d}일 ${h}시간 ${m}분`
  if (h > 0) return `${h}시간 ${m}분 ${s}초`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

/** 쓴 시각부터 여는 시각까지의 초. 처음 받은 대기순서다. */
const totalWait = (letter: LetterInfo) => Math.max(1, Math.round((letter.unlockAt.getTime() - letter.createdAt.getTime()) / 1000))

function Header({ letter }: { letter: LetterInfo }) {
  return (
    <div style={st('display:flex;justify-content:space-between;align-items:center;gap:12px;height:32px;padding:0 4px;font-size:13px;color:#6B7280')}>
      <span style={st('font-weight:700;color:#191B1F;flex-shrink:0')}>예약 입장</span>
      <span style={st('min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
        {letter.from} → {letter.to}
      </span>
    </div>
  )
}

interface QueueProps {
  letter: LetterInfo
  /** 예고 문구 날짜 표기의 기준 시각 */
  now: Date
  status: string
  spinning: boolean
  num: number
  /** 진행률 0~1 */
  progress: number
  left: string
  children: ReactNode
}

/** 대기 카드. 잠김 화면과 열림 연출이 함께 쓴다. */
function QueueCard({ letter, now, status, spinning, num, progress, left, children }: QueueProps) {
  const percent = Math.floor(progress * 100)
  return (
    <div style={st(`${CARD};padding:26px 22px 20px`)}>
      <div role="status" style={st('display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#2F54EB')}>
        {spinning && <span aria-hidden="true" className="j-spin" style={st('width:14px;height:14px;box-sizing:border-box;border-radius:50%;border:2px solid #D6DBF5;border-top-color:#2F54EB')} />}
        <span>{status}</span>
      </div>
      <h1 className="tyl-keep" style={st('margin:12px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.6px;line-height:1.45')}>
        <TeaserLines unlock={letter.unlockAt} now={now} />
      </h1>
      <span style={st('margin-top:28px;font-size:14px;color:#6B7280')}>나의 대기순서</span>
      <div style={st('display:flex;align-items:baseline;flex-wrap:wrap;column-gap:6px;margin-top:2px')}>
        <span style={st('font-size:46px;font-weight:800;letter-spacing:-1.5px;line-height:1.15;font-variant-numeric:tabular-nums')}>{num.toLocaleString('ko-KR')}</span>
        <span style={st('font-size:18px;font-weight:600')}>번째</span>
      </div>
      <div role="img" aria-label={percent < 1 ? '대기 진행률 1퍼센트 미만' : `대기 진행률 ${percent}퍼센트`} style={st('margin-top:14px;height:6px;border-radius:3px;background:#EEF0F3;overflow:hidden')}>
        <div style={{ ...st('height:100%;min-width:6px;border-radius:3px;background:#2F54EB'), width: `${progress * 100}%` }} />
      </div>
      <div style={st('margin-top:20px')}>
        <div style={st(ROW)}>
          <span style={st('color:#6B7280;flex-shrink:0')}>입장 시각</span>
          <span style={st('font-weight:600;font-variant-numeric:tabular-nums;text-align:right')}>
            {fullDate(letter.unlockAt)} {openClock(letter.unlockAt)}
          </span>
        </div>
        <div style={st(ROW)}>
          <span style={st('color:#6B7280;flex-shrink:0')}>남은 시간</span>
          <span style={st('font-weight:600;font-variant-numeric:tabular-nums;text-align:right')}>{left}</span>
        </div>
        <div style={st(ROW)}>
          <span style={st('color:#6B7280;flex-shrink:0')}>그 전에는</span>
          <span style={st('font-weight:600;text-align:right')}>누구도 입장할 수 없어요</span>
        </div>
      </div>
      <div style={st('margin-top:auto;padding-top:16px')}>{children}</div>
    </div>
  )
}

const NOTE = (
  <div style={st('border-radius:12px;background:#F6F7F9;padding:14px 16px;font-size:13px;line-height:1.75;color:#4B5563')}>
    대기순서는 1초에 한 번씩 줄어요.
    <br />
    창을 닫았다가 다시 와도 순서는 그대로예요.
  </div>
)

function Locked(p: LockedProps) {
  const { letter, now } = p
  // 남은 초는 올림한다. 1초마다 갱신되는 now를 따라 1씩 준다.
  const num = Math.max(0, Math.ceil((letter.unlockAt.getTime() - now) / 1000))
  const total = totalWait(letter)
  const status = p.status === 'opening' ? '입장하는 중' : p.status === 'error' ? '입장하지 못했어요' : '접속 대기 중'
  return (
    <div className="tyl-screen tyl-focus-dark j-col" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Header letter={letter} />
      <QueueCard
        letter={letter}
        now={new Date(now)}
        status={status}
        spinning={p.status !== 'error'}
        num={num}
        progress={Math.min(1, Math.max(0, 1 - num / total))}
        left={p.status === 'opening' ? '입장 준비 중…' : waitText(num)}
      >
        {p.status === 'error' ? <LockError {...p} /> : NOTE}
      </QueueCard>
      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 저장
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 줄 세우기
        </button>
      </div>
    </div>
  )
}

// 대기순서가 0까지 줄고 → 입장하는 중 → 입장 완료 (J-open 스크립트의 값)
const STEPS = [
  ['wait', 0],
  ['run', 600],
  ['go', 2400],
  ['in', 3100],
] as const
const COUNT_TIME = 1800
const STATUS = { wait: '접속 대기 중', run: '순서가 다가오고 있어요', go: '입장하는 중' } as const

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const total = totalWait(letter)
  const paras = useMemo(() => paragraphs(text), [text])
  const [num, setNum] = useState(autoplay ? total : 0)

  // 숫자는 1.8초 동안 ease-out으로 0까지 준다.
  useEffect(() => {
    if (phase !== 'run') return setNum(phase === 'wait' ? total : 0)
    const t0 = performance.now()
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / COUNT_TIME)
      setNum(Math.round(total * Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, total])

  const days = daysBetween(letter.createdAt, letter.unlockAt)
  return (
    <div className="tyl-screen tyl-focus-dark j-col" style={st(`height:max(var(--screen-h, 100dvh), 680px);${SCREEN}`)}>
      <Header letter={letter} />
      {phase === 'in' ? (
        <div style={{ ...st(`${CARD};min-height:240px;padding:24px 22px 20px`), animation: reducedMotion ? undefined : 'jIn .45s ease-out both' }}>
          <div style={st('display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#2F54EB')}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F54EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
            <span>입장 완료</span>
          </div>
          <h1 className="tyl-keep" style={st('margin:12px 0 18px;font-size:22px;font-weight:700;letter-spacing:-0.6px;line-height:1.45')}>
            {iGa(letter.from)} 남긴 말
          </h1>
          <div style={st('flex-grow:1;min-height:0;overflow-y:auto')}>
            {paras.map((para, i) => (
              <p key={i} className="tyl-text" style={st('margin:0 0 10px;font-size:17px;line-height:1.8')}>
                {para}
              </p>
            ))}
          </div>
          <div style={st('padding-top:12px;border-top:1px solid #EEF0F3;display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#6B7280')}>
            <span>{fullDate(letter.createdAt)}에 씀</span>
            <span>{days > 0 ? `${days}일 기다림` : '같은 날 열림'}</span>
          </div>
        </div>
      ) : (
        <QueueCard letter={letter} now={letter.createdAt} status={STATUS[phase]} spinning num={num} progress={1 - num / total} left={waitText(num)}>
          {NOTE}
        </QueueCard>
      )}
      <div style={st(BUTTONS)}>
        {phase === 'in' ? (
          <button type="button" style={st(OUTLINE)} onClick={replay}>
            다시 입장하기
          </button>
        ) : (
          <button type="button" style={st(OUTLINE)} onClick={skip}>
            한 번에 보기
          </button>
        )}
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          나도 줄 세우기
        </button>
      </div>
    </div>
  )
}

export const queue: Theme = {
  id: 'queue',
  code: 4,
  name: '대기열',
  tints: null,
  fonts: ['Noto+Sans+KR:wght@400;500;600;700;800'],
  tile: { bg: '#F2F3F5', markBg: '#2F54EB', markW: '48px', markH: '6px', markRadius: '3px' },
  preview: { bg: '#F2F3F5', fg: '#191B1F', font: FONT, bubbleBg: '#FFFFFF', bubbleFg: '#191B1F', radius: '20px', pad: '14px 16px', size: '20px' },
  Locked,
  Open,
}
