import { dotDate, dotDateTime } from '../../lib/date.ts'
import { LockError, remaining, st, usePhases } from '../shared.tsx'
import { useStrings } from '../../i18n/index.ts'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 결재 공문 테마 (디자인: N-approval, N-open). 실제 기관명·마크는 쓰지 않는다.
const FONT = "'Noto Serif KR',serif"
const SCREEN = `box-sizing:border-box;background:#DADDE1;color:#000000;font-family:${FONT};padding:22px 18px 22px;display:flex;flex-direction:column;gap:16px`
const PAPER = 'flex-grow:1;background:#FFFFFF;box-shadow:0 2px 0 #B9BEC5;padding:24px 20px 20px;display:flex;flex-direction:column;gap:16px;position:relative'
const MARK = 'position:absolute;left:16px;top:18px;border:2.5px solid #D2232A;color:#D2232A;font-size:15px;font-weight:900;padding:2px 8px;letter-spacing:4px;transform:rotate(-6deg)'
const TITLE = 'margin:0;text-align:center;font-size:23px;font-weight:900;letter-spacing:5px'
const FIELDS = 'display:grid;grid-template-columns:72px 1fr;border-top:2px solid #000000;border-bottom:1px solid #000000;font-size:14px;line-height:1.9;padding:6px 0'
const SIGN = 'text-align:center;font-size:22px;font-weight:900;letter-spacing:10px'
const OUTLINE = `height:54px;border:1.5px solid #000000;border-radius:2px;background:#FFFFFF;color:#000000;font-family:${FONT};font-size:16px;font-weight:600;cursor:pointer`
const SOLID = `height:54px;border:0;border-radius:2px;background:#000000;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:600;cursor:pointer`
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px'
const HEAD_CELL = 'border-bottom:1px solid #000000;padding:3px 0'
const CELL = 'height:54px;display:flex;align-items:center;justify-content:center'
const LABEL = 'font-weight:600'

/** 도장에 들어가는 이름. 원 안에 들어가도록 앞 세 글자까지만 쓴다. */
function sealName(name: string): { text: string; size: number } {
  const chars = Array.from(name.replace(/\s/g, '')).slice(0, 3)
  return { text: chars.join(''), size: chars.length > 2 ? 11 : 14 }
}

/** 서명: "영 진". 긴 이름은 띄우지 않는다. */
const spaced = (name: string) => (Array.from(name).length > 4 ? name : Array.from(name.replace(/\s/g, '')).join(' '))
const signStyle = (name: string) => (Array.from(name).length > 4 ? `${SIGN};letter-spacing:1px` : SIGN)

/** 결재란. receiver는 수신 칸에 들어갈 내용이다. */
function Table({ letter, receiver }: { letter: LetterInfo; receiver: React.ReactNode }) {
  const seal = sealName(letter.from)
  return (
    <div style={st('display:flex;justify-content:flex-end')}>
      <div style={st('display:grid;grid-template-columns:repeat(3,56px);border:1px solid #000000;font-size:12px;text-align:center')}>
        <div style={st(`border-right:1px solid #000000;${HEAD_CELL}`)}>기안</div>
        <div style={st(`border-right:1px solid #000000;${HEAD_CELL}`)}>검토</div>
        <div style={st(HEAD_CELL)}>수신</div>
        <div style={st(`border-right:1px solid #000000;${CELL}`)}>
          <div
            style={{
              ...st('width:40px;height:40px;border-radius:50%;border:2.5px solid #D2232A;color:#D2232A;font-weight:900;display:flex;align-items:center;justify-content:center;transform:rotate(-10deg);overflow:hidden;white-space:nowrap'),
              fontSize: seal.size,
            }}
          >
            {seal.text}
          </div>
        </div>
        <div style={st(`border-right:1px solid #000000;${CELL};font-size:13px;font-weight:600`)}>전결</div>
        <div style={st(`${CELL};position:relative`)}>{receiver}</div>
      </div>
    </div>
  )
}

const pad2 = (n: number) => String(n).padStart(2, '0')

function Locked(p: LockedProps) {
  // 이 테마는 한국어판 전용이다(영어 경로로 열려도 View가 한국어로 보여준다).
  const g = useStrings()
  const { letter } = p
  const { createdAt: c, unlockAt: u } = letter
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st(PAPER)}>
        <div aria-hidden="true" style={st(MARK)}>
          대외비
        </div>

        <Table
          letter={letter}
          receiver={
            <span style={st('font-size:11px;color:#555555;line-height:1.3')}>
              {u.getMonth() + 1}. {u.getDate()}.
              <br />
              예정
            </span>
          }
        />

        <h1 style={st(TITLE)}>편지 개봉 예정 통지</h1>

        <div className="tyl-keep" style={st(FIELDS)}>
          <span style={st(LABEL)}>문서번호</span>
          <span>
            편지 {c.getFullYear()}-{pad2(c.getMonth() + 1)}
            {pad2(c.getDate())}호
          </span>
          <span style={st(LABEL)}>시행일자</span>
          <span>{dotDate(c)}</span>
          <span style={st(LABEL)}>수 신</span>
          <span>{letter.to} 귀하</span>
          <span style={st(LABEL)}>발 신</span>
          <span>{letter.from}</span>
          <span style={st(LABEL)}>제 목</span>
          <span style={st('font-weight:900')}>편지 개봉 예정의 건</span>
        </div>

        <div style={st('font-size:15px;line-height:1.9;display:flex;flex-direction:column;gap:6px')}>
          <p style={st('margin:0')}>1. 귀하의 무궁한 발전을 기원합니다.</p>
          <p style={st('margin:0')}>2. 아래와 같이 편지 개봉이 예정되어 있음을 알려드리오니 업무에 참고하시기 바랍니다.</p>
          <p style={st('margin:4px 0;text-align:center;letter-spacing:6px')}>- 아 래 -</p>
          <p style={st('margin:0;padding-left:14px')}>
            가. 개봉 일시: <span style={st('font-weight:900')}>{dotDateTime(u)}</span>
          </p>
          <p style={st('margin:0;padding-left:14px')}>
            나. 남은 기간: <span style={st('font-weight:900;font-variant-numeric:tabular-nums')}>{p.status === 'error' ? '개봉 지연' : remaining(p, g, '개봉 진행 중')}</span>
          </p>
          <p style={st('margin:0;padding-left:14px')}>다. 내 용: 대외비 (개봉 전 누구도 열람 불가)</p>
          <p style={st('margin:6px 0 0')}>붙임 편지 1부. 끝.</p>
          <LockError {...p} />
        </div>

        <p className="tyl-keep" style={st(`margin:auto 0 0;${signStyle(letter.from)}`)}>
          {spaced(letter.from)}
        </p>
      </div>

      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          일정 등록
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 기안하기
        </button>
      </div>
    </div>
  )
}

// 수신 칸에 도장 → 붙임 문서가 올라온다 (N-open 스크립트의 시각)
const STEPS = [
  ['wait', 0],
  ['stamp', 1100],
  ['open', 1900],
] as const

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  const stamped = phase !== 'wait'
  const seal = sealName(letter.to)
  const u = letter.unlockAt
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st(`${PAPER};min-height:0;overflow:hidden`)}>
        <div aria-hidden="true" style={st(MARK)}>
          {done ? '개봉필' : '대외비'}
        </div>

        <Table
          letter={letter}
          receiver={
            <>
              <span style={{ ...st('font-size:11px;color:#555555;line-height:1.3;transition:opacity 0.2s'), opacity: stamped ? 0 : 1 }}>
                {u.getMonth() + 1}. {u.getDate()}.
                <br />
                예정
              </span>
              <div
                style={{
                  ...st(
                    'position:absolute;width:42px;height:42px;border-radius:50%;border:3px solid #D2232A;color:#D2232A;font-weight:900;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;transition:transform 0.22s cubic-bezier(0.6,0,0.9,0.4),opacity 0.12s',
                  ),
                  fontSize: seal.size,
                  transform: stamped ? 'scale(1) rotate(-12deg)' : 'scale(2.8) rotate(-30deg)',
                  opacity: stamped ? 1 : 0,
                }}
              >
                {seal.text}
              </div>
            </>
          }
        />

        <h1 style={st(TITLE)}>{done ? '편지 개봉 완료 통지' : '편지 개봉 결재 요청'}</h1>

        <div className="tyl-keep" style={st(FIELDS)}>
          <span style={st(LABEL)}>수 신</span>
          <span>{letter.to} 귀하</span>
          <span style={st(LABEL)}>발 신</span>
          <span>{letter.from}</span>
          <span style={st(LABEL)}>제 목</span>
          <span style={st('font-weight:900')}>편지 개봉의 건</span>
        </div>

        <div style={st('flex-grow:1;min-height:0;position:relative')}>
          <div
            aria-hidden={done}
            style={{ ...st('position:absolute;left:0;right:0;top:0;font-size:15px;line-height:1.9;display:flex;flex-direction:column;gap:6px;transition:opacity 0.4s;pointer-events:none'), opacity: done ? 0 : 1 }}
          >
            <p style={st('margin:0')}>1. 귀하의 무궁한 발전을 기원합니다.</p>
            <p style={st('margin:0')}>2. 개봉 일시가 도래하였으므로 수신인의 결재를 받아 붙임 문서를 개봉하고자 합니다.</p>
            <p style={st('margin:6px 0 0')}>붙임 편지 1부. 끝.</p>
          </div>
          <div
            aria-hidden={!done}
            style={{
              ...st('position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;gap:10px;overflow-y:auto;transition:opacity 0.6s ease,transform 0.6s ease'),
              opacity: done ? 1 : 0,
              transform: done ? 'none' : 'translateY(24px)',
              pointerEvents: done ? 'auto' : 'none',
            }}
          >
            <span style={st('font-size:13px;font-weight:600;border-bottom:1px solid #000000;padding-bottom:4px;align-self:flex-start;white-space:pre')}>붙임  편지 1부</span>
            <p className="tyl-text" style={st('margin:0;font-size:16px;line-height:1.9')}>
              {text} 끝.
            </p>
            <p className="tyl-keep" style={st(`margin:auto 0 0;padding-top:10px;${signStyle(letter.from)}`)}>
              {spaced(letter.from)}
            </p>
          </div>
        </div>
      </div>

      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={done ? replay : skip}>
          {done ? '다시 결재' : '한 번에 보기'}
        </button>
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          회신 기안하기
        </button>
      </div>
    </div>
  )
}

export const approval: Theme = {
  id: 'approval',
  code: 11,
  name: { ko: '결재 공문' },
  tints: null,
  fonts: { ko: ['Noto+Serif+KR:wght@400;600;900'] },
  tile: { bg: '#DADDE1', markBg: '#FFFFFF', markW: '50px', markH: '68px', markRadius: '0' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: FONT, bubbleBg: 'transparent', bubbleFg: '#000000', radius: '0', pad: '0', size: '19px' },
  Locked,
  Open,
}
