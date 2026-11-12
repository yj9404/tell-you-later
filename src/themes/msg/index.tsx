import { chatStamp, dateClock, teaserDate, whenText } from '../../lib/date.ts'
import { LockError, remaining, st, useBubblePlayback } from '../shared.tsx'
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

const PRIMARY =
  'flex-grow:1;height:50px;border:0;border-radius:25px;background:#0B6BF2;color:#FFFFFF;font-family:inherit;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer'
const ICON = 'flex-shrink:0;width:50px;height:50px;border:1px solid #C7C7CC;border-radius:50%;background:#FFFFFF;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0'

function Locked(p: LockedProps) {
  const { letter, now } = p
  const today = new Date(now)
  return (
    <div className="tyl-screen msg-screen" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Header name={letter.from} />

      <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:flex-end;padding:16px 16px 18px;gap:8px')}>
        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin-bottom:8px')}>{chatStamp(letter.createdAt, today)}</span>

        <h1
          className="tyl-keep"
          style={st('margin:0;align-self:flex-start;max-width:310px;background:#E9E9EB;border-radius:26px 26px 26px 8px;padding:16px 20px;font-size:31px;font-weight:800;line-height:1.3;letter-spacing:-1.2px')}
        >
          할 말이 있는데
          <br />
          {teaserDate(letter.unlockAt, today)}에 할게
        </h1>

        <Typing label="입력 중 표시" animated={false} style="margin:4px 0 6px 6px" />

        <div style={st('align-self:flex-start;border:1.5px dashed #0B6BF2;color:#0B6BF2;border-radius:20px;padding:10px 15px;font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px')}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B6BF2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>편지 1통, {whenText(letter.unlockAt, today)}에 도착</span>
        </div>
        <span style={st('font-size:12px;color:#6D6D72;padding-left:6px')}>그 전에는 누구도 열 수 없어요.</span>
      </div>

      <div style={st('padding:12px 16px 20px;display:flex;flex-direction:column;gap:12px;border-top:1px solid #EFEFEF')}>
        <div style={st('padding:0 6px')}>
          <LockError {...p} />
        </div>
        {p.status !== 'error' && (
          <div style={st('display:flex;justify-content:space-between;align-items:baseline;padding:0 6px')}>
            <span style={st('font-size:14px;color:#6D6D72')}>도착까지</span>
            <span style={st('font-size:22px;font-weight:800;letter-spacing:-0.5px;font-variant-numeric:tabular-nums')}>{remaining(p)}</span>
          </div>
        )}
        <div style={st('display:flex;gap:8px;align-items:center')}>
          <button type="button" style={st(PRIMARY)} onClick={p.onWrite} disabled={p.preview}>
            나도 예약 문자 쓰기
          </button>
          <button type="button" aria-label="캘린더에 저장" style={st(ICON)} onClick={p.onSaveCalendar} disabled={p.preview}>
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
  const play = useBubblePlayback(text, autoplay, reducedMotion)
  return (
    <div className="tyl-screen msg-screen" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Header name={letter.from} />

      <div ref={play.scroller} style={st('flex-grow:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:16px;gap:4px')}>
        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin-top:auto;margin-bottom:8px')}>{dateClock(letter.createdAt)}</span>
        <div
          className="tyl-keep"
          style={st('align-self:flex-start;max-width:290px;background:#E9E9EB;border-radius:22px 22px 22px 7px;padding:12px 16px;font-size:23px;font-weight:800;line-height:1.3;letter-spacing:-0.8px')}
        >
          할 말이 있는데
          <br />
          {teaserDate(letter.unlockAt, letter.createdAt)}에 할게
        </div>

        <span style={st('align-self:center;font-size:12px;color:#6D6D72;margin:18px 0 8px')}>{dateClock(letter.unlockAt)}</span>

        {play.bubbles.slice(0, play.shown).map((b, i) => (
          <div
            key={`${play.run}-${i}`}
            className="tyl-text"
            style={st(`align-self:flex-start;max-width:290px;background:#E9E9EB;border-radius:20px;padding:9px 14px;font-size:16px;line-height:1.4${play.run > 0 ? ';animation:lPop 0.24s ease-out both' : ''}`)}
          >
            {b}
          </div>
        ))}

        {play.typing && <Typing label="입력 중" animated style="margin:2px 0 6px 6px;animation:lPop 0.2s ease-out both" />}
      </div>

      <div style={st('padding:12px 16px 20px;min-height:50px;display:flex;flex-direction:column;justify-content:flex-end;border-top:1px solid #EFEFEF')}>
        {play.done ? (
          <div style={st('display:flex;gap:8px;align-items:center')}>
            <button type="button" style={st(PRIMARY)} onClick={onReply} disabled={preview}>
              답장도 예약해서 보내기
            </button>
            <button type="button" aria-label="다시 보기" style={st(ICON)} onClick={play.replay}>
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
            한 번에 보기
          </button>
        )}
      </div>
    </div>
  )
}

export const msg: Theme = {
  id: 'msg',
  code: 2,
  name: '문자',
  tints: null,
  fonts: ['Noto+Sans+KR:wght@400;500;700;800'],
  tile: { bg: '#F6F6F6', markBg: '#0B6BF2', markW: '44px', markH: '16px', markRadius: '8px' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: SANS, bubbleBg: '#E9E9EB', bubbleFg: '#000000', radius: '22px 22px 22px 7px', pad: '12px 16px', size: '20px' },
  Locked,
  Open,
}
