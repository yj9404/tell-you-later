import { useMemo, type ReactNode } from 'react'
import { paragraphs } from '../../lib/bubbles.ts'
import { daysBetween, hhmm, weekday } from '../../lib/date.ts'
import { LockError, remaining, st, usePhases } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 군대 보고서 테마 (디자인: O-military, O-open). 실제 부대명·마크는 쓰지 않는다.
const FONT = "'Noto Sans KR',sans-serif"
const SERIF = "'Noto Serif KR',serif"
const SCREEN = `box-sizing:border-box;background:#4E5740;color:#000000;font-family:${FONT};padding:14px 12px 16px;display:flex;flex-direction:column;gap:12px`
const PAPER = 'flex-grow:1;background:#FFFFFF;padding:10px;display:flex;flex-direction:column;gap:8px'
const B = 'border-right:1px solid #000000;border-bottom:1px solid #000000'
const B2 = 'border-right:1.5px solid #000000;border-bottom:1.5px solid #000000'
const CLIP = 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0'
const GRID_SMALL = `border-top:1px solid #000000;border-left:1px solid #000000;font-family:${SERIF};font-size:10px;line-height:1.5;text-align:center`
const GRID = `border-top:1.5px solid #000000;border-left:1.5px solid #000000;margin-top:3px;font-family:${SERIF};font-size:12px;line-height:1.7;text-align:center`
const H2 = 'margin:0;font-size:16px;font-weight:900;color:#1414C8'
const ITEM = 'margin:0;padding-left:10px;font-size:13.5px;font-weight:700;line-height:1.5'
const STAR = 'margin:0;padding-left:24px;font-size:11.5px;font-weight:500;color:#0A7A2F;line-height:1.5'
const NAME_CELL = `${B};height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;overflow:hidden;white-space:nowrap`
const OUTLINE = `height:54px;border:1.5px solid #FFFFFF;border-radius:2px;background:transparent;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`
const SOLID = `height:54px;border:0;border-radius:2px;background:#000000;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px'

const pad2 = (n: number) => String(n).padStart(2, '0')
/** "'26. 11. 11." */
const shortDate = (d: Date) => `'${pad2(d.getFullYear() % 100)}. ${d.getMonth() + 1}. ${d.getDate()}.`
/** "'27. 1. 1.(금) 00:00" */
const shortDateTime = (d: Date) => `${shortDate(d)}(${weekday(d)}) ${hhmm(d)}`

const Th = ({ children, style = '' }: { children: ReactNode; style?: string }) => <span style={st(`${B};background:#E6E6E6;${style}`)}>{children}</span>
const Td = ({ children }: { children: ReactNode }) => <span style={st(`${B};${CLIP}`)}>{children}</span>

/** 문서 머리: 등록 정보 표, 결재란, 제목 */
function Header({ letter, rows, approval, title }: { letter: LetterInfo; rows: [string, ReactNode][]; approval: ReactNode; title: string }) {
  const spread = 'letter-spacing:6px;padding-left:6px'
  return (
    <>
      <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:8px')}>
        <div style={st(`display:grid;grid-template-columns:48px 78px;${GRID_SMALL}`)}>
          {rows.map(([label, value]) => (
            <span key={label} style={{ display: 'contents' }}>
              <Th>{label}</Th>
              <Td>{value}</Td>
            </span>
          ))}
        </div>
        <div style={st(`display:grid;grid-template-columns:repeat(3,52px);${GRID_SMALL}`)}>
          <Th style={spread}>기안</Th>
          <Th style={spread}>결재</Th>
          <Th style={spread}>결재</Th>
          <Td>발신자</Td>
          <Td>수신자</Td>
          <Td>시간</Td>
          <span style={st(NAME_CELL)}>{Array.from(letter.from).slice(0, 3).join('')}</span>
          <span style={st(NAME_CELL)}>{Array.from(letter.to).slice(0, 3).join('')}</span>
          <span style={st(`${B};height:30px;display:flex;align-items:center;justify-content:center;position:relative`)}>{approval}</span>
          <span style={st(`grid-column:span 3;${B};text-align:left;padding-left:4px`)}>검토 : 전결</span>
        </div>
      </div>

      <div style={st('align-self:center;display:flex;flex-direction:column;align-items:stretch;gap:3px;margin:2px 0')}>
        <div style={st('height:3px;background:#1F2FBF')} />
        <h1 style={st('margin:0;padding:0 18px;font-size:22px;font-weight:900;letter-spacing:-0.5px;text-align:center')}>{title}</h1>
        <div style={st('height:3px;background:#1F2FBF')} />
      </div>
    </>
  )
}

const registerNo = (letter: LetterInfo) => `편지-${pad2(letter.createdAt.getMonth() + 1)}${pad2(letter.createdAt.getDate())}`

function Locked(p: LockedProps) {
  const { letter, now } = p
  const u = letter.unlockAt
  const daysLeft = Math.max(0, daysBetween(new Date(now), u))
  // 세부계획 표: 남은 날에 맞는 줄만 넣는다.
  const plan: [string, string][] = []
  if (daysLeft > 0) plan.push([`D-${daysLeft}`, '현 시각부로 대기 개시'])
  if (daysLeft > 30) plan.push(['D-30', '편지 존재 망각'])
  if (daysLeft > 1) plan.push(['D-1', '달력 확인 후 취침 대기'])
  const Head = ({ children }: { children: ReactNode }) => <span style={st(`${B2};background:#D5F2F2;font-weight:600`)}>{children}</span>
  const Cell = ({ children, style = '' }: { children: ReactNode; style?: string }) => <span style={st(`${B2};${CLIP};${style}`)}>{children}</span>

  return (
    <div className="tyl-screen tyl-focus-light" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st(PAPER)}>
        <Header
          letter={letter}
          title="편지 개봉계획 (보고)"
          rows={[
            ['등록번호', registerNo(letter)],
            ['보존기간', '개봉 시까지'],
            ['결재일자', shortDate(letter.createdAt)],
            ['공개구분', '비 공 개'],
            ['사전열람', 'X'],
          ]}
          approval={<span style={st('color:#555555')}>미결</span>}
        />

        <div style={st('flex-grow:1;border:2px solid #000000;padding:8px 9px;display:flex;flex-direction:column;gap:7px')}>
          <div style={st('display:flex;flex-direction:column;gap:1px')}>
            <h2 style={st(H2)}>□ 개요 및 목적</h2>
            <p style={st(ITEM)}>○ 편지 1통을 지정 일시에 개봉</p>
            <p style={st(ITEM)}>○ 개봉 전 열람 시도 원천 봉쇄</p>
            <p style={st(STAR)}>* 개봉 전 누구도 열람 불가</p>
          </div>

          <div style={st('display:flex;flex-direction:column;gap:1px')}>
            <h2 style={st(H2)}>□ 일 시</h2>
            <p style={st(ITEM)}>○ 개봉 일시 : {shortDateTime(u)} ~</p>
            <p style={st(ITEM)}>○ 개봉 장소 : 본 링크</p>
            <div style={st(`display:grid;grid-template-columns:54px 1fr 1fr;${GRID}`)}>
              <Head>구 분</Head>
              <Head>발 신</Head>
              <Head>수 신</Head>
              <Head>성 명</Head>
              <Cell>{letter.from}</Cell>
              <Cell>{letter.to}</Cell>
              <Head>임 무</Head>
              <Cell>작성 후 대기</Cell>
              <Cell>대기 후 개봉</Cell>
            </div>
          </div>

          <div style={st('display:flex;flex-direction:column;gap:1px')}>
            <h2 style={st(H2)}>□ 세부계획</h2>
            <div style={st(`display:grid;grid-template-columns:54px 1fr;${GRID}`)}>
              <Head>구 분</Head>
              <Head>내 용</Head>
              {plan.map(([day, what]) => (
                <span key={day} style={{ display: 'contents' }}>
                  <Cell style="background:#F7C873">{day}</Cell>
                  <Cell>{what}</Cell>
                </span>
              ))}
              <Cell style="background:#F7C873">D-Day</Cell>
              <Cell style="font-weight:600">{hhmm(u)}부 개봉</Cell>
            </div>
          </div>

          <div style={st('display:flex;flex-direction:column;gap:1px')}>
            <h2 style={st(H2)}>□ 행정사항</h2>
            <p style={st(`${ITEM};color:#D2161C`)}>○ 개봉 일시 최우선으로 엄수</p>
            <p style={st(`${ITEM};font-variant-numeric:tabular-nums`)}>○ {p.status === 'waiting' ? `잔여 ${remaining(p)}, 대기할 것` : p.status === 'opening' ? '개봉 절차 진행 중' : '개봉 실패, 재시도할 것'}</p>
            <p style={st(ITEM)}>○ 새로고침으로 개봉 시각 단축 불가</p>
            <p style={st(STAR)}>* 붙임 : 편지 1부. 끝.</p>
            <div style={st('padding:4px 0 0 10px')}>
              <LockError {...p} />
            </div>
          </div>
        </div>
      </div>

      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          달력에 기입
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 보고하기
        </button>
      </div>
    </div>
  )
}

// 결재 도장 → 편지가 개조식 항목으로 표시된다 (O-open 스크립트의 시각)
const STEPS = [
  ['wait', 0],
  ['stamp', 1100],
  ['open', 1900],
] as const
const OPEN_ITEM = 'margin:0;padding-left:10px;font-size:14px;font-weight:700;line-height:1.6'

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const { phase, done, skip, replay } = usePhases(STEPS, autoplay, reducedMotion)
  // 편지의 문단 하나가 "○" 항목 하나다.
  const items = useMemo(() => paragraphs(text), [text])
  const stamped = phase !== 'wait'
  const u = letter.unlockAt
  return (
    <div className="tyl-screen tyl-focus-light" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st(`${PAPER};min-height:0`)}>
        <Header
          letter={letter}
          title={done ? '편지 개봉결과 (보고)' : '편지 개봉 (결재)'}
          rows={[
            ['등록번호', registerNo(letter)],
            ['보존기간', '영구'],
            ['결재일자', shortDate(u)],
            ['공개구분', done ? '수신자 공개' : '비 공 개'],
            ['사전열람', '없음'],
          ]}
          approval={
            <>
              <span style={{ ...st('color:#555555;transition:opacity 0.2s'), opacity: stamped ? 0 : 1 }}>미결</span>
              <span
                style={{
                  ...st(
                    `position:absolute;border:2.5px solid #D2161C;color:#D2161C;font-family:${FONT};font-size:13px;font-weight:900;padding:0 5px;letter-spacing:2px;transition:transform 0.22s cubic-bezier(0.6,0,0.9,0.4),opacity 0.12s`,
                  ),
                  transform: stamped ? 'scale(1) rotate(-10deg)' : 'scale(2.8) rotate(-28deg)',
                  opacity: stamped ? 1 : 0,
                }}
              >
                결재
              </span>
            </>
          }
        />

        <div style={st('flex-grow:1;min-height:0;border:2px solid #000000;position:relative;overflow:hidden')}>
          <div
            aria-hidden={done}
            style={{ ...st('position:absolute;left:0;right:0;top:0;padding:10px 10px;display:flex;flex-direction:column;gap:10px;transition:opacity 0.4s;pointer-events:none'), opacity: done ? 0 : 1 }}
          >
            <div style={st('display:flex;flex-direction:column;gap:2px')}>
              <h2 style={st(H2)}>□ 상황</h2>
              <p style={st(OPEN_ITEM)}>○ {shortDateTime(u)}부 개봉 일시 도래</p>
              <p style={st(OPEN_ITEM)}>○ 잔여 0일 0시간</p>
            </div>
            <div style={st('display:flex;flex-direction:column;gap:2px')}>
              <h2 style={st(H2)}>□ 조치</h2>
              <p style={st(`${OPEN_ITEM};color:#D2161C`)}>○ 시간 결재 득한 즉시 개봉</p>
              <p style={st('margin:0;padding-left:24px;font-size:12px;font-weight:500;color:#0A7A2F;line-height:1.6')}>* 결재 대기 중</p>
            </div>
          </div>

          <div
            aria-hidden={!done}
            style={{
              ...st('position:absolute;left:0;right:0;top:0;bottom:0;padding:10px 10px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;transition:opacity 0.6s ease,transform 0.6s ease'),
              opacity: done ? 1 : 0,
              transform: done ? 'none' : 'translateY(24px)',
              pointerEvents: done ? 'auto' : 'none',
            }}
          >
            <h2 style={st(H2)}>□ 붙임 (편지 1부)</h2>
            {items.map((item, i) => (
              <p
                key={i}
                className="tyl-text"
                style={st(`margin:0;padding-left:28px;text-indent:-18px;font-size:15px;font-weight:700;line-height:1.65${i === items.length - 1 ? ';color:#D2161C' : ''}`)}
              >
                ○ {item}
              </p>
            ))}
            <p className="tyl-keep" style={st('margin:0;padding-left:24px;font-size:12px;font-weight:500;color:#0A7A2F;line-height:1.6')}>
              * {shortDate(letter.createdAt)} {letter.from} 작성. 이상 끝.
            </p>
            <h2 style={st(`${H2};margin:10px 0 0`)}>□ 행정사항</h2>
            <p style={st(OPEN_ITEM)}>○ 수신자는 확인 후 회신할 것</p>
          </div>
        </div>
      </div>

      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={done ? replay : skip}>
          {done ? '다시 결재' : '한 번에 보기'}
        </button>
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          회신 보고하기
        </button>
      </div>
    </div>
  )
}

export const report: Theme = {
  id: 'report',
  code: 12,
  name: '군대 보고서',
  tints: null,
  fonts: ['Noto+Sans+KR:wght@500;700;900', 'Noto+Serif+KR:wght@400;600'],
  tile: { bg: '#4E5740', markBg: '#FFFFFF', markW: '50px', markH: '68px', markRadius: '0' },
  preview: { bg: '#FFFFFF', fg: '#000000', font: SERIF, bubbleBg: 'transparent', bubbleFg: '#1414C8', radius: '0', pad: '0', size: '19px' },
  Locked,
  Open,
}
