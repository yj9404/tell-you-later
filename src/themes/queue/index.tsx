import { useEffect, useState } from 'react'
import { dateHour, daysBetween, fullDate, whenText } from '../../lib/date.ts'
import { LockError, st, usePhases } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'
import './queue.css'

// 대기열 테마 (디자인: J-queue, J-open)
const FONT = "'Noto Sans KR',sans-serif"
const SCREEN = `box-sizing:border-box;background:#FFE94A;color:#000000;font-family:${FONT};padding:36px 24px 26px;display:flex;flex-direction:column;gap:26px`
const OUTLINE = `height:56px;border:3px solid #000000;border-radius:14px;background:transparent;color:#000000;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`
const SOLID = `height:56px;box-sizing:border-box;border:0;border-radius:14px;background:#000000;color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:700;cursor:pointer`
const BIG = 'font-size:84px;font-weight:900;line-height:1.1;letter-spacing:-5px;font-variant-numeric:tabular-nums'
const MID = 'font-size:34px;font-weight:900;line-height:1.1;letter-spacing:-1.5px;font-variant-numeric:tabular-nums'

/** 큰 글자와 그 아래 글자로 나눈 남은 시간: ["50일", "12시간 54분"] */
function split(ms: number): [string, string] {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d > 0) return [`${d}일`, `${h}시간 ${m}분`]
  if (h > 0) return [`${h}시간`, `${m}분 ${s}초`]
  if (m > 0) return [`${m}분`, `${s}초`]
  return [`${s}초`, '곧 내 차례예요']
}

function Head({ letter, title }: { letter: LetterInfo; title: string }) {
  return (
    <div style={st('display:flex;flex-direction:column;gap:8px')}>
      <p className="tyl-keep" style={st('margin:0;font-size:15px;font-weight:500')}>
        {letter.from} 님이 {letter.to} 님에게 보낸 편지
      </p>
      <h1 style={st('margin:0;font-size:38px;font-weight:900;line-height:1.25;letter-spacing:-2px')}>{title}</h1>
    </div>
  )
}

function Bar({ label, width, transition, letter, left }: { label: string; width: string; transition?: string; letter: LetterInfo; left: string }) {
  return (
    <div style={st('display:flex;flex-direction:column;gap:8px')}>
      <div role="img" aria-label={label} style={st('height:26px;box-sizing:border-box;border:3px solid #000000;border-radius:13px;background:#FFFFFF;padding:3px;display:flex')}>
        <div style={{ ...st('min-width:14px;background:#000000;border-radius:8px'), width, transition }} />
      </div>
      <div style={st('display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:500')}>
        <span>{left}</span>
        <span>{dateHour(letter.unlockAt)}</span>
      </div>
    </div>
  )
}

/** 입장 중 화면. 잠김(열쇠를 받는 실제 대기)과 열림(다시 입장하기 연출)이 함께 쓴다. */
function Entering({ letter, width, transition }: { letter: LetterInfo; width: string; transition: string }) {
  return (
    <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center;gap:22px')}>
      <div style={st('display:flex;flex-direction:column')}>
        <span style={st('font-size:16px;font-weight:700')}>내 앞에 남은 시간</span>
        <span style={st(BIG)}>0일</span>
        <span style={st(MID)}>내 차례예요</span>
      </div>
      <Bar label="입장 진행 중" width={width} transition={transition} letter={letter} left={fullDate(letter.createdAt)} />
      <p style={st('margin:0;font-size:14px;font-weight:500;line-height:1.9')}>자물쇠를 푸는 중이에요. 창을 닫지 마세요.</p>
    </div>
  )
}

function Locked(p: LockedProps) {
  const { letter, now } = p
  const today = new Date(now)
  const when = whenText(letter.unlockAt, today)
  const opening = p.status === 'opening'
  // 진행 막대는 drand에서 서명을 받아오는 실제 대기에 맞춘다. 끝을 알 수 없으므로 90%까지
  // 천천히 차오르다가, 편지가 풀리면 열림 화면이 100%로 채운다.
  const [creep, setCreep] = useState(false)
  useEffect(() => {
    if (!opening) return setCreep(false)
    const id = requestAnimationFrame(() => setCreep(true))
    return () => cancelAnimationFrame(id)
  }, [opening])

  const span = letter.unlockAt.getTime() - letter.createdAt.getTime()
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - letter.createdAt.getTime()) / span)) : 1
  const percent = Math.floor(progress * 100)
  const [big, small] = split(letter.unlockAt.getTime() - now)
  const sameDay = letter.createdAt.toDateString() === today.toDateString()

  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Head letter={letter} title={opening ? '입장 중입니다' : '접속 대기 중입니다'} />

      {opening ? (
        <Entering letter={letter} width={creep ? '90%' : '2%'} transition="width 8s cubic-bezier(0.1,0.6,0.2,1)" />
      ) : (
        <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center;gap:22px')}>
          <div style={st('display:flex;flex-direction:column;gap:0')}>
            <span style={st('font-size:16px;font-weight:700')}>내 앞에 남은 시간</span>
            <span style={st(BIG)}>{big}</span>
            <span style={st(MID)}>{small}</span>
          </div>

          <Bar label={percent < 1 ? '진행률 1퍼센트 미만' : `진행률 ${percent}퍼센트`} width={`${progress * 100}%`} letter={letter} left={sameDay ? '오늘' : fullDate(letter.createdAt)} />

          <LockError {...p} />
          <ul style={st('margin:0;padding:0 0 0 18px;font-size:14px;line-height:1.9;font-weight:500')}>
            <li>새로고침해도 순서는 그대로예요.</li>
            <li>쓴 사람도 먼저 들어갈 수 없어요.</li>
            <li>
              {when}
              {letter.unlockAt.getMinutes() ? '이' : '가'} 되면 자동으로 열려요.
            </li>
          </ul>
        </div>
      )}

      <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 저장
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 줄 세우기
        </button>
      </div>
    </div>
  )
}

// 진행 막대가 차고 입장 (J-open 스크립트의 시각). "다시 입장하기"에서 쓴다.
const REPLAY_STEPS = [
  ['start', 0],
  ['fill', 400],
  ['in', 2500],
] as const
// 처음 열 때는 잠김 화면에서 이미 실제 대기만큼 막대가 찼으므로, 남은 구간만 채우고 들어간다.
const FIRST_STEPS = [
  ['start', 0],
  ['fill', 50],
  ['in', 800],
] as const

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const [replayed, setReplayed] = useState(false)
  const first = usePhases(FIRST_STEPS, autoplay, reducedMotion)
  const again = usePhases(REPLAY_STEPS, false, reducedMotion)
  const play = replayed ? again : first
  const entered = play.phase === 'in'
  const days = daysBetween(letter.createdAt, new Date())

  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <Head letter={letter} title={entered ? '입장했습니다' : '입장 중입니다'} />

      {entered ? (
        <>
          <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center;animation:jIn 0.45s ease-out both')}>
            <div style={st('background:#FFFFFF;border:3px solid #000000;border-radius:16px;padding:22px 20px;display:flex;flex-direction:column;gap:16px')}>
              <p className="tyl-text" style={st('margin:0;font-size:17px;font-weight:500;line-height:1.85')}>
                {text}
              </p>
              <span style={st('font-size:15px;font-weight:700;text-align:right')}>
                {letter.from}, {days > 0 ? `${days}일 전에 씀` : '같은 날 씀'}
              </span>
            </div>
          </div>
          <div style={st('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;animation:jIn 0.45s 0.15s ease-out both')}>
            <button
              type="button"
              style={st(OUTLINE)}
              onClick={() => {
                setReplayed(true)
                again.replay()
              }}
            >
              다시 입장하기
            </button>
            <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
              나도 줄 세우기
            </button>
          </div>
        </>
      ) : (
        <>
          <Entering
            letter={letter}
            width={play.phase === 'fill' ? '100%' : replayed ? '2%' : '90%'}
            transition={replayed ? 'width 1.8s cubic-bezier(0.3,0,0.2,1)' : 'width 0.6s cubic-bezier(0.3,0,0.2,1)'}
          />
          <button type="button" style={st(OUTLINE)} onClick={play.skip}>
            한 번에 보기
          </button>
        </>
      )}
    </div>
  )
}

export const queue: Theme = {
  id: 'queue',
  code: 4,
  name: '대기열',
  tints: null,
  fonts: ['Noto+Sans+KR:wght@400;500;700;900'],
  tile: { bg: '#FFE94A', markBg: '#000000', markW: '48px', markH: '10px', markRadius: '5px' },
  preview: { bg: '#FFE94A', fg: '#000000', font: FONT, bubbleBg: 'transparent', bubbleFg: '#000000', radius: '0', pad: '0', size: '24px' },
  Locked,
  Open,
}
