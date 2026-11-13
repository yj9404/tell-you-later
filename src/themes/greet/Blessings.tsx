import { LockError, remaining, st, usePhases, useThemeStrings } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import type { LockedProps, OpenProps } from '../types.ts'
import { strings } from './strings.ts'

// greet 테마의 영어판 "Blessings". 한국어판(단톡방 꽃 인사 카드)에 해당하는, 부모님 세대 SNS의 반짝이 축복 카드 느낌이다.
// 화면 구조는 한국어판과 같다: 받는 사람 → 큰 인사말 → 노란 안내 상자 → 과한 덕담 → 카운트다운 → 버튼.
// 장미·나비·반짝이는 모두 이 파일의 자체 도형이다.

const SCRIPT = "'Pacifico',cursive"
const FONT = "'Nunito','Noto Sans KR',sans-serif"
const FILL = 'background:linear-gradient(180deg,#3A0A5E 0%,#7E22CE 46%,#F062B0 100%)'
const SCREEN = `box-sizing:border-box;${FILL};color:#FFFFFF;font-family:${FONT};padding:24px 20px 24px;display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden`
const DARK_HALO = 'text-shadow:0 2px 0 rgba(58,10,94,.85),0 0 10px rgba(58,10,94,.6)'
const PRIMARY =
  'height:62px;border-radius:31px;background:linear-gradient(90deg,#FF2E93,#B23CFF);border:3px solid #FFE45C;box-shadow:0 4px 0 #5B0E7A;color:#FFFFFF;font-family:inherit;font-size:20px;font-weight:900;cursor:pointer'
const SECOND = `height:56px;border:3px solid #FFFFFF;border-radius:28px;background:rgba(255,255,255,.92);color:#7E22CE;font-family:${FONT};font-size:18px;font-weight:900;cursor:pointer`
const NOTICE = 'background:#FFF35C;border:4px solid #FF2E93;border-radius:6px;padding:10px 10px;text-align:center;color:#2A0640;font-size:18px;font-weight:900;line-height:1.45'
// 반짝이 별(꼭짓점 넷)
const STAR = 'M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z'

function To({ name }: { name: string }) {
  const t = useThemeStrings(strings)
  return (
    <p className="tyl-keep" style={st(`margin:0;text-align:center;font-family:${SCRIPT};font-size:28px;line-height:1.3;color:#FFE45C;${DARK_HALO};position:relative`)}>
      {t.to(name)}
    </p>
  )
}

/** "Sending / Blessings" 무지개 필기체 */
function Greeting({ size }: { size: number }) {
  const t = useThemeStrings(strings)
  return (
    <span className="blessings-rainbow" style={{ ...st(`display:block;text-align:center;font-family:${SCRIPT};font-weight:400;line-height:1.15`), fontSize: size }}>
      {t.greeting.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </span>
  )
}

// 반짝이 자리 [x, y, 크기, 색, 깜빡임 지연(s)]. 글자와 덜 겹치게 가장자리에 많이 둔다.
const GLITTER: readonly (readonly [number, number, number, string, number])[] = [
  [22, 120, 1, '#FFE45C', 0],
  [368, 92, 0.8, '#FFFFFF', 0.4],
  [196, 18, 0.6, '#FFE45C', 0.9],
  [336, 300, 1.1, '#FFFFFF', 0.2],
  [30, 330, 0.7, '#FFB8E6', 1.1],
  [362, 420, 0.6, '#FFE45C', 0.6],
  [18, 560, 0.9, '#FFFFFF', 1.3],
  [374, 560, 1, '#FFE45C', 0.1],
  [110, 70, 0.5, '#FFFFFF', 0.7],
  [286, 52, 0.7, '#FFB8E6', 1.5],
  [60, 700, 0.8, '#FFE45C', 0.5],
  [330, 720, 0.6, '#FFFFFF', 1],
  [200, 820, 0.7, '#FFE45C', 0.3],
  [150, 300, 0.4, '#FFFFFF', 1.7],
  [250, 480, 0.4, '#FFE45C', 0.8],
  [96, 470, 0.5, '#FFB8E6', 1.2],
  [300, 640, 0.5, '#FFE45C', 1.6],
  [12, 230, 0.5, '#FFFFFF', 0.95],
]

/** 배경: 장미(구석), 나비, 반짝이. full은 잠김 화면, light는 글이 길어지는 열림 화면이라 줄인다. */
export function BlessingsBackdrop({ variant }: { variant: 'full' | 'light' }) {
  const full = variant === 'full'
  const id = (name: string) => `bless-${variant}-${name}`
  const use = (name: string) => `#${id(name)}`
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={st('position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))')}
    >
      <defs>
        <radialGradient id={id('petal')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FF5A7A" />
          <stop offset="1" stopColor="#B0002E" />
        </radialGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FE3FF" />
          <stop offset="0.5" stopColor="#B57BFF" />
          <stop offset="1" stopColor="#FF7AD9" />
        </linearGradient>
        <g id={id('rose')}>
          <path d="M-10 18 C-30 22 -42 8 -36 -6 C-26 4 -18 10 -10 18 Z" fill="#2E9D4A" />
          <path d="M12 16 C30 24 44 12 40 -2 C30 8 22 12 12 16 Z" fill="#2E9D4A" />
          <circle r="22" fill={`url(${use('petal')})`} />
          <path d="M-15 -2 C-14 -17 9 -21 15 -7 C19 5 6 16 -5 13 C-13 10 -12 -1 -4 -3 C3 -5 6 3 1 6" fill="none" stroke="#7A001F" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M-21 6 C-22 17 -9 24 5 21 C14 19 20 12 21 4" fill="none" stroke="#7A001F" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g id={id('butterfly')}>
          <path d="M0 0 C-5 -20 -30 -27 -31 -9 C-31 3 -15 6 0 0 Z" fill={`url(${use('wing')})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M0 0 C5 -20 30 -27 31 -9 C31 3 15 6 0 0 Z" fill={`url(${use('wing')})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M0 2 C-4 14 -22 22 -23 10 C-23 3 -11 0 0 2 Z" fill={`url(${use('wing')})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M0 2 C4 14 22 22 23 10 C23 3 11 0 0 2 Z" fill={`url(${use('wing')})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="-1.6" y="-11" width="3.2" height="24" rx="1.6" fill="#2A0640" />
          <path d="M-1 -11 C-4 -18 -7 -20 -10 -21 M1 -11 C4 -18 7 -20 10 -21" fill="none" stroke="#2A0640" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <path id={id('star')} d={STAR} />
      </defs>

      <use href={use('rose')} transform="translate(26 30) scale(1.25)" />
      <use href={use('rose')} transform="translate(72 14) scale(0.8) rotate(-20)" />
      {full && <use href={use('rose')} transform="translate(8 84) scale(0.7) rotate(30)" />}
      <use href={use('rose')} transform="translate(370 250) scale(1.05) rotate(15)" />
      {full && <use href={use('rose')} transform="translate(14 520) scale(1.1) rotate(-10)" />}
      <use href={use('rose')} transform="translate(378 690) scale(0.95) rotate(40)" />

      <use href={use('butterfly')} transform="translate(340 46) rotate(18) scale(0.9)" />
      <use href={use('butterfly')} transform="translate(44 420) rotate(-22) scale(0.75)" />
      {full && <use href={use('butterfly')} transform="translate(352 520) rotate(10) scale(0.6)" />}

      {GLITTER.map(([x, y, s, color, delay], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <use href={use('star')} className="blessings-twinkle" fill={color} style={{ animationDelay: `${delay}s` }} />
        </g>
      ))}
    </svg>
  )
}

export function BlessingsLocked(p: LockedProps) {
  const g = useStrings()
  const t = useThemeStrings(strings)
  const { letter } = p
  const notice = t.notice(letter.from, letter.unlockAt)
  return (
    <div className="tyl-screen greet-screen tyl-focus-light" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <BlessingsBackdrop variant="full" />
      <To name={letter.to} />

      <h1 style={st('margin:0;position:relative')}>
        <Greeting size={66} />
      </h1>

      <div className="tyl-keep" style={st(`position:relative;${NOTICE};margin-top:4px`)}>
        {notice[0]}
        <br />
        {notice[1]}
      </div>

      <p className="tyl-keep" style={st(`margin:0;text-align:center;font-size:16px;font-weight:800;line-height:1.5;position:relative;${DARK_HALO}`)}>
        {t.lines[0]}
        <br />
        <span style={st(`font-family:${SCRIPT};font-weight:400;font-size:24px;color:#FFE45C`)}>{t.lines[1]}</span>
      </p>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative')}>
        {p.status === 'error' ? (
          <div style={st('background:#FFFFFF;color:#2A0640;border:4px solid #FF2E93;padding:12px;font-weight:800')}>
            <LockError {...p} />
          </div>
        ) : (
          <>
            <span style={st(`font-size:18px;font-weight:900;${DARK_HALO}`)}>{t.before}</span>
            <span className="blessings-rainbow" style={st(`font-family:${SCRIPT};font-size:60px;line-height:1.25;white-space:nowrap`)}>
              {remaining(p, g)}
            </span>
            <span style={st(`font-size:18px;font-weight:900;${DARK_HALO}`)}>{t.after}</span>
          </>
        )}
      </div>

      <div style={st('display:flex;flex-direction:column;gap:10px;position:relative')}>
        <button type="button" style={st(PRIMARY)} onClick={p.onWrite} disabled={p.preview}>
          {t.writeOwn}
        </button>
        <button type="button" style={st(SECOND)} onClick={p.onSaveCalendar} disabled={p.preview}>
          {t.save}
        </button>
      </div>
    </div>
  )
}

// 한국어판과 같은 시각: 1.2초 동안 인사말 → 카드가 나타난다. 꽃잎 대신 반짝이가 떨어진다.
const STEPS = [
  ['closed', 0],
  ['open', 1200],
] as const
const SPARKLE_COLORS = ['#FFE45C', '#FFFFFF', '#FFB8E6', '#7FE3FF', '#FFD000']
const SPARKLES = Array.from({ length: 44 }, (_, i) => ({
  left: `${((i * 37) % 122) - 6}%`,
  delay: ((i * 53) % 220) / 100,
  dur: 2 + ((i * 29) % 100) / 100,
  size: 12 + ((i * 17) % 22),
  color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
}))

export function BlessingsOpen({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, run, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const g = useStrings()
  const t = useThemeStrings(strings)
  const open = phase === 'open'
  return (
    <div className="tyl-screen greet-screen tyl-focus-light" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <BlessingsBackdrop variant="light" />
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
          <Greeting size={72} />
          <div className="tyl-keep" style={st(NOTICE)}>
            {t.finally(letter.unlockAt, letter.createdAt)}
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
            <h1 className="blessings-rainbow" style={st(`margin:0;text-align:center;font-family:${SCRIPT};font-weight:400;font-size:42px;line-height:1.3`)}>
              {t.opened}
            </h1>
            <div style={st('background:#FFFFFF;color:#2A0640;border:4px solid #FF2E93;border-radius:10px;box-shadow:0 0 0 4px #FFE45C;padding:16px 16px 12px;display:flex;flex-direction:column;gap:8px')}>
              <p className="tyl-text" style={st('margin:0;font-size:18px;font-weight:700;line-height:1.7')}>
                {text}
              </p>
              <span className="tyl-keep" style={st(`text-align:right;font-family:${SCRIPT};font-size:26px;line-height:1.3;color:#7E22CE`)}>
                {t.signed(letter.from)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:10px;position:relative')}>
        <button type="button" style={st(PRIMARY)} onClick={onReply} disabled={preview}>
          {t.reply}
        </button>
        <button type="button" style={st(SECOND)} onClick={done ? replay : skip}>
          {done ? g.locked.replay : g.locked.showAll}
        </button>
      </div>

      {/* 반짝이는 연출을 재생할 때만 떨어진다(한국어판의 꽃잎 자리). */}
      {open &&
        run > 0 &&
        SPARKLES.map((s, i) => (
          <svg
            key={`${run}-${i}`}
            aria-hidden="true"
            width={s.size}
            height={s.size}
            viewBox="-11 -11 22 22"
            style={{ ...st('position:absolute;top:-50px;pointer-events:none'), left: s.left, color: s.color, animation: `mFall ${s.dur}s ease-in ${s.delay}s both` }}
          >
            <path d={STAR} fill="currentColor" />
          </svg>
        ))}
    </div>
  )
}
