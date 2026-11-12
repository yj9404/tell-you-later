import { dotDate, hm, hourMin, iGa, monthDot } from '../../lib/date.ts'
import { fitSize, LockError, remaining, st, usePhases } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 색 한 장 테마 (디자인: D-color, D-open)
const FONT = "'Noto Sans KR',sans-serif"
const DISPLAY = "'Bricolage Grotesque',sans-serif"
const DEFAULT_TINT = '#0A7A43'
const SCREEN = `box-sizing:border-box;color:#FFFFFF;font-family:${FONT};padding:32px 28px 28px;display:flex;flex-direction:column`
const YEAR = `font-family:${DISPLAY};font-weight:800;font-size:44px;line-height:1;letter-spacing:-1px`
const BIG = `font-family:${DISPLAY};font-weight:800;line-height:0.82;letter-spacing:-0.046em;margin-left:-8px;white-space:nowrap`
const HEADLINE = 'font-size:30px;font-weight:900;letter-spacing:-1px;line-height:1.3'
const NOTE = 'font-size:15px;line-height:1.65;max-width:300px'
const PRIMARY = 'height:58px;border:0;border-radius:29px;background:#FFFFFF;font-family:inherit;font-size:17px;font-weight:700;cursor:pointer'
const LINK = `height:48px;border:0;background:transparent;color:#FFFFFF;font-family:${FONT};font-size:15px;font-weight:500;text-decoration:underline;text-underline-offset:4px;cursor:pointer`
const NOTE_TEXT = '그 전에는 쓴 사람도, 이 사이트도 열 수 없습니다.'

const Caption = ({ letter }: { letter: LetterInfo }) => (
  <p className="tyl-keep" style={st('margin:0;font-size:16px;font-weight:500;line-height:1.5')}>
    {iGa(letter.from)} {letter.to}에게 쓴 편지
  </p>
)

function Locked(p: LockedProps) {
  const { letter } = p
  const tint = letter.tint ?? DEFAULT_TINT
  const date = monthDot(letter.unlockAt)
  return (
    <div className="tyl-screen tyl-focus-light" style={{ ...st(`min-height:var(--screen-h, 100dvh);${SCREEN}`), background: tint }}>
      <Caption letter={letter} />

      <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:24px 0')}>
        <span style={st(YEAR)}>{letter.unlockAt.getFullYear()}</span>
        <span style={{ ...st(BIG), fontSize: fitSize(date, 216) }}>{date}</span>
        <h1 style={st(`margin:18px 0 0;${HEADLINE}`)}>{hourMin(letter.unlockAt)}에 열립니다</h1>
        <p style={st(`margin:6px 0 0;${NOTE}`)}>{NOTE_TEXT}</p>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:14px')}>
        <div style={st('border-top:2px solid #FFFFFF;padding-top:14px')}>
          <LockError {...p} />
          {p.status !== 'error' && (
            <div style={st('display:flex;justify-content:space-between;align-items:baseline')}>
              <span style={st('font-size:15px;font-weight:500')}>남은 시간</span>
              <span style={st('font-size:22px;font-weight:900;letter-spacing:-0.5px;font-variant-numeric:tabular-nums')}>{remaining(p)}</span>
            </div>
          )}
        </div>
        <button type="button" style={{ ...st(PRIMARY), color: tint }} onClick={p.onWrite} disabled={p.preview}>
          나도 한 통 쓰기
        </button>
        <button type="button" style={st(LINK)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 넣어 두기
        </button>
      </div>
    </div>
  )
}

// 큰 글자가 흩어지고 편지가 떠오른다 (D-open 스크립트의 값)
const STEPS = [
  ['closed', 0],
  ['open', 1100],
] as const
const EASE = 'cubic-bezier(0.3,0.1,0.2,1)'
// 날짜 글자가 날아가는 방향. 글자 수가 많으면 차례로 돌려 쓴다.
const GLYPH_FLY = [
  ['translate(-280px,140px) rotate(-70deg)', 1],
  ['translate(0,-460px) rotate(180deg)', 1.1],
  ['translate(300px,-90px) rotate(60deg)', 0.9],
] as const

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const tint = letter.tint ?? DEFAULT_TINT
  const date = monthDot(letter.unlockAt)
  const piece = (fly: string, seconds: number) => ({
    transform: done ? fly : 'none',
    opacity: done ? 0 : 1,
    transition: `transform ${seconds}s ${EASE},opacity ${seconds}s`,
  })

  return (
    <div className="tyl-screen tyl-focus-light" style={{ ...st(`height:var(--screen-h, 100dvh);overflow:hidden;${SCREEN}`), background: tint }}>
      <Caption letter={letter} />

      <div style={st('flex-grow:1;min-height:0;position:relative')}>
        <div aria-hidden="true" style={st('position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:6px;pointer-events:none')}>
          <span style={{ ...st(`align-self:flex-start;${YEAR}`), ...piece('translate(-180px,-280px) rotate(-40deg)', 1) }}>{letter.unlockAt.getFullYear()}</span>
          <span style={{ ...st(`${BIG};display:flex`), fontSize: fitSize(date, 216) }}>
            {Array.from(date).map((ch, i) => (
              <span key={i} style={{ display: 'inline-block', ...piece(GLYPH_FLY[i % GLYPH_FLY.length][0], GLYPH_FLY[i % GLYPH_FLY.length][1]) }}>
                {ch}
              </span>
            ))}
          </span>
          <span style={{ ...st(`align-self:flex-start;margin-top:18px;${HEADLINE}`), ...piece('translate(260px,340px) rotate(25deg)', 1) }}>{hourMin(letter.unlockAt)}에 열립니다</span>
          <span style={{ ...st(`align-self:flex-start;margin-top:6px;${NOTE}`), ...piece('translate(-280px,380px) rotate(-18deg)', 1.1) }}>{NOTE_TEXT}</span>
        </div>

        <div
          aria-hidden={!done}
          style={{
            ...st('position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;overflow-y:auto;transition:opacity 0.8s ease 0.55s,transform 0.8s ease 0.55s'),
            opacity: done ? 1 : 0,
            transform: done ? 'none' : 'scale(0.94)',
            pointerEvents: done ? 'auto' : 'none',
          }}
        >
          {/* margin:auto — 짧은 편지는 가운데에, 긴 편지는 위에서부터 스크롤 */}
          <p className="tyl-text" style={st('margin:auto 0;padding:20px 0;font-size:20px;font-weight:500;line-height:1.85')}>
            {text}
          </p>
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:14px')}>
        <div style={st('display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid #FFFFFF;padding-top:14px')}>
          <span style={st('font-size:15px;font-weight:500')}>열린 시각</span>
          <span style={st('font-size:22px;font-weight:900;letter-spacing:-0.5px')}>
            {dotDate(letter.unlockAt)} {hm(letter.unlockAt)}
          </span>
        </div>
        <button type="button" style={{ ...st(PRIMARY), color: tint }} onClick={onReply} disabled={preview}>
          답장도 잠가서 보내기
        </button>
        <button type="button" style={st(LINK)} onClick={done ? replay : skip}>
          {done ? '다시 보기' : '한 번에 보기'}
        </button>
      </div>
    </div>
  )
}

const TINTS = [
  { hex: '#0A7A43', name: '초록' },
  { hex: '#C2362B', name: '빨강' },
  { hex: '#1D45C8', name: '파랑' },
  { hex: '#1B1B1B', name: '검정' },
]

export const color: Theme = {
  id: 'color',
  code: 7,
  name: '색 한 장',
  tints: TINTS,
  fonts: ['Bricolage+Grotesque:opsz,wght@12..96,800', 'Noto+Sans+KR:wght@400;500;700;900'],
  tile: { markBg: '#FFFFFF', markW: '34px', markH: '6px', markRadius: '3px' },
  preview: { fg: '#FFFFFF', font: FONT, bubbleBg: 'transparent', bubbleFg: '#FFFFFF', radius: '0', pad: '0', size: '24px' },
  Locked,
  Open,
}
