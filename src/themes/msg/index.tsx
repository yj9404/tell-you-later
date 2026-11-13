import { chatIntro, LockError, remaining, st, useBubblePlayback, useThemeStrings } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import { strings } from './strings.ts'
import type { LockedProps, OpenProps, Theme } from '../types.ts'
import './msg.css'

// 문자 테마 (디자인: L-message, L-open). 일반적인 문자 대화 모양만 쓴다.
const SANS = "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"
const SCREEN = `box-sizing:border-box;background:#FFFFFF;color:#000000;font-family:${SANS};display:flex;flex-direction:column`

function Header({ name }: { name: string }) {
  return (
    <div style={st('display:flex;flex-direction:column;align-items:center;gap:5px;padding:18px 16px 10px;background:#F6F6F6;border-bottom:1px solid #E2E2E2')}>
      <div
        aria-hidden="true"
        style={st(
          'width:52px;height:52px;border-radius:50%;background:linear-gradient(180deg,#A9AEBA 0%,#858A96 100%);color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:500',
        )}
      >
        {Array.from(name)[0]}
      </div>
      <span style={st('font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{name}</span>
    </div>
  )
}

function Typing({ label, animated, style }: { label: string; animated: boolean; style: string }) {
  const dot = 'width:9px;height:9px;border-radius:50%;background:#6D6D72'
  return (
    <div role="img" aria-label={label} style={st(`align-self:flex-start;position:relative;background:#E9E9EB;border-radius:20px;padding:14px 16px;display:flex;gap:5px;align-items:center;${style}`)}>
      <div style={st('position:absolute;left:-3px;bottom:-2px;width:12px;height:12px;border-radius:50%;background:#E9E9EB')} />
      <div style={st('position:absolute;left:-10px;bottom:-8px;width:6px;height:6px;border-radius:50%;background:#E9E9EB')} />
      {animated ? (
        <>
          <div style={st(`${dot};animation:lDot 1.1s infinite`)} />
          <div style={st(`${dot};animation:lDot 1.1s 0.18s infinite`)} />
          <div style={st(`${dot};animation:lDot 1.1s 0.36s infinite`)} />
        </>
      ) : (
        <>
          <div style={st(dot)} />
          <div style={st(`${dot};opacity:0.6`)} />
          <div style={st(`${dot};opacity:0.35`)} />
        </>
      )}
    </div>
  )
}

// 받은 말풍선. 첫 말풍선들과 편지 말풍선이 같은 모양·글자 크기다.
const BUBBLE = 'margin:0;align-self:flex-start;max-width:290px;background:#E9E9EB;border-radius:20px;padding:9px 14px;font-size:16px;font-weight:400;line-height:1.4'

/** "지민아" / "할 말이 있는데 {날짜}에 할게" / "그게 뭐냐면…". 예고 문구 말풍선은 화면의 제목(h1)이다. */
function Intro({ lines, teaserText }: { lines: string[]; teaserText: string }) {
  return (
    <>
      {lines.map((line, i) =>
        line === teaserText ? (
          <h1 key={i} className="tyl-keep" style={st(BUBBLE)}>
            {line}
          </h1>
        ) : (
          <div key={i} className="tyl-keep" style={st(BUBBLE)}>
            {line}
          </div>
        ),
      )}
    </>
  )
}

const PRIMARY =
  'flex-grow:1;height:50px;border:0;border-radius:25px;background:#0B6BF2;color:#FFFFFF;font-family:inherit;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer'
const ICON = 'flex-shrink:0;width:50px;height:50px;border:1px solid #C7C7CC;border-radius:50%;background:#FFFFFF;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0'

function Locked(p: LockedProps) {
  const { letter, now } = p
  const g = useStrings()
  const t = useThemeStrings(strings)
  const today = new Date(now)
  const lockedTeaser = g.teaser(letter.unlockAt, today)
  return (
    <div className="tyl-screen msg-screen" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Header name={letter.from} />

      <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:flex-end;padding:16px 16px 18px;gap:8px')}>
        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin-bottom:8px')}>{g.date.chatStamp(letter.createdAt, today)}</span>

        <div style={st('display:flex;flex-direction:column;gap:4px')}>
          <Intro lines={chatIntro(letter, g, lockedTeaser, t.introLast)} teaserText={lockedTeaser} />
          <Typing label={t.typingShown} animated={false} style="margin:4px 0 6px 6px" />
        </div>

        <div style={st('align-self:flex-start;max-width:100%;box-sizing:border-box;border:1.5px dashed #0B6BF2;color:#0B6BF2;border-radius:20px;padding:10px 15px;font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px')}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B6BF2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="tyl-keep">{t.pill(letter.unlockAt, today)}</span>
        </div>
        <span style={st('font-size:12px;color:#6D6D72;padding-left:6px')}>{t.nobody}</span>
      </div>

      <div style={st('padding:12px 16px 20px;display:flex;flex-direction:column;gap:12px;border-top:1px solid #EFEFEF')}>
        <div style={st('padding:0 6px')}>
          <LockError {...p} />
        </div>
        {p.status !== 'error' && (
          <div style={st('display:flex;justify-content:space-between;align-items:baseline;padding:0 6px')}>
            <span style={st('font-size:14px;color:#6D6D72')}>{t.countdownLabel}</span>
            <span style={st('font-size:22px;font-weight:800;letter-spacing:-0.5px;font-variant-numeric:tabular-nums')}>{remaining(p, g, t.receiving)}</span>
          </div>
        )}
        <div style={st('display:flex;gap:8px;align-items:center')}>
          <button type="button" style={st(PRIMARY)} onClick={p.onWrite} disabled={p.preview}>
            {t.writeOwn}
          </button>
          <button type="button" aria-label={g.calendar.save} style={st(ICON)} onClick={p.onSaveCalendar} disabled={p.preview}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B6BF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const g = useStrings()
  const t = useThemeStrings(strings)
  const play = useBubblePlayback(text, autoplay, reducedMotion)
  const openTeaser = g.teaser(letter.unlockAt, letter.createdAt)
  return (
    <div className="tyl-screen msg-screen" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Header name={letter.from} />

      <div ref={play.scroller} style={st('flex-grow:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:16px;gap:4px')}>
        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin-top:auto;margin-bottom:8px')}>{g.date.dateClock(letter.createdAt)}</span>
        <Intro lines={chatIntro(letter, g, openTeaser, t.introLast)} teaserText={openTeaser} />

        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin:18px 0 8px')}>{g.date.dateClock(letter.unlockAt)}</span>

        {play.bubbles.slice(0, play.shown).map((b, i) => (
          <div
            key={`${play.run}-${i}`}
            className="tyl-text"
            style={st(`${BUBBLE}${play.run > 0 ? ';animation:lPop 0.24s ease-out both' : ''}`)}
          >
            {b}
          </div>
        ))}

        {play.typing && <Typing label={t.typing} animated style="margin:2px 0 6px 6px;animation:lPop 0.2s ease-out both" />}
      </div>

      <div style={st('padding:12px 16px 20px;min-height:50px;display:flex;flex-direction:column;justify-content:flex-end;border-top:1px solid #EFEFEF')}>
        {play.done ? (
          <div style={st('display:flex;gap:8px;align-items:center')}>
            <button type="button" style={st(PRIMARY)} onClick={onReply} disabled={preview}>
              {t.reply}
            </button>
            <button type="button" aria-label={g.locked.replay} style={st(ICON)} onClick={play.replay}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B6BF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            style={st('height:50px;border:1px solid #C7C7CC;border-radius:25px;background:#FFFFFF;color:#0B6BF2;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer')}
            onClick={play.showAll}
          >
            {g.locked.showAll}
          </button>
        )}
      </div>
    </div>
  )
}

export const msg: Theme = {
  id: 'msg',
  code: 2,
  name: { ko: '문자', en: 'Text' },
  tints: null,
  fonts: { ko: ['Noto+Sans+KR:wght@400;500;700;800'] },
  tile: { bg: '#F6F6F6', markBg: '#0B6BF2', markW: '44px', markH: '16px', markRadius: '8px' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: SANS, bubbleBg: '#E9E9EB', bubbleFg: '#000000', radius: '22px 22px 22px 7px', pad: '12px 16px', size: '20px' },
  Locked,
  Open,
}
