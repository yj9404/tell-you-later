import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { encodeLink, NAME_MAX } from '../lib/codec.ts'
import { clock, fullDate, teaserDate } from '../lib/date.ts'
import { roundForTime, timeForRound } from '../lib/drand.ts'
import { errorCode } from '../lib/errors.ts'
import { useStrings } from '../i18n/index.ts'
import { loadFonts } from '../lib/fonts.ts'
import { lockLetter } from '../lib/timelock.ts'
import { THEMES } from '../themes/registry.ts'
import { FullPreview, PreviewPair, type Draft, type Side } from './Preview.tsx'
import { WhenSheet } from './WhenSheet.tsx'
import { resolveWhen, type When } from './when.ts'
import s from './write.module.css'

export interface Prefill {
  to: string
  from: string
}

export interface Created {
  fragment: string
  unlockAt: Date
  /** 링크 완성 화면에서 열리는 모습을 마지막으로 보여주기 위한 원문. 메모리에만 있다. */
  draft: Draft
}

const BODY_MAX = 2000

const Chevron = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

const Lock = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

/** 쓰기 화면 (디자인: Write 3차). 편지 카드 하나에 이름·여는 날·본문을 모으고, 그 아래에 받는 사람이 먼저 보는 문장을 보여준다. */
export function Write({ prefill, onCreated }: { prefill: Prefill | null; onCreated: (c: Created) => void }) {
  const [to, setTo] = useState(prefill?.to ?? '')
  const [from, setFrom] = useState(prefill?.from ?? '')
  const [when, setWhen] = useState<When>({ kind: 'newyear' })
  const [now, setNow] = useState(() => new Date())
  const [body, setBody] = useState('')
  const [themeId, setThemeId] = useState(THEMES[0].id)
  const [tint, setTint] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [preview, setPreview] = useState<Side | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = useStrings()

  // 화면을 켜 둔 동안 날짜 표기가 낡지 않게 한다.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]
  useEffect(() => loadFonts(theme.fonts), [theme])

  const unlock = resolveWhen(when, now)
  const inPast = unlock.getTime() <= now.getTime()
  const draft: Draft = { themeId: theme.id, tint, to, from, body, unlockAt: unlock }
  const closeSheet = useCallback(() => setSheet(false), [])
  const closePreview = useCallback(() => setPreview(null), [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const at = resolveWhen(when, new Date())
    if (!to.trim() || !from.trim()) return setError('받는 사람과 보내는 사람을 적어 주세요.')
    if (!body.trim()) return setError('그날 할 말을 적어 주세요.')
    if (at.getTime() <= Date.now()) return setError('열리는 시각은 지금보다 뒤여야 합니다. 날짜를 다시 정해 주세요.')
    setError('')
    setBusy(true)
    try {
      const round = roundForTime(at.getTime())
      const text = body.trim()
      const cipher = await lockLetter(text, round)
      const fragment = encodeLink({
        theme: theme.code,
        tint: theme.tints ? tint : 0,
        to: to.trim(),
        from: from.trim(),
        round,
        created: Math.floor(Date.now() / 60_000),
        body: cipher,
      })
      const unlockAt = new Date(timeForRound(round))
      onCreated({ fragment, unlockAt, draft: { ...draft, to: to.trim(), from: from.trim(), body: text, unlockAt } })
    } catch (err) {
      // 잠그기는 네트워크를 쓰지 않는다. 여기서 나는 오류는 코드와 상관없이 같은 안내를 보여주고 원인은 console에만 남긴다.
      console.error(errorCode(err), err)
      setError(t.lockError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form className={s.page} onSubmit={submit} noValidate>
        <header className={s.head}>
          <img className={s.wordmark} src="/wordmark.svg" alt="할 말이 있는데 나중에 할게" width={94} height={40} />
          <h1 className={s.title}>
            정한 날이 와야
            <br />
            열리는 편지를 써요
          </h1>
          <p className={s.lead}>완성된 링크를 보내면, 그날 전에는 누구도 열 수 없어요.</p>
        </header>

        <section aria-label="편지" className={s.card}>
          <label className={s.row}>
            <span className={s.rowLabel}>받는 사람</span>
            <input className={s.rowInput} value={to} placeholder="이름이나 별명" maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className={s.row}>
            <span className={s.rowLabel}>보내는 사람</span>
            <input className={s.rowInput} value={from} placeholder="내 이름" maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setFrom(e.target.value)} />
          </label>
          <button
            type="button"
            className={s.row}
            aria-haspopup="dialog"
            onClick={(e) => {
              // Safari는 버튼을 눌러도 포커스를 주지 않는다. 시트를 닫을 때 여기로 돌아오게 미리 잡아 둔다.
              e.currentTarget.focus()
              setSheet(true)
            }}
          >
            <span className={s.rowLabel}>여는 날</span>
            <span className={s.rowValue} data-past={inPast || undefined}>
              {fullDate(unlock)} {clock(unlock)}
            </span>
            <Chevron />
          </button>
          <textarea
            aria-label="편지 내용"
            className={s.textarea}
            value={body}
            placeholder={'여기에 하고 싶은 말을 쓰세요.\n\n빈 줄을 넣으면 문단이 나뉘고, 테마에 따라 말풍선이나 장면이 나뉩니다.'}
            onChange={(e) => setBody(Array.from(e.target.value).slice(0, BODY_MAX).join(''))}
          />
          <div className={s.cardFoot}>
            <span className={s.lockNote}>
              <Lock />이 칸만 잠겨요
            </span>
            <span>
              {Array.from(body).length.toLocaleString('ko-KR')} / {BODY_MAX.toLocaleString('ko-KR')}
            </span>
          </div>
        </section>

        <section className={s.group12}>
          <h2 className={s.sectionTitle}>링크를 열면 바로 보이는 문장</h2>
          <div className={s.teaser}>
            <span className={s.teaserSub}>{to.trim() || '받는 사람'}에게</span>
            <span className={s.teaserMain}>
              할 말이 있는데
              <br />
              <mark className={s.teaserDate}>{teaserDate(unlock, now)}</mark>에 할게
            </span>
            {from.trim() && <span className={s.teaserSub}>{from.trim()}</span>}
          </div>
          <p className={s.note} role={inPast ? 'alert' : undefined}>
            {inPast ? '정한 시각이 이미 지났어요. 여는 날을 눌러 다시 정해 주세요.' : '이름과 날짜는 위 칸에서 바뀝니다. 편지 내용은 그날까지 보이지 않아요.'}
          </p>
        </section>

        <section className={s.look}>
          <div className={s.lookHead}>
            <h2 className={s.sectionTitle}>어떤 모습으로 도착할까요</h2>
            <span className={s.note}>받는 사람 화면을 미리 볼 수 있어요.</span>
          </div>

          <div className={s.pills}>
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={s.pill} aria-pressed={t.id === theme.id} onClick={() => setThemeId(t.id)}>
                {t.name}
              </button>
            ))}
          </div>

          {theme.tints && (
            <div className={s.tints}>
              <span className={s.note}>색</span>
              {theme.tints.map((c, i) => (
                <button key={c.hex} type="button" className={s.tint} aria-label={c.name} aria-pressed={i === tint} style={{ background: c.hex }} onClick={() => setTint(i)} />
              ))}
            </div>
          )}

          <PreviewPair draft={draft} onOpen={setPreview} />

          <button type="button" className={s.fullButton} onClick={(e) => (e.currentTarget.focus(), setPreview('before'))}>
            내 편지로 전체 화면 미리보기
          </button>
        </section>

        <div className={s.bottom}>
          {error && (
            <span className={s.error} role="alert">
              {error}
            </span>
          )}
          <button type="submit" className={s.submit} disabled={busy}>
            {busy ? '잠그는 중…' : '잠그고 링크 만들기'}
          </button>
          <span className={s.noteCenter}>편지는 서버에 저장되지 않아요. 링크를 잃어버리면 다시 찾을 수 없어요.</span>
        </div>
      </form>

      {sheet && (
        <WhenSheet
          now={now}
          value={when}
          onClose={closeSheet}
          onConfirm={(next) => {
            setWhen(next)
            setSheet(false)
          }}
        />
      )}
      {preview && <FullPreview draft={draft} start={preview} onClose={closePreview} />}
    </>
  )
}
