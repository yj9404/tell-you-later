import { LockError, remaining, st, usePhases, useThemeStrings } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import { strings } from './strings.ts'
import type { LockedProps, OpenProps, Theme } from '../types.ts'

// 잠금화면 테마 (디자인: I-lockscreen, I-open). 홈 화면 아이콘은 디자인의 자체 도형이다.
const SANS = "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"
const WALL =
  'background-image:radial-gradient(circle at 15% 12%,rgba(255,255,255,0.38) 0%,rgba(255,255,255,0) 46%),radial-gradient(circle at 92% 48%,rgba(255,110,190,0.50) 0%,rgba(255,110,190,0) 52%),radial-gradient(circle at 25% 98%,rgba(0,0,0,0.50) 0%,rgba(0,0,0,0) 58%),radial-gradient(circle at 80% 100%,rgba(60,220,255,0.35) 0%,rgba(60,220,255,0) 45%)'
const DEFAULT_TINT = '#2447D6'

function Notification({ name, line, style }: { name: string; line: string; style?: string }) {
  const t = useThemeStrings(strings)
  return (
    <div
      style={st(
        `background:rgba(255,255,255,0.24);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);color:#FFFFFF;border-radius:22px;padding:14px;display:flex;gap:12px;align-items:center;position:relative;z-index:1;${style ?? ''}`,
      )}
    >
      <div aria-hidden="true" style={st('width:42px;height:42px;flex-shrink:0;border-radius:11px;background:#000000;display:flex;align-items:center;justify-content:center')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>
      <div style={st('display:flex;flex-direction:column;gap:2px;flex-grow:1;min-width:0')}>
        <div style={st('display:flex;justify-content:space-between;align-items:baseline;gap:8px')}>
          <span style={st('font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{name}</span>
          <span style={st('font-size:12px;color:#FFFFFF;flex-shrink:0')}>{t.now}</span>
        </div>
        <span className="tyl-keep" style={st('font-size:15px;line-height:1.4')}>
          {line}
        </span>
      </div>
    </div>
  )
}

function Clock({ at, open }: { at: Date; open: boolean }) {
  const g = useStrings()
  return (
    <>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d={open ? 'M8 11V5a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'} />
      </svg>
      <span style={st('font-size:20px;font-weight:500;margin-top:12px')}>{g.date.dayDate(at)}</span>
      <span style={st('font-size:116px;font-weight:700;line-height:1.05;letter-spacing:-3px')}>{g.date.hm(at)}</span>
    </>
  )
}

function Locked(p: LockedProps) {
  const { letter, now } = p
  const g = useStrings()
  const t = useThemeStrings(strings)
  const tint = letter.tint ?? DEFAULT_TINT
  const today = new Date(now)
  return (
    <div
      className="tyl-screen tyl-focus-light"
      style={{ ...st(`min-height:var(--screen-h, 100dvh);box-sizing:border-box;${WALL};color:#FFFFFF;font-family:${SANS};padding:56px 18px 26px;display:flex;flex-direction:column;gap:20px`), backgroundColor: tint }}
    >
      <div style={st('display:flex;flex-direction:column;align-items:center;gap:0')}>
        <Clock at={letter.unlockAt} open={false} />
        <span style={st('font-size:15px;font-weight:500')}>{t.unlockNote}</span>
      </div>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center')}>
        <Notification name={letter.from} line={g.teaser(letter.unlockAt, today)} />
        <div aria-hidden="true" style={st('height:14px;margin:0 16px;background:#FFFFFF;opacity:0.14;border-radius:0 0 18px 18px')} />
        <p style={st('margin:16px 6px 0;font-size:14px;line-height:1.6')}>{t.hidden(letter.unlockAt, today)}</p>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:12px')}>
        <div style={st('padding:0 6px')}>
          <LockError {...p} />
        </div>
        {p.status !== 'error' && (
          <div style={st('display:flex;justify-content:space-between;align-items:baseline;padding:0 6px')}>
            <span style={st('font-size:15px;font-weight:500')}>{t.untilUnlock}</span>
            <span style={st('font-size:24px;font-weight:700;letter-spacing:-0.5px;font-variant-numeric:tabular-nums')}>{remaining(p, g, t.unlocking)}</span>
          </div>
        )}
        <button
          type="button"
          style={{ ...st('height:56px;border:0;border-radius:28px;background:#FFFFFF;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer'), color: tint }}
          onClick={p.onWrite} disabled={p.preview}
        >
          {t.writeOwn}
        </button>
        <button
          type="button"
          style={st('height:44px;border:0;background:transparent;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:500;text-decoration:underline;text-underline-offset:4px;cursor:pointer')}
          onClick={p.onSaveCalendar} disabled={p.preview}
        >
          {g.calendar.save}
        </button>
      </div>
    </div>
  )
}

const ICON_BOX = 'width:62px;height:62px;border-radius:15px;display:flex;align-items:center;justify-content:center'
const ICON_CELL = 'display:flex;flex-direction:column;align-items:center;gap:6px'

function Home({ at }: { at: Date }) {
  const g = useStrings()
  const t = useThemeStrings(strings)
  return (
    <div style={st('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 0;font-size:11px;text-align:center')}>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#34B34A`)}>
          <div style={st('width:32px;height:24px;border-radius:9px;background:#FFFFFF')} />
        </div>
        <span>{t.apps[0]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#FFFFFF;flex-direction:column;color:#D2232A;line-height:1`)}>
          <span style={st('font-size:10px;font-weight:700')}>{g.date.weekdayName(at)}</span>
          <span style={st('font-size:30px;font-weight:500;color:#000000')}>{at.getDate()}</span>
        </div>
        <span>{t.apps[1]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#F2F2F2`)}>
          <div style={st('width:28px;height:28px;border-radius:50%;background:#FF9F0A')} />
        </div>
        <span>{t.apps[2]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#5AC18E`)}>
          <div style={st('width:10px;height:44px;border-radius:5px;background:#FFFFFF;transform:rotate(35deg)')} />
        </div>
        <span>{t.apps[3]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#3D8BFF`)}>
          <div style={st('width:26px;height:26px;border-radius:50%;background:#FFE14A')} />
        </div>
        <span>{t.apps[4]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#1B1B1B`)}>
          <div style={st('width:30px;height:30px;box-sizing:border-box;border-radius:50%;border:3px solid #FFFFFF')} />
        </div>
        <span>{t.apps[5]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st(`${ICON_BOX};background:#8E8E93`)}>
          <div style={st('width:30px;height:30px;box-sizing:border-box;border-radius:50%;border:6px dotted #FFFFFF')} />
        </div>
        <span>{t.apps[6]}</span>
      </div>
      <div style={st(ICON_CELL)}>
        <div style={st('width:62px;height:62px;border-radius:15px;background:#FFFFFF;overflow:hidden;display:flex;flex-direction:column')}>
          <div style={st('height:17px;background:#FFD23F')} />
          <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 10px')}>
            <div style={st('height:3px;background:#C9C9C9')} />
            <div style={st('height:3px;background:#C9C9C9')} />
            <div style={st('height:3px;width:60%;background:#C9C9C9')} />
          </div>
        </div>
        <span>{t.apps[7]}</span>
      </div>
    </div>
  )
}

// 잠금화면이 올라감 → 홈 화면 → 메모가 열림 (I-open 스크립트의 시각)
const STEPS = [
  ['lock', 0],
  ['home', 1400],
  ['note', 2700],
] as const

const LAYER = 'position:absolute;left:0;right:0;top:0;bottom:0;box-sizing:border-box'

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const g = useStrings()
  const t = useThemeStrings(strings)
  const { phase, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const tint = letter.tint ?? DEFAULT_TINT
  const lock = phase === 'lock'
  const note = phase === 'note'
  return (
    <div
      className="tyl-screen tyl-focus-dark"
      style={{ ...st(`height:var(--screen-h, 100dvh);box-sizing:border-box;position:relative;overflow:hidden;${WALL};color:#FFFFFF;font-family:${SANS}`), backgroundColor: tint }}
    >
      <div
        aria-hidden="true"
        style={{ ...st(`${LAYER};padding:76px 26px 0;transition:opacity 0.5s ease,transform 0.5s ease`), opacity: lock ? 0 : 1, transform: lock ? 'scale(0.92)' : 'none' }}
      >
        <Home at={letter.unlockAt} />
      </div>

      <div
        aria-hidden={!lock}
        style={{
          ...st(`${LAYER};padding:56px 18px 26px;display:flex;flex-direction:column;align-items:center;transition:transform 0.6s cubic-bezier(0.4,0,0.2,1),opacity 0.6s`),
          transform: lock ? 'none' : 'translateY(-100%)',
          opacity: lock ? 1 : 0,
        }}
      >
        <Clock at={letter.unlockAt} open />
        <Notification name={letter.from} line={t.openLine(g.date.teaserDate(letter.unlockAt, letter.createdAt))} style="align-self:stretch;margin-top:70px" />
        {!done && (
          <button
            type="button"
            className="tyl-focus-light"
            style={st('margin-top:auto;height:44px;border:0;background:transparent;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:500;text-decoration:underline;text-underline-offset:4px;cursor:pointer')}
            onClick={skip}
          >
            {g.locked.showAll}
          </button>
        )}
      </div>

      <div
        aria-hidden={!note}
        style={{
          ...st(
            `${LAYER};background:#FFFFFF;color:#000000;padding:22px 22px 24px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;transform-origin:333px 215px;transition:transform 0.45s cubic-bezier(0.3,0.9,0.3,1),opacity 0.25s,border-radius 0.45s`,
          ),
          transform: note ? 'none' : 'scale(0.16)',
          opacity: note ? 1 : 0,
          borderRadius: note ? '0px' : '90px',
          pointerEvents: note ? 'auto' : 'none',
        }}
      >
        <div style={st('display:flex;align-items:center;gap:4px;color:#A35F00;font-size:16px;font-weight:500')}>
          <svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#A35F00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2L2 10l8 8" />
          </svg>
          <span>{t.notes}</span>
        </div>
        <span style={st('align-self:center;font-size:12px;color:#6D6D72')}>{g.date.dateClock(letter.unlockAt)}</span>
        <h1 className="tyl-keep" style={st('margin:0;font-size:27px;font-weight:800;letter-spacing:-0.8px')}>
          {t.toTitle(letter.to)}
        </h1>
        <p className="tyl-text" style={st('margin:0;font-size:17px;line-height:1.8')}>
          {text}
        </p>
        <span style={st('font-size:15px;color:#6D6D72')}>
          {t.signed(letter.from, letter.createdAt)}
        </span>
        <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:auto;padding-top:10px')}>
          <button
            type="button"
            style={st('height:54px;border:1px solid #BDBDBD;border-radius:27px;background:#FFFFFF;color:#000000;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer')}
            onClick={replay}
          >
            {g.locked.replay}
          </button>
          <button
            type="button"
            style={st('height:54px;border:0;border-radius:27px;background:#000000;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer')}
            onClick={onReply} disabled={preview}
          >
            {t.writeOwn}
          </button>
        </div>
      </div>
    </div>
  )
}

const TINTS = [
  { hex: '#2447D6', name: { ko: '파랑', en: 'Blue' } },
  { hex: '#C9245F', name: { ko: '자홍', en: 'Magenta' } },
  { hex: '#0F7A45', name: { ko: '초록', en: 'Green' } },
  { hex: '#1B1B1B', name: { ko: '검정', en: 'Black' } },
]

export const lock: Theme = {
  id: 'lock',
  code: 3,
  name: { ko: '잠금화면', en: 'Lock screen' },
  tints: TINTS,
  fonts: { ko: ['Noto+Sans+KR:wght@400;500;700;800'] },
  tile: { markBg: 'rgba(255,255,255,0.75)', markW: '50px', markH: '18px', markRadius: '6px' },
  preview: { fg: '#FFFFFF', font: SANS, bubbleBg: 'rgba(255,255,255,0.24)', bubbleFg: '#FFFFFF', radius: '16px', pad: '12px 14px', size: '16px' },
  Locked,
  Open,
}
