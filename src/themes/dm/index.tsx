import { chatIntro, TeaserLines, useBubblePlayback, useThemeStrings } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import { strings } from './strings.ts'
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
  const g = useStrings()
  const t = useThemeStrings(strings)
  const today = new Date(now)
  const date = g.date.teaserDate(letter.unlockAt, today)
  const intro = chatIntro(letter, g, t.introMiddle, t.introLast)
  const arrival = t.arrival(letter.unlockAt)
  return (
    <div className={`tyl-screen ${s.screen}`}>
      <Header name={letter.from} status={t.typingUntil(date)} />

      <div className={s.lockedBody}>
        <h1 className={s.teaser}>
          <TeaserLines unlock={letter.unlockAt} now={today} />
        </h1>

        <div className={s.lockedChat}>
          <span className={s.stamp} style={{ marginBottom: 12 }}>
            {g.date.chatStamp(letter.createdAt, today)}
          </span>
          {/* 말풍선 뒤에 입력 중 점이 이어지므로 마지막 말풍선도 가운데 모양이다. */}
          {intro.map((line, i) => (
            <div key={i} className={`${s.bubble} ${i === 0 ? s.first : s.middle} ${s.indent}`}>
              {line}
            </div>
          ))}
          <div className={s.row}>
            <Avatar size={28} />
            <TypingDots label={t.typingShown} />
          </div>
          <span className={s.arrival}>
            {arrival[0]}
            <br />
            {arrival[1]}
          </span>
        </div>
      </div>

      <div className={s.footer}>
        {status === 'error' ? (
          <div className={s.errorBox} role="alert">
            <span className={s.errorText}>{error}</span>
            <button type="button" className={s.plainButton} onClick={onRetry}>
              {g.locked.retry}
            </button>
          </div>
        ) : (
          <div className={s.countdown}>
            <span className={s.countdownLabel}>{t.countdownLabel}</span>
            <span className={s.countdownValue}>{status === 'opening' ? t.receiving : g.date.countdown(letter.unlockAt.getTime() - now)}</span>
          </div>
        )}
        <div className={s.actions}>
          <button type="button" className={s.gradientButton} onClick={onWrite} disabled={preview}>
            {t.writeOwn}
          </button>
          <button type="button" aria-label={g.calendar.save} className={s.iconButton} onClick={onSaveCalendar} disabled={preview}>
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
  const g = useStrings()
  const t = useThemeStrings(strings)
  const intro = chatIntro(letter, g, t.introMiddle, t.introLast)

  return (
    <div className={`tyl-screen ${s.screen}`}>
      <Header name={letter.from} status={done ? t.justArrived : t.typing} />

      <div className={s.chat} ref={chat}>
        <span className={`${s.stamp} ${s.pushDown}`} style={{ marginBottom: 10 }}>
          {g.date.dateClock(letter.createdAt)}
        </span>
        {intro.map((line, i) => (
          <div key={i} className={`${s.bubble} ${i === 0 ? s.first : i === intro.length - 1 ? s.last : s.middle} ${s.indent}`}>
            {line}
          </div>
        ))}

        <span className={s.stamp} style={{ margin: '18px 0 10px' }}>
          {g.date.dateClock(letter.unlockAt)}
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
            <TypingDots label={t.typing} />
          </div>
        )}
      </div>

      <div className={s.openFooter}>
        {done ? (
          <div className={s.actions}>
            <button type="button" className={s.gradientButton} onClick={onReply} disabled={preview}>
              {t.reply}
            </button>
            <button type="button" aria-label={g.locked.replay} className={s.iconButton} onClick={replay}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" className={s.plainButton} onClick={showAll}>
            {g.locked.showAll}
          </button>
        )}
      </div>
    </div>
  )
}

export const dm: Theme = {
  id: 'dm',
  code: 1,
  name: { ko: 'DM', en: 'DM' },
  tints: null,
  fonts: { ko: ['Noto+Sans+KR:wght@400;500;700;900'] },
  tile: { bg: '#FFFFFF', markBg: 'linear-gradient(90deg,#E8601C,#DD2A7B,#8134AF)', markW: '44px', markH: '16px', markRadius: '8px' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: SANS, bubbleBg: '#EFEFEF', bubbleFg: '#000000', radius: '20px 20px 20px 5px', pad: '10px 14px', size: '18px' },
  Locked,
  Open,
}
