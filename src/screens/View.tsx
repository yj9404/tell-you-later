import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { decodeLink, linkHash, type Letter } from '../lib/codec.ts'
import { DrandError, timeForRound } from '../lib/drand.ts'
import { errorCode } from '../lib/errors.ts'
import { LangContext, useLang, useStrings } from '../i18n/index.ts'
import { loadFonts } from '../lib/fonts.ts'
import { openLetter } from '../lib/timelock.ts'
import { themeByCode, themeLang } from '../themes/registry.ts'
import type { LetterInfo, LockStatus } from '../themes/types.ts'
import { useSaveCalendar } from './SaveCalendar.tsx'
import type { Prefill } from './Write.tsx'
import s from './screens.module.css'

// drand 라운드는 예정 시각보다 조금 늦게 나올 수 있다. 그 정도는 기다린다.
const NOT_YET_RETRIES = 6
const NOT_YET_WAIT_MS = 1500

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 열림 연출을 이미 본 링크인지. 저장소 접근이 막힌 브라우저에서도 동작해야 한다.
const playedKey = (hash: string) => `tyl-played-${hash}`
function wasPlayed(hash: string): boolean {
  try {
    return localStorage.getItem(playedKey(hash)) === '1'
  } catch {
    return false
  }
}
function markPlayed(hash: string): void {
  try {
    localStorage.setItem(playedKey(hash), '1')
  } catch {
    // 기록하지 못하면 다음에도 연출이 재생될 뿐이다.
  }
}

interface Props {
  fragment: string
  onWrite: (prefill: Prefill | null) => void
}

export function View({ fragment, onWrite }: Props) {
  const letter = useMemo(() => {
    try {
      return decodeLink(fragment)
    } catch {
      return null
    }
  }, [fragment])

  const lang = useLang()
  if (!letter) return <Broken onWrite={() => onWrite(null)} />
  // 영어판에서 숨긴 테마(결재 공문 등)는 영어 경로로 열려도 캘린더 메뉴까지 한국어로 보여준다.
  return (
    <LangContext.Provider value={themeLang(themeByCode(letter.theme), lang)}>
      <Letter letter={letter} fragment={fragment} onWrite={onWrite} />
    </LangContext.Provider>
  )
}

function Letter({ letter, fragment, onWrite }: Props & { letter: Letter }) {
  const theme = themeByCode(letter.theme)
  const unlockMs = timeForRound(letter.round)
  const [now, setNow] = useState(() => Date.now())
  const [status, setStatus] = useState<LockStatus>('waiting')
  const [error, setError] = useState('')
  const [text, setText] = useState<string | null>(null)
  const started = useRef(false)
  const t = useStrings()

  const hash = useMemo(() => linkHash(fragment), [fragment])
  const info: LetterInfo = useMemo(
    () => ({
      to: letter.to,
      from: letter.from,
      tint: theme.tints ? (theme.tints[letter.tint] ?? theme.tints[0]).hex : null,
      createdAt: new Date(letter.created * 60_000),
      unlockAt: new Date(unlockMs),
    }),
    [letter, theme, unlockMs],
  )

  // 연출을 재생할지는 처음 그릴 때 한 번만 정한다.
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [autoplay] = useState(() => !reducedMotion && !wasPlayed(hash))

  useEffect(() => loadFonts(theme.fonts), [theme])

  const open = useCallback(async () => {
    setStatus('opening')
    setError('')
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          setText(await openLetter(letter.body, letter.round))
          markPlayed(hash)
          return
        } catch (e) {
          const retry = e instanceof DrandError && e.kind === 'not-yet' && attempt < NOT_YET_RETRIES
          if (!retry) throw e
          await sleep(NOT_YET_WAIT_MS)
        }
      }
    } catch (e) {
      console.error(e)
      setError(t.openError[errorCode(e)])
      setStatus('error')
    }
  }, [letter, hash, t])

  // 개봉 시각 전에는 복호화를 시도하지 않는다. 시각이 되면 새로고침 없이 연다.
  useEffect(() => {
    if (text !== null || started.current) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= unlockMs && !started.current) {
        started.current = true
        clearInterval(id)
        void open()
      }
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [unlockMs, open, text])

  const calendar = useSaveCalendar({ from: letter.from, unlockAt: info.unlockAt, uid: hash })

  if (text !== null) {
    return (
      <theme.Open
        letter={info}
        text={text}
        autoplay={autoplay}
        reducedMotion={reducedMotion}
        onReply={() => onWrite({ to: letter.from, from: letter.to })}
      />
    )
  }

  return (
    <>
      <theme.Locked
        letter={info}
        now={now}
        status={status}
        error={error}
        onRetry={() => void open()}
        onSaveCalendar={calendar.onSaveCalendar}
        onWrite={() => onWrite(null)}
      />
      {calendar.overlay}
    </>
  )
}

function Broken({ onWrite }: { onWrite: () => void }) {
  const t = useStrings()
  return (
    <div className={s.page}>
      <div className={s.head}>
        <h1 className={s.title}>
          {t.broken.title[0]}
          <br />
          {t.broken.title[1]}
        </h1>
        <p className={s.lead}>{t.broken.lead}</p>
      </div>
      <div className={s.bottom}>
        <button type="button" className={s.primary} onClick={onWrite}>
          {t.broken.write}
        </button>
      </div>
    </div>
  )
}
