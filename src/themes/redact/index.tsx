import { useEffect, useMemo, useRef, useState } from 'react'
import { fullDate, hourMin, iGa } from '../../lib/date.ts'
import { LockError, remaining, st } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 가려진 글 테마 (디자인: E-text, E-open)
const FONT = "'Hahmlet',serif"
const SCREEN = `box-sizing:border-box;background:#F7F7F7;color:#000000;font-family:${FONT};padding:36px 30px 28px;display:flex;flex-direction:column;gap:28px`
const PRIMARY = 'height:54px;border:0;background:#000000;color:#FFFFFF;font-family:inherit;font-size:16px;font-weight:500;cursor:pointer;flex-shrink:0'
const LINK = `height:48px;border:0;background:transparent;color:#000000;font-family:${FONT};font-size:15px;text-decoration:underline;text-underline-offset:4px;cursor:pointer;padding:0`
const ROW = 'display:flex;align-items:center;justify-content:space-between;gap:16px'
const TIMELOCK_OVERHEAD = 193

/**
 * 잠긴 동안에는 실제 단어 길이를 알 수 없다. 막대 배열은 암호문 길이와 링크 해시를
 * 시드로 한 의사난수로 만든다. 같은 링크는 항상 같은 모양이다.
 */
function fakeBars(letter: LetterInfo): number[] {
  let seed = (parseInt(letter.hash, 36) ^ Math.imul(letter.cipherLength, 0x9e3779b1)) >>> 0
  const next = () => {
    // mulberry32
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  // 편지가 길수록 막대가 많다. 화면 한 장에 들어갈 만큼만 그린다.
  const count = Math.min(34, Math.max(6, Math.round((letter.cipherLength - TIMELOCK_OVERHEAD) / 5)))
  return Array.from({ length: count }, () => 26 + Math.round(next() * 27) * 2)
}

const Caption = ({ letter }: { letter: LetterInfo }) => (
  <p className="tyl-keep" style={st('margin:0;font-size:15px;color:#4A4A4A')}>
    {iGa(letter.from)} {letter.to}에게
  </p>
)
const TITLE = 'margin:0;font-size:27px;font-weight:500;line-height:1.45;letter-spacing:-0.5px'

function Locked(p: LockedProps) {
  const { letter } = p
  const bars = useMemo(() => fakeBars(letter), [letter])
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st('display:flex;flex-direction:column;gap:10px')}>
        <Caption letter={letter} />
        <h1 className="tyl-keep" style={st(TITLE)}>
          이 편지는 {fullDate(letter.unlockAt)}
          <br />
          {hourMin(letter.unlockAt)}까지 읽을 수 없습니다.
        </h1>
      </div>

      <div style={st('flex-grow:1;display:flex;flex-direction:column;justify-content:center')}>
        <div role="img" aria-label="가려진 편지 본문" style={st('display:flex;flex-wrap:wrap;gap:18px 8px')}>
          {bars.map((w, i) => (
            <div key={i} style={{ width: w, height: 15, background: '#000' }} />
          ))}
        </div>
        <p style={st('margin:28px 0 0;font-size:13px;line-height:1.7;color:#4A4A4A')}>
          쓴 사람도, 이 사이트도 지금은 열 수 없습니다.
          <br />
          그날이 되면 이 자리에서 글로 바뀝니다.
        </p>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:18px')}>
        <LockError {...p} />
        {p.status !== 'error' && (
          <p style={st('margin:0;font-size:34px;font-weight:700;letter-spacing:-1px;color:#1838D8;font-variant-numeric:tabular-nums')}>
            {p.status === 'opening' ? remaining(p) : `${remaining(p)} 남음`}
          </p>
        )}
        <div style={st(ROW)}>
          <button type="button" style={st(`${PRIMARY};padding:0 26px`)} onClick={p.onWrite} disabled={p.preview}>
            나도 한 통 쓰기
          </button>
          <button type="button" style={st(LINK)} onClick={p.onSaveCalendar} disabled={p.preview}>
            캘린더에 넣어 두기
          </button>
        </div>
      </div>
    </div>
  )
}

// 검은 막대가 단어 단위로 걷힌다 (E-open 스크립트의 값)
const START_DELAY = 900
const WORD_TIME = 110

type Token = { word: string } | { gap: number }

/** 단어와 줄바꿈으로 나눈다. 빈 줄은 문단 사이 간격이 된다. */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const words = line.split(/\s+/).filter(Boolean)
    if (words.length === 0) out.push({ gap: 10 })
    else {
      for (const word of words) out.push({ word })
      out.push({ gap: 0 })
    }
  }
  return out
}

function Open({ letter, text, autoplay, reducedMotion, onReply, preview }: OpenProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const count = useMemo(() => tokens.filter((t) => 'word' in t).length, [tokens])
  const [shown, setShown] = useState(autoplay ? 0 : count)
  const [run, setRun] = useState(autoplay ? 1 : 0)
  const timer = useRef(0)

  useEffect(() => {
    if (run === 0) return
    const step = (n: number) => {
      setShown(n)
      if (n < count) timer.current = window.setTimeout(() => step(n + 1), WORD_TIME)
    }
    setShown(0)
    timer.current = window.setTimeout(() => step(1), START_DELAY)
    return () => clearTimeout(timer.current)
  }, [run, count])

  const done = shown >= count
  const showAll = () => {
    clearTimeout(timer.current)
    setShown(count)
  }
  let k = 0

  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st('display:flex;flex-direction:column;gap:10px')}>
        <Caption letter={letter} />
        <h1 className="tyl-keep" style={st(TITLE)}>
          {fullDate(letter.unlockAt)} {hourMin(letter.unlockAt)},
          <br />
          이제 읽을 수 있습니다.
        </h1>
      </div>

      <div style={st('flex-grow:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column')}>
        <div style={st('margin:auto 0;display:flex;flex-wrap:wrap;gap:16px 6px')}>
          {tokens.map((t, i) => {
            if ('gap' in t) return <span key={i} style={{ flexBasis: '100%', height: t.gap }} />
            const open = k++ < shown
            return (
              <span
                key={i}
                style={{
                  ...st('font-size:18px;line-height:1.3;padding:1px 2px;overflow-wrap:anywhere;min-width:0;transition:background-color 0.45s ease,color 0.45s ease'),
                  backgroundColor: open ? 'transparent' : '#000000',
                  color: open ? '#000000' : 'transparent',
                }}
              >
                {t.word}
              </span>
            )
          })}
        </div>
      </div>

      <div style={st('display:flex;flex-direction:column;gap:18px')}>
        <p style={st('margin:0;font-size:16px;color:#4A4A4A')}>{fullDate(letter.createdAt)}에 씀</p>
        <div style={st(ROW)}>
          <button type="button" style={st(`${PRIMARY};padding:0 22px`)} onClick={onReply} disabled={preview}>
            답장도 잠가서 보내기
          </button>
          {done ? (
            <button type="button" style={st(LINK)} onClick={() => (reducedMotion ? showAll() : setRun((r) => r + 1))}>
              다시 보기
            </button>
          ) : (
            <button type="button" style={st(LINK)} onClick={showAll}>
              한 번에 보기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const redact: Theme = {
  id: 'redact',
  code: 8,
  name: '가려진 글',
  tints: null,
  fonts: ['Hahmlet:wght@400;500;700'],
  tile: { bg: '#F7F7F7', markBg: '#000000', markW: '46px', markH: '12px', markRadius: '0' },
  preview: { bg: '#F7F7F7', fg: '#000000', font: FONT, bubbleBg: 'transparent', bubbleFg: '#000000', radius: '0', pad: '0', size: '21px' },
  Locked,
  Open,
}
