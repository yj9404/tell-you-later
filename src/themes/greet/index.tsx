import { dateHour, whenText } from '../../lib/date.ts'
import { LockError, remaining, st, usePhases } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import type { LockedProps, OpenProps, Theme } from '../types.ts'
import { Backdrop, BACKDROP_FILL } from './Backdrop.tsx'
import './greet.css'

// 좋은 하루 테마 (디자인: M-greeting, M-open)
const FONT = "'Noto Sans KR',sans-serif"
const BRUSH = "'Nanum Brush Script',cursive"
const SCREEN = `box-sizing:border-box;${BACKDROP_FILL};color:#000000;font-family:${FONT};padding:26px 20px 24px;display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden`
const HALO2 = 'text-shadow:2px 0 #FFFFFF,-2px 0 #FFFFFF,0 2px #FFFFFF,0 -2px #FFFFFF,2px 2px #FFFFFF,-2px -2px #FFFFFF,2px -2px #FFFFFF,-2px 2px #FFFFFF'
const HALO3 = 'text-shadow:3px 0 #FFFFFF,-3px 0 #FFFFFF,0 3px #FFFFFF,0 -3px #FFFFFF,3px 3px #FFFFFF,-3px -3px #FFFFFF,3px -3px #FFFFFF,-3px 3px #FFFFFF'
const PRIMARY =
  'height:64px;border-radius:10px;background:#C4001A;border:3px solid #FFFFFF;box-shadow:0 4px 0 #7A0010;color:#FFFFFF;font-family:inherit;font-size:22px;font-weight:900;cursor:pointer'
const SECOND = `height:58px;border:3px solid #0A3FD6;border-radius:10px;background:#FFFFFF;color:#0A3FD6;font-family:${FONT};font-size:20px;font-weight:900;cursor:pointer`
const NOTICE = 'background:#FFF200;border:4px solid #E3001B;padding:12px 10px;text-align:center;font-size:19px;font-weight:900;line-height:1.5'

const To = ({ name }: { name: string }) => (
  <p className="tyl-keep" style={st(`margin:0;text-align:center;font-family:${BRUSH};font-size:44px;line-height:1.1;color:#C4004F;${HALO2};position:relative`)}>
    {name} 님
  </p>
)

const Greeting = () => (
  <>
    <span style={st('color:#E3001B')}>오늘도</span>
    <br />
    <span style={st('color:#0A3FD6')}>좋은 하루</span>
    <br />
    <span style={st('color:#0A7A2F')}>되세요</span>
  </>
)
const GREETING = `text-align:center;font-family:${BRUSH};font-weight:400;font-size:92px;line-height:1;${HALO3},5px 6px 0 rgba(0,0,0,0.25)`

function Locked(p: LockedProps) {
  // 이 테마는 한국어판 전용이다(영어 경로로 열려도 View가 한국어로 보여준다).
  const g = useStrings()
  const { letter } = p
  return (
    <div className="tyl-screen greet-screen" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Backdrop variant="full" />
      <To name={letter.to} />

      <h1 style={st(`margin:0;position:relative;${GREETING}`)}>
        <Greeting />
      </h1>

      <div className="tyl-keep" style={st(`position:relative;${NOTICE};margin-top:6px`)}>
        {letter.from} 님의 카드는
        <br />
        {dateHour(letter.unlockAt)}에 열립니다
      </div>

      <p style={st('margin:0;text-align:center;font-size:17px;font-weight:700;line-height:1.6;position:relative')}>
        그 전에는 누구도 열어 볼 수 없습니다.
        <br />
        건강이 최고입니다.
      </p>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative')}>
        {p.status === 'error' ? (
          <div style={st('background:#FFFFFF;border:4px solid #E3001B;padding:12px;font-weight:700')}>
            <LockError {...p} />
          </div>
        ) : (
          <>
            <span style={st('font-size:18px;font-weight:700')}>앞으로</span>
            <span style={st(`font-family:${BRUSH};font-size:76px;line-height:1;color:#E3001B;white-space:nowrap;${HALO3}`)}>{remaining(p, g)}</span>
          </>
        )}
      </div>

      <div style={st('display:flex;flex-direction:column;gap:10px;position:relative')}>
        <button type="button" style={st(PRIMARY)} onClick={p.onWrite} disabled={p.preview}>
          나도 카드 보내기
        </button>
        <button type="button" style={st(SECOND)} onClick={p.onSaveCalendar} disabled={p.preview}>
          달력에 적어두기
        </button>
      </div>
    </div>
  )
}

// 꽃잎이 떨어지고 편지가 나타난다 (M-open 스크립트의 값)
const STEPS = [
  ['closed', 0],
  ['open', 1200],
] as const
const PETAL_COLORS = ['#FF3B7F', '#FFFFFF', '#FFB7D2', '#B14DFF', '#FF6FA5', '#FFB300', '#E3001B']
const PETALS = Array.from({ length: 40 }, (_, i) => ({
  left: `${((i * 37) % 122) - 6}%`,
  delay: ((i * 53) % 220) / 100,
  dur: 2 + ((i * 29) % 100) / 100,
  size: 20 + ((i * 17) % 26),
  color: PETAL_COLORS[i % PETAL_COLORS.length],
}))

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, run, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const open = phase === 'open'
  return (
    <div className="tyl-screen greet-screen" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Backdrop variant="light" />
      <To name={letter.to} />

      <div style={st('flex-grow:1;min-height:0;position:relative')}>
        <div
          aria-hidden={open}
          style={{
            ...st('position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;gap:16px;justify-content:center;transition:opacity 0.6s,transform 0.6s;pointer-events:none'),
            opacity: open ? 0 : 1,
            transform: open ? 'scale(1.08)' : 'none',
          }}
        >
          <span style={st(GREETING)}>
            <Greeting />
          </span>
          <div className="tyl-keep" style={st(NOTICE)}>
            드디어 {whenText(letter.unlockAt, letter.createdAt)}입니다
          </div>
        </div>

        <div
          aria-hidden={!open}
          style={{
            ...st('position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;overflow-y:auto;transition:opacity 0.8s ease 0.5s,transform 0.8s ease 0.5s'),
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(16px)',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <div style={st('margin:auto 0;display:flex;flex-direction:column;gap:12px;padding:4px 0')}>
            <h1 style={st(`margin:0;text-align:center;font-family:${BRUSH};font-weight:400;font-size:54px;line-height:1.05;color:#E3001B;${HALO3}`)}>카드가 열렸습니다</h1>
            <div style={st('background:#FFFFFF;border:4px solid #E3001B;padding:16px 16px 12px;display:flex;flex-direction:column;gap:8px')}>
              <p className="tyl-text" style={st('margin:0;font-size:18px;font-weight:700;line-height:1.75')}>
                {text}
              </p>
              <span className="tyl-keep" style={st(`text-align:right;font-family:${BRUSH};font-size:36px;line-height:1;color:#0A3FD6`)}>
                {letter.from} 드림
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:10px;position:relative')}>
        <button type="button" style={st(PRIMARY)} onClick={onReply} disabled={preview}>
          답장 카드 보내기
        </button>
        <button type="button" style={st(SECOND)} onClick={done ? replay : skip}>
          {done ? '다시 보기' : '한 번에 보기'}
        </button>
      </div>

      {/* 꽃잎은 연출을 재생할 때만 날린다. */}
      {open &&
        run > 0 &&
        PETALS.map((petal, i) => (
          <svg
            key={`${run}-${i}`}
            aria-hidden="true"
            width={petal.size}
            height={petal.size}
            viewBox="-20 -50 40 52"
            style={{ ...st('position:absolute;top:-70px;pointer-events:none'), left: petal.left, color: petal.color, animation: `mFall ${petal.dur}s ease-in ${petal.delay}s both` }}
          >
            <path d="M0 0 C-15 -9 -19 -34 -7 -47 C-4 -44 -2 -43 0 -41 C3 -44 5 -45 8 -47 C19 -33 14 -10 0 0 Z" fill="currentColor" />
          </svg>
        ))}
    </div>
  )
}

export const greet: Theme = {
  id: 'greet',
  code: 10,
  name: { ko: '좋은 하루' },
  tints: null,
  fonts: { ko: ['Nanum+Brush+Script', 'Noto+Sans+KR:wght@500;700;900'] },
  tile: { bg: 'linear-gradient(180deg,#58B8FF,#FFD9EC)', markBg: '#E3001B', markW: '44px', markH: '14px', markRadius: '2px' },
  preview: { bg: 'linear-gradient(180deg,#58B8FF,#FFD9EC)', fg: '#000000', font: BRUSH, bubbleBg: '#FFF200', bubbleFg: '#C4001A', radius: '0', pad: '8px 12px', size: '28px' },
  Locked,
  Open,
}
