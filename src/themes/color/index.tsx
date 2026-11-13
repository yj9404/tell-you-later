import { useId, useMemo, type CSSProperties } from 'react'
import { paragraphs } from '../../lib/bubbles.ts'
import { useStrings } from '../../i18n/index.ts'
import { LockError, remaining, st, TeaserLines, usePhases, useThemeStrings } from '../shared.tsx'
import { strings } from './strings.ts'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 책 한 권 테마 (디자인: D-color, D-open). 링크에 저장된 id가 "color"라서 id는 바꾸지 않는다.
const SANS = "'Noto Sans KR',sans-serif"
const SERIF = "'Noto Serif KR',serif"
const DEFAULT_TINT = '#1F4D3A'
const SCREEN = `box-sizing:border-box;background:#E4E5E7;color:#1A1A1A;font-family:${SANS};padding:30px 24px 24px;display:flex;flex-direction:column;gap:24px;overflow:hidden`
const OUTLINE = 'height:54px;border:1px solid #B9BBBF;border-radius:27px;background:transparent;color:#1A1A1A;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer'
const SOLID = 'height:54px;border:0;border-radius:27px;background:#1A1A1A;color:#FFFFFF;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer'
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px'
const FOOT = 'display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px solid #C9CBCF;padding-top:14px'
const FILL = 'position:absolute;top:0;right:0;bottom:0;left:0'
const BOOK = 'position:relative;width:280px;height:384px;flex-shrink:0'
const COVER_BOX = 'position:absolute;left:0;top:0;width:270px;height:384px'
const BOOK_SHADOW = '0 2px 3px rgba(0,0,0,.18),0 24px 40px rgba(0,0,0,.2)'
// 금박 글씨
const GOLD = 'color:rgba(255,248,230,.92);text-shadow:0 1px 0 rgba(0,0,0,.35),0 -1px 0 rgba(255,255,255,.12)'

function Caption({ letter }: { letter: LetterInfo }) {
  const t = useThemeStrings(strings)
  return (
    <p className="tyl-keep" style={st('margin:0;font-size:15px;color:#555555')}>
      {t.caption(letter.from, letter.to)}
    </p>
  )
}

/** 표지 뒤로 보이는 종이 단면 두 겹 */
const Pages = () => (
  <>
    <div aria-hidden="true" style={st('position:absolute;left:10px;top:6px;width:270px;height:374px;border-radius:2px 5px 5px 2px;background:#F6F4EE;box-shadow:inset -1px 0 0 #D9D5CB')} />
    <div aria-hidden="true" style={st('position:absolute;left:5px;top:3px;width:270px;height:379px;border-radius:2px 5px 5px 2px;background:repeating-linear-gradient(90deg,#FBFAF6 0 2px,#E9E5DB 2px 3px)')} />
  </>
)

/** 천 질감 양장 표지의 앞면 */
function CoverFace({ letter, now }: { letter: LetterInfo; now: Date }) {
  const cloth = `dcloth${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const t = useThemeStrings(strings)
  return (
    <div style={{ ...st(`${FILL};border-radius:2px 6px 6px 2px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden`), background: letter.tint ?? DEFAULT_TINT }}>
      <svg width="100%" height="100%" style={st('position:absolute;top:0;left:0;opacity:.25;mix-blend-mode:overlay')}>
        <filter id={cloth}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${cloth})`} />
      </svg>
      {/* 책등 그림자와 빛 */}
      <div style={st('position:absolute;left:0;top:0;bottom:0;width:22px;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(255,255,255,.08) 60%,rgba(0,0,0,.18))')} />
      <div style={st(`${FILL};background:linear-gradient(120deg,rgba(255,255,255,.12),rgba(255,255,255,0) 45%,rgba(0,0,0,.15))`)} />
      <div style={st(`position:absolute;left:44px;right:24px;top:46px;display:flex;flex-direction:column;gap:14px;font-family:${SERIF};${GOLD}`)}>
        <span className="tyl-keep" style={{ ...st('font-weight:700;line-height:1.4;letter-spacing:-0.5px;text-wrap:balance'), fontSize: t.coverSize }}>
          <TeaserLines unlock={letter.unlockAt} now={now} />
        </span>
        <span style={st('width:28px;height:1px;background:rgba(255,248,230,.7)')} />
        <span className="tyl-keep" style={st('font-size:13px')}>
          {t.by(letter.from)}
        </span>
      </div>
      {/* 디자인은 bottom:28px이라 띠지에 가려진다. 띠지 아래 남는 자리(30px)에 둔다. */}
      <span style={st(`position:absolute;left:44px;right:24px;bottom:9px;font-size:12px;line-height:1;font-family:${SERIF};${GOLD};opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>
        {t.toName(letter.to)}
      </span>
    </div>
  )
}

/** 띠지 */
function Band({ letter, now, style }: { letter: LetterInfo; now: Date; style?: CSSProperties }) {
  const t = useThemeStrings(strings)
  return (
    <div
      style={{
        ...st('position:absolute;left:0;right:0;bottom:30px;min-height:88px;background:#F4F2EC;box-shadow:0 1px 3px rgba(0,0,0,.25);padding:14px 18px 14px 40px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:4px;color:#1A1A1A'),
        ...style,
      }}
    >
      <span className="tyl-keep" style={st('font-size:15px;font-weight:700;letter-spacing:-0.3px')}>
        {t.openable(letter.unlockAt, now)}
      </span>
      <span style={st('font-size:12px;color:#5A5A5A')}>{t.nobody}</span>
    </div>
  )
}

function Locked(p: LockedProps) {
  const { letter } = p
  const now = new Date(p.now)
  const g = useStrings()
  const t = useThemeStrings(strings)
  const label = [g.teaser(letter.unlockAt, now), t.by(letter.from), t.toName(letter.to), t.openable(letter.unlockAt, now), t.nobody].map((x) => x.replace(/\.$/, '')).join('. ') + '.'
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Caption letter={letter} />
      <div style={st('flex-grow:1;display:flex;align-items:center;justify-content:center')}>
        <div role="img" aria-label={label} style={st(BOOK)}>
          <Pages />
          <div style={{ ...st(`${COVER_BOX};border-radius:2px 6px 6px 2px`), boxShadow: BOOK_SHADOW }}>
            <CoverFace letter={letter} now={now} />
            <Band letter={letter} now={now} />
          </div>
        </div>
      </div>
      <div style={st(FOOT)}>
        {p.status === 'error' ? (
          <LockError {...p} />
        ) : (
          <>
            <span style={st('font-size:14px;color:#555555')}>{t.untilOpen}</span>
            <span style={st('font-size:20px;font-weight:700;letter-spacing:-0.4px;font-variant-numeric:tabular-nums')}>{remaining(p, g, t.opening)}</span>
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

// 띠지가 빠지고 → 표지가 왼쪽 모서리를 축으로 넘어가고 → 본문이 나타난 뒤 책이 커진다 (D-open 스크립트의 값).
// open 단계의 전환 지연(.35s, .9s, 1.45s, 1.7s)도 디자인 그대로다. 마지막 확대가 끝나는 3.6초에 done이 된다.
const STEPS = [
  ['closed', 0],
  ['band', 700],
  ['open', 1200],
  ['done', 3600],
] as const
const ZOOM = 'scale(1.2) translateX(-5px)'

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const g = useStrings()
  const t = useThemeStrings(strings)
  const paras = useMemo(() => paragraphs(text), [text])
  const tint = letter.tint ?? DEFAULT_TINT
  const created = letter.createdAt
  const bandOut = phase !== 'closed'
  const open = phase === 'open' || phase === 'done'

  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Caption letter={letter} />
      {/* 1.2배로 커진 책이 위아래 글자를 덮지 않도록 자리를 넉넉히 둔다. */}
      <div style={st('flex-grow:1;min-height:470px;display:flex;align-items:center;justify-content:center')}>
        <div
          style={{
            ...st(`${BOOK};perspective:1600px`),
            transform: open ? ZOOM : 'none',
            transition: phase === 'done' ? undefined : `transform .7s cubic-bezier(.3,0,.2,1) ${open ? '1.7s' : '0s'}`,
          }}
        >
          <Pages />
          {/* 첫 페이지 */}
          <div style={{ ...st(`${COVER_BOX};border-radius:2px 6px 6px 2px;background:#FCFBF7;box-sizing:border-box;padding:26px 24px 20px 30px;display:flex;flex-direction:column;overflow:hidden`), boxShadow: BOOK_SHADOW }}>
            <div aria-hidden="true" style={st('position:absolute;left:0;top:0;bottom:0;width:18px;background:linear-gradient(90deg,rgba(0,0,0,.12),rgba(0,0,0,0))')} />
            <span style={st('flex-shrink:0;font-size:10px;color:#8A8A8A;letter-spacing:0.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{g.teaser(letter.unlockAt, created)}</span>
            <div
              tabIndex={0}
              style={{
                ...st(`flex-grow:1;min-height:0;overflow-y:auto;margin-top:18px;font-family:${SERIF};font-size:14px;line-height:1.95;color:#222222;outline:none`),
                opacity: open ? 1 : 0,
                transition: phase === 'done' ? undefined : 'opacity .8s ease .9s',
              }}
            >
              {paras.map((para, i) => (
                <p key={i} className="tyl-text" style={st('margin:0 0 10px;text-indent:1em')}>
                  {para}
                </p>
              ))}
              <p className="tyl-keep" style={st('margin:14px 0 0;text-align:right')}>
                {letter.from}
              </p>
            </div>
            <span aria-hidden="true" style={st('flex-shrink:0;align-self:center;margin-top:8px;font-size:10px;color:#8A8A8A')}>
              1
            </span>
          </div>
          {/* 표지. 다 넘어가면 지운다. */}
          {!done && (
            <div
              aria-hidden="true"
              style={{
                ...st(`${COVER_BOX};transform-origin:left center;transform-style:preserve-3d`),
                boxShadow: BOOK_SHADOW,
                transform: open ? 'rotateY(-150deg)' : 'none',
                opacity: open ? 0 : 1,
                transition: `transform 1.5s cubic-bezier(.55,.05,.3,1) .35s,opacity .4s ease ${open ? '1.45s' : '0s'}`,
              }}
            >
              <CoverFace letter={letter} now={created} />
              <div style={{ ...st(`${FILL};border-radius:6px 2px 2px 6px;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden`), background: tint }}>
                <div style={st('position:absolute;top:8px;right:8px;bottom:8px;left:8px;background:#EDE9DF')} />
              </div>
              <Band
                letter={letter}
                now={created}
                style={{
                  transform: bandOut ? 'translateY(140px)' : 'none',
                  opacity: bandOut ? 0 : 1,
                  transition: 'transform .5s cubic-bezier(.5,0,.7,.4),opacity .4s ease .1s',
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div style={st(FOOT)}>
        <span style={st('font-size:14px;color:#555555')}>{t.openedOn}</span>
        <span style={st('font-size:18px;font-weight:700')}>
          {t.openedValue(letter.unlockAt)}
        </span>
      </div>
      <div style={st(BUTTONS)}>
        {done ? (
          <button type="button" style={st(OUTLINE)} onClick={replay}>
            {t.reopen}
          </button>
        ) : (
          <button type="button" style={st(OUTLINE)} onClick={skip}>
            {g.locked.showAll}
          </button>
        )}
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          {t.reply}
        </button>
      </div>
    </div>
  )
}

// 링크에는 인덱스가 들어간다. 예전 색(초록·빨강·파랑·검정)과 같은 순서로 대응한다.
const TINTS = [
  { hex: '#1F4D3A', name: { ko: '초록', en: 'Green' } },
  { hex: '#8C2A23', name: { ko: '빨강', en: 'Red' } },
  { hex: '#1F3A73', name: { ko: '파랑', en: 'Blue' } },
  { hex: '#2B2B2B', name: { ko: '검정', en: 'Black' } },
]

export const color: Theme = {
  id: 'color',
  code: 7,
  name: { ko: '책 한 권', en: 'Book' },
  tints: TINTS,
  fonts: { ko: ['Noto+Serif+KR:wght@400;600;700', 'Noto+Sans+KR:wght@400;500;700'] },
  tile: { bg: '#E4E5E7', markW: '28px', markH: '40px', markRadius: '2px 4px 4px 2px' },
  preview: { bg: '#E4E5E7', fg: '#1A1A1A', font: SERIF, bubbleBg: '#FCFBF7', bubbleFg: '#222222', radius: '2px 6px 6px 2px', pad: '14px 16px', size: '16px' },
  Locked,
  Open,
}
