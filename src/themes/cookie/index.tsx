import { useStrings } from '../../i18n/index.ts'
import { LockError, remaining, st, usePhases, useThemeStrings } from '../shared.tsx'
import { strings } from './strings.ts'
import type { LockedProps, OpenProps, Theme } from '../types.ts'
import whole from './fortune-cookie.webp'
import left from './cookie-left.webp'
import right from './cookie-right.webp'
import slip from './cookie-slip.webp'
import './cookie.css'

// 포춘쿠키 테마 (디자인: G-capsule, G-open). 쿠키 그림은 전달받은 PNG 4장이다.
const FONT = "'Noto Sans KR',sans-serif"
const DISPLAY = "'Bagel Fat One',sans-serif"
const SCREEN = `min-height:var(--screen-h, 100dvh);box-sizing:border-box;background:#C8321F;color:#FFFFFF;font-family:${FONT};padding:32px 24px 26px;display:flex;flex-direction:column;overflow-x:hidden`
const OUTLINE = `height:56px;border:2px solid #FFFFFF;border-radius:16px;background:transparent;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`
const SOLID = `height:56px;box-sizing:border-box;border:0;border-radius:16px;background:#FFFFFF;color:#C8321F;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`

function Locked(p: LockedProps) {
  const { letter, now } = p
  const g = useStrings()
  const t = useThemeStrings(strings)
  const title = t.breaksAt(letter.unlockAt, new Date(now))
  return (
    <div className="tyl-screen tyl-focus-light" style={st(`${SCREEN};gap:20px`)}>
      <div style={st('display:flex;flex-direction:column;gap:6px')}>
        <p className="tyl-keep" style={st('margin:0;font-size:16px;font-weight:700')}>
          {t.bakedFor(letter.to, letter.from)}
        </p>
        <h1 className="tyl-keep" style={st(`margin:0;font-family:${DISPLAY};font-weight:400;font-size:46px;line-height:1.15;letter-spacing:-1px`)}>
          {title[0]}
          <br />
          {title[1]}
        </h1>
      </div>

      <div style={st('flex-grow:1;display:flex;align-items:center;justify-content:center')}>
        <img src={whole} alt="" width="296" height="245" style={st('display:block;max-width:100%;height:auto;filter:drop-shadow(0 12px 0 rgba(0,0,0,0.2))')} />
      </div>

      <div style={st('display:flex;flex-direction:column;gap:4px')}>
        <LockError {...p} />
        {p.status !== 'error' && (
          <>
            <span style={st('font-size:15px;font-weight:700')}>{t.untilBreak}</span>
            <span style={st(`font-family:${DISPLAY};font-size:42px;line-height:1.1`)}>{remaining(p, g, t.breaking)}</span>
          </>
        )}
        <p style={st('margin:4px 0 0;font-size:14px;font-weight:500;line-height:1.6')}>{t.promise(letter.unlockAt)}</p>
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
  )
}

// 쿠키가 흔들리다 갈라지고 쪽지가 펼쳐진다 (G-open 스크립트의 시각)
const STEPS = [
  ['closed', 0],
  ['shake', 800],
  ['crack', 1450],
  ['paper', 2350],
] as const

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, run, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const intact = phase === 'closed' || phase === 'shake'
  const paper = phase === 'paper'
  const g = useStrings()
  const t = useThemeStrings(strings)
  const when = t.opening(letter.unlockAt, letter.createdAt)

  return (
    <div className="tyl-screen tyl-focus-light" style={st(`${SCREEN};gap:16px`)}>
      <h1 className="tyl-keep" style={st(`margin:0;font-family:${DISPLAY};font-weight:400;font-size:36px;line-height:1.2;letter-spacing:-1px`)}>
        {paper ? t.slipTitle(letter.from) : when}
      </h1>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:14px')}>
        {/* 쪽지가 길면 종이가 세로로 길어지고 화면이 스크롤된다. 펼쳐지기 전에는 자리만 조금 차지한다. */}
        <div
          aria-hidden={!paper}
          style={{
            ...st(
              'width:300px;max-width:100%;box-sizing:border-box;background:#FBF8F0;color:#000000;border:3px solid #2A1A12;padding:20px 18px 14px;display:flex;flex-direction:column;gap:14px;transform-origin:50% 100%;transition:transform 0.7s cubic-bezier(0.2,0.8,0.2,1),opacity 0.3s;position:relative;z-index:1',
            ),
            transform: paper ? 'none' : 'translateY(120px) scale(0.3,0.1)',
            opacity: paper ? 1 : 0,
            maxHeight: paper ? undefined : 260,
            overflow: paper ? undefined : 'hidden',
          }}
        >
          <p className="tyl-text" style={st('margin:0;font-size:16px;font-weight:500;line-height:1.8')}>
            {text}
          </p>
          <div style={st('display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-top:1px dashed #C8321F;padding-top:10px;color:#C8321F;font-size:13px;font-weight:700')}>
            <span>{t.bakedBy(letter.from)}</span>
            <span style={st('flex-shrink:0')}>
              {t.lucky(letter.unlockAt)}
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{ ...st('position:relative;width:342px;height:170px;flex-shrink:0;transition:transform 0.6s cubic-bezier(0.3,1.2,0.5,1)'), transform: paper ? 'none' : 'translateY(-200px) scale(1.2)' }}
        >
          <img
            key={run}
            src={whole}
            alt=""
            width="206"
            style={{ ...st('position:absolute;left:68px;top:0;transition:opacity 0.12s'), opacity: intact ? 1 : 0, animation: phase === 'shake' ? 'gShake 0.6s ease-in-out both' : 'none' }}
          />
          <img
            src={slip}
            alt=""
            width="150"
            style={{
              ...st('position:absolute;left:96px;top:38px;transition:transform 0.45s cubic-bezier(0.2,1.5,0.4,1),opacity 0.3s'),
              opacity: phase === 'crack' ? 1 : 0,
              transform: phase === 'crack' ? 'none' : paper ? 'translateY(-70px) scale(1.5)' : 'scale(0.2)',
            }}
          />
          <img
            src={left}
            alt=""
            width="128"
            style={{
              ...st('position:absolute;left:52px;top:22px;transition:transform 0.5s cubic-bezier(0.3,1.4,0.5,1),opacity 0.12s'),
              opacity: intact ? 0 : 1,
              transform: intact ? 'none' : paper ? 'translate(-56px,6px) rotate(-10deg)' : 'translate(-72px,0) rotate(-14deg)',
            }}
          />
          <img
            src={right}
            alt=""
            width="134"
            style={{
              ...st('position:absolute;left:162px;top:20px;transition:transform 0.5s cubic-bezier(0.3,1.4,0.5,1),opacity 0.12s'),
              opacity: intact ? 0 : 1,
              transform: intact ? 'none' : paper ? 'translate(60px,6px) rotate(10deg)' : 'translate(76px,0) rotate(14deg)',
            }}
          />
        </div>
      </div>

      <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')}>
        <button type="button" style={st(OUTLINE)} onClick={done ? replay : skip}>
          {done ? t.crackAgain : g.locked.showAll}
        </button>
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          {t.writeOwn}
        </button>
      </div>
    </div>
  )
}

export const cookie: Theme = {
  id: 'cookie',
  code: 6,
  name: { ko: '포춘쿠키', en: 'Fortune cookie' },
  tints: null,
  fonts: { ko: ['Bagel+Fat+One', 'Noto+Sans+KR:wght@500;700'] },
  tile: { bg: '#C8321F', markBg: '#E8A93A', markW: '46px', markH: '32px', markRadius: '50% 50% 42% 42%' },
  preview: { bg: '#C8321F', fg: '#FFFFFF', font: `${DISPLAY.replace(',sans-serif', '')},'Noto Sans KR',sans-serif`, bubbleBg: 'transparent', bubbleFg: '#FFFFFF', radius: '0', pad: '0', size: '24px' },
  Locked,
  Open,
}
