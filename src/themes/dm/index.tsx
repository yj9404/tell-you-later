import { useBubblePlayback } from '../shared.tsx'
import { chatStamp, countdown, dateClock, dateHour, teaserDate } from '../../lib/date.ts'
import type { LockedProps, OpenProps, Theme } from '../types.ts'
import s from './dm.module.css'

const SANS = "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"

function Avatar({ size, hidden }: { size: number; hidden?: boolean }) {
  return (
    <div aria-hidden="true" className={s.avatar} style={{ width: size, height: size, visibility: hidden ? 'hidden' : 'visible' }}>
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="14" r="6.5" fill="#FFFFFF" />
        <ellipse cx="18" cy="33" rx="12.5" ry="10" fill="#FFFFFF" />
      </svg>
    </div>
  )
}

function Header({ name, status }: { name: string; status: string }) {
  return (
    <div className={s.header}>
      <Avatar size={36} />
      <div className={s.headerText}>
        <span className={s.name}>{name}</span>
        <span className={s.status}>{status}</span>
      </div>
    </div>
  )
}

function TypingDots({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className={s.dots}>
      <div />
      <div />
      <div />
    </div>
  )
}

function Locked({ letter, now, status, error, onRetry, onSaveCalendar, onWrite, preview }: LockedProps) {
  const today = new Date(now)
  const date = teaserDate(letter.unlockAt, today)
  return (
    <div className={`tyl-screen ${s.screen}`}>
      <Header name={letter.from} status={`${date}까지 입력 중`} />

      <div className={s.lockedBody}>
        <h1 className={s.teaser}>
          할 말이 있는데
          <br />
          {date}에 할게
        </h1>

        <div className={s.lockedChat}>
          <span className={s.stamp} style={{ marginBottom: 12 }}>
            {chatStamp(letter.createdAt, today)}
          </span>
          <div className={`${s.bubble} ${s.first} ${s.indent}`}>{letter.to}에게</div>
          <div className={`${s.bubble} ${s.middle} ${s.indent}`}>편지 하나 써놨어</div>
          <div className={s.row}>
            <Avatar size={28} />
            <TypingDots label="입력 중 표시" />
          </div>
          <span className={s.arrival}>
            {dateHour(letter.unlockAt)}에 도착해요.
            <br />그 전엔 보낸 사람도 못 봐요.
          </span>
        </div>
      </div>

      <div className={s.footer}>
        {status === 'error' ? (
          <div className={s.errorBox} role="alert">
            <span className={s.errorText}>{error}</span>
            <button type="button" className={s.plainButton} onClick={onRetry}>
              다시 시도
            </button>
          </div>
        ) : (
          <div className={s.countdown}>
            <span className={s.countdownLabel}>도착까지</span>
            <span className={s.countdownValue}>{status === 'opening' ? '받는 중…' : countdown(letter.unlockAt.getTime() - now)}</span>
          </div>
        )}
        <div className={s.actions}>
          <button type="button" className={s.gradientButton} onClick={onWrite} disabled={preview}>
            나도 예약 DM 쓰기
          </button>
          <button type="button" aria-label="캘린더에 저장" className={s.iconButton} onClick={onSaveCalendar} disabled={preview}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { bubbles, shown, typing, run, done, showAll, replay, scroller: chat } = useBubblePlayback(text, autoplay, reducedMotion)

  return (
    <div className={`tyl-screen ${s.screen}`}>
      <Header name={letter.from} status={done ? '방금 도착' : '입력 중'} />

      <div className={s.chat} ref={chat}>
        <span className={`${s.stamp} ${s.pushDown}`} style={{ marginBottom: 10 }}>
          {dateClock(letter.createdAt)}
        </span>
        <div className={`${s.bubble} ${s.first} ${s.indent}`}>{letter.to}에게</div>
        <div className={`${s.bubble} ${s.last} ${s.indent}`}>편지 하나 써놨어</div>

        <span className={s.stamp} style={{ margin: '18px 0 10px' }}>
          {dateClock(letter.unlockAt)}
        </span>

        {bubbles.slice(0, shown).map((b, i) => {
          const isLast = i === shown - 1 && !typing
          return (
            <div key={`${run}-${i}`} className={`${s.row} ${run > 0 ? s.pop : ''}`}>
              <Avatar size={28} hidden={!isLast} />
              <div className={`${s.bubble} ${s.letter} ${isLast ? s.last : s.middle}`}>{b}</div>
            </div>
          )
        })}

        {typing && (
          <div className={`${s.row} ${s.popFast}`}>
            <Avatar size={28} />
            <TypingDots label="입력 중" />
          </div>
        )}
      </div>

      <div className={s.openFooter}>
        {done ? (
          <div className={s.actions}>
            <button type="button" className={s.gradientButton} onClick={onReply} disabled={preview}>
              답장도 예약해서 보내기
            </button>
            <button type="button" aria-label="다시 보기" className={s.iconButton} onClick={replay}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" className={s.plainButton} onClick={showAll}>
            한 번에 보기
          </button>
        )}
      </div>
    </div>
  )
}

export const dm: Theme = {
  id: 'dm',
  code: 1,
  name: 'DM',
  tints: null,
  fonts: ['Noto+Sans+KR:wght@400;500;700;900'],
  tile: { bg: '#FFFFFF', markBg: 'linear-gradient(90deg,#E8601C,#DD2A7B,#8134AF)', markW: '44px', markH: '16px', markRadius: '8px' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: SANS, bubbleBg: '#EFEFEF', bubbleFg: '#000000', radius: '20px 20px 20px 5px', pad: '10px 14px', size: '18px' },
  Locked,
  Open,
}
