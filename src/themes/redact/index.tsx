import { useEffect, useMemo, useRef, useState } from 'react'
import { dotDate, fullDate, hhmm } from '../../lib/date.ts'
import { LockError, remaining, st, TeaserLines } from '../shared.tsx'
import type { LetterInfo, LockedProps, OpenProps, Theme } from '../types.ts'

// 가려진 글 테마 (디자인: E-text, E-open)
const SERIF = "'Hahmlet',serif"
const SANS = "'Noto Sans KR',sans-serif"
const SCREEN = `box-sizing:border-box;background:#DCDDD9;color:#141414;font-family:${SERIF};padding:26px 20px 24px;display:flex;flex-direction:column;gap:18px`
const DOC = 'position:relative;flex-grow:1;flex-shrink:1;min-height:0;background:#FFFFFF;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 30px rgba(0,0,0,.08);padding:22px 22px 18px;display:flex;flex-direction:column;overflow:hidden'
const STAMP = `position:absolute;right:18px;top:96px;transform:rotate(-9deg);border:2.5px solid currentColor;border-radius:6px;padding:6px 12px;font-family:${SANS};font-size:17px;font-weight:700;letter-spacing:2px;mix-blend-mode:multiply;pointer-events:none`
const RED = '#C8322B'
const BLUE = '#1F4FB8'
const OUTLINE = `height:52px;border:1px solid #9A9A95;border-radius:4px;background:transparent;color:#141414;font-family:${SANS};font-size:15px;font-weight:500;cursor:pointer`
const SOLID = `height:52px;border:0;border-radius:4px;background:#141414;color:#FFFFFF;font-family:${SANS};font-size:15px;font-weight:500;cursor:pointer`
const BUTTONS = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px'

/** 문서 머리: 머리줄, 제목, 작성·수신 */
function DocHead({ letter, now, state }: { letter: LetterInfo; now: Date; state: '공개' | '공개됨' }) {
  return (
    <>
      <div style={st(`display:flex;justify-content:space-between;gap:12px;font-family:${SANS};font-size:11.5px;color:#6B6B6B;padding-bottom:10px;border-bottom:1px solid #141414`)}>
        <span>비공개 문서</span>
        <span>
          {state} {dotDate(letter.unlockAt)} {hhmm(letter.unlockAt)}
        </span>
      </div>
      <h1 className="tyl-keep" style={st('margin:16px 0 4px;font-size:21px;font-weight:700;letter-spacing:-0.5px;line-height:1.4')}>
        <TeaserLines unlock={letter.unlockAt} now={now} />
      </h1>
      <div className="tyl-keep" style={st(`font-family:${SANS};font-size:12px;color:#6B6B6B;margin-bottom:22px`)}>
        작성 {letter.from} / 수신 {letter.to}
      </div>
    </>
  )
}

// 잠긴 동안의 검은 막대. 실제 본문과 무관한 고정 패턴이라 단어 길이로 본문을 짐작할 수 없다.
// [폭(px), 기울기(deg)] — 디자인(E-text)의 값 그대로다.
const BARS: readonly (readonly (readonly [number, number])[])[] = [
  [[59, -0.24], [33, -0.12], [29, -0.49], [43, -0.12], [90, 0.36]],
  [[34, -0.53], [62, 0.04], [30, 0.34], [34, -0.47], [29, 0.53], [58, 0.39], [34, -0.29], [30, -0.37], [30, -0.25], [34, 0.28], [49, 0.42], [15, -0.5], [17, -0.2], [16, 0.01], [59, -0.3]],
  [[60, -0.49], [34, 0.44], [32, 0.41], [28, 0.49], [32, 0.25]],
  [[75, 0.42], [47, -0.37], [31, 0.12], [76, -0.06], [44, -0.23]],
  [[34, 0.36], [13, -0.54], [33, 0.6], [47, 0.04]],
]

function Locked(p: LockedProps) {
  const { letter } = p
  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`min-height:var(--screen-h, 100dvh);${SCREEN}`)}>
      <div style={st(`${DOC};min-height:420px`)}>
        <DocHead letter={letter} now={new Date(p.now)} state="공개" />
        <div aria-hidden="true" style={{ ...st(STAMP), color: RED }}>
          공개 전
        </div>
        <div role="img" aria-label="가려진 문서 본문" style={st('flex-grow:1;min-height:0;overflow:hidden')}>
          {BARS.map((row, r) => (
            <div key={r} style={st('display:flex;flex-wrap:wrap;gap:9px 6px;margin-bottom:12px')}>
              {row.map(([w, deg], i) => (
                <span key={i} style={{ ...st('display:inline-block;height:17px;margin:3px 0;background:#141414;border-radius:1.5px'), width: w, transform: `rotate(${deg}deg)` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={st(`display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:${SANS}`)}>
        {p.status === 'error' ? (
          <LockError {...p} />
        ) : (
          <>
            <span style={st('font-size:13px;color:#4A4A4A;line-height:1.6')}>공개 전에는 누구도 볼 수 없어요</span>
            <span style={st('font-size:19px;font-weight:700;flex-shrink:0;font-variant-numeric:tabular-nums')}>{remaining(p, '공개하는 중…')}</span>
          </>
        )}
      </div>
      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={p.onSaveCalendar} disabled={p.preview}>
          캘린더에 저장
        </button>
        <button type="button" style={st(SOLID)} onClick={p.onWrite} disabled={p.preview}>
          나도 비공개 문서 만들기
        </button>
      </div>
    </div>
  )
}

// 실제 단어 폭에 맞춘 막대가 단어 단위로 걷힌다 (E-open 스크립트의 값)
const START_DELAY = 900
const WORD_TIME = 120

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
  const body = useRef<HTMLDivElement>(null)
  // 걷히는 줄을 따라 스크롤하는 중인지. 사용자가 직접 스크롤하면 멈춘다.
  const following = useRef(true)
  // 진행 중인 부드러운 스크롤의 목적지. 도착 전에 같은 줄로 다시 스크롤하지 않게 한다.
  const target = useRef(0)

  useEffect(() => {
    if (run === 0) return
    const step = (n: number) => {
      setShown(n)
      if (n < count) timer.current = window.setTimeout(() => step(n + 1), WORD_TIME)
    }
    setShown(0)
    following.current = true
    target.current = 0
    if (body.current) body.current.scrollTop = 0
    timer.current = window.setTimeout(() => step(1), START_DELAY)
    return () => clearTimeout(timer.current)
  }, [run, count])

  // 손으로 스크롤하는 입력(휠, 터치, 스크롤 막대, 키보드)이 오면 따라가기를 멈춘다.
  // scroll 이벤트는 우리가 부른 scrollTo에서도 나므로 쓰지 않는다.
  useEffect(() => {
    const el = body.current
    if (!el) return
    const stop = () => (following.current = false)
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    events.forEach((e) => el.addEventListener(e, stop, { passive: true }))
    return () => events.forEach((e) => el.removeEventListener(e, stop))
  }, [])

  const done = shown >= count

  // 걷히는 단어가 문서 보이는 영역 아래로 내려가면, 그 줄이 보이도록 부드럽게 따라 내려간다.
  useEffect(() => {
    const el = body.current
    if (!el || run === 0 || done || shown === 0 || !following.current) return
    const word = el.querySelectorAll<HTMLElement>('[data-word]')[shown - 1]
    if (!word) return
    const bottom = word.offsetTop + word.offsetHeight
    const viewTop = Math.max(el.scrollTop, target.current)
    if (bottom <= viewTop + el.clientHeight - 24) return
    target.current = Math.max(0, word.offsetTop - el.clientHeight * 0.4)
    el.scrollTo({ top: target.current, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [shown, run, done, reducedMotion])

  const showAll = () => {
    clearTimeout(timer.current)
    setShown(count)
    target.current = 0
    if (body.current) body.current.scrollTop = 0
  }
  const animate = run > 0 && !reducedMotion
  let k = 0

  return (
    <div className="tyl-screen tyl-focus-dark" style={st(`height:max(var(--screen-h, 100dvh), 600px);${SCREEN}`)}>
      <div style={st(DOC)}>
        <DocHead letter={letter} now={letter.createdAt} state="공개됨" />
        <div aria-hidden="true" style={{ ...st(STAMP), color: RED, opacity: shown > 0 ? 0 : 1, transition: animate ? 'opacity .4s,transform .4s' : undefined }}>
          공개 전
        </div>
        <div aria-hidden="true" style={{ ...st(STAMP), color: BLUE, opacity: done ? 1 : 0, transition: animate ? 'opacity .4s .1s' : undefined }}>
          공개됨
        </div>
        <div ref={body} tabIndex={0} style={st('position:relative;flex-grow:1;min-height:0;overflow-y:auto;outline:none')}>
          <div style={st('display:flex;flex-wrap:wrap;align-content:flex-start;gap:9px 6px')}>
            {tokens.map((t, i) => {
              if ('gap' in t) return <span key={i} style={{ flexBasis: '100%', height: t.gap }} />
              const open = k++ < shown
              return (
                <span key={i} data-word="" style={st('position:relative;max-width:100%;font-size:17px;line-height:1.45;padding:0 1px;overflow-wrap:anywhere')}>
                  <span style={{ color: open ? '#141414' : 'transparent', transition: animate ? 'color .3s ease' : undefined }}>{t.word}</span>
                  <span
                    aria-hidden="true"
                    style={{ ...st('position:absolute;left:0;top:2px;bottom:2px;background:#141414;border-radius:1.5px'), width: open ? '0%' : '100%', transition: animate ? 'width .35s cubic-bezier(.6,0,.4,1)' : undefined }}
                  />
                </span>
              )
            })}
          </div>
        </div>
      </div>
      <div style={st(`display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:${SANS}`)}>
        <span style={st('font-size:13px;color:#4A4A4A')}>{fullDate(letter.createdAt)} 작성</span>
        {!done && (
          <button type="button" style={st('min-height:44px;border:0;background:transparent;padding:0;color:#141414;font-family:inherit;font-size:14px;text-decoration:underline;text-underline-offset:4px;cursor:pointer')} onClick={showAll}>
            한 번에 보기
          </button>
        )}
      </div>
      <div style={st(BUTTONS)}>
        <button type="button" style={st(OUTLINE)} onClick={() => (reducedMotion ? showAll() : setRun((r) => r + 1))}>
          다시 보기
        </button>
        <button type="button" style={st(SOLID)} onClick={onReply} disabled={preview}>
          답장도 비공개로 보내기
        </button>
      </div>
    </div>
  )
}

export const redact: Theme = {
  id: 'redact',
  code: 8,
  name: { ko: '가려진 글', en: 'Redacted' },
  tints: null,
  fonts: ['Hahmlet:wght@400;500;700', 'Noto+Sans+KR:wght@400;500;700'],
  tile: { bg: '#DCDDD9', markBg: '#141414', markW: '46px', markH: '12px', markRadius: '1.5px' },
  preview: { bg: '#DCDDD9', fg: '#141414', font: SERIF, bubbleBg: '#FFFFFF', bubbleFg: '#141414', radius: '0', pad: '14px 16px', size: '17px' },
  Locked,
  Open,
}
