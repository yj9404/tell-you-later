import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { encodeLink, NAME_MAX } from '../lib/codec.ts'
import { roundForTime, timeForRound } from '../lib/drand.ts'
import { errorCode } from '../lib/errors.ts'
import { useLang, useStrings } from '../i18n/index.ts'
import { loadFonts } from '../lib/fonts.ts'
import { lockLetter } from '../lib/timelock.ts'
import { themesFor } from '../themes/registry.ts'
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
  const lang = useLang()
  const t = useStrings()
  // 영어판에서 숨긴 테마는 칩에 나오지 않는다(src/themes/registry.ts).
  const themes = themesFor(lang)
  const [to, setTo] = useState(prefill?.to ?? '')
  const [from, setFrom] = useState(prefill?.from ?? '')
  const [when, setWhen] = useState<When>({ kind: 'newyear' })
  const [now, setNow] = useState(() => new Date())
  const [body, setBody] = useState('')
  const [themeId, setThemeId] = useState(themes[0].id)
  const [tint, setTint] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [preview, setPreview] = useState<Side | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 화면을 켜 둔 동안 날짜 표기가 낡지 않게 한다.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const theme = themes.find((x) => x.id === themeId) ?? themes[0]
  useEffect(() => loadFonts(theme.fonts), [theme])

  const unlock = resolveWhen(when, now)
  const inPast = unlock.getTime() <= now.getTime()
  const draft: Draft = { themeId: theme.id, tint, to, from, body, unlockAt: unlock }
  const closeSheet = useCallback(() => setSheet(false), [])
  const closePreview = useCallback(() => setPreview(null), [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const at = resolveWhen(when, new Date())
    if (!to.trim() || !from.trim()) return setError(t.write.needNames)
    if (!body.trim()) return setError(t.write.needBody)
    if (at.getTime() <= Date.now()) return setError(t.write.needFuture)
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
          <div className={s.headTop}>
            <img className={s.wordmark} src={t.wordmark.src} alt={t.serviceName} width={t.wordmark.width} height={t.wordmark.height} />
            {/* 다른 언어 쓰기 화면으로. 브라우저 언어로 자동 이동하지 않는다. */}
            <a className={s.langLink} href={t.otherLang.href} hrefLang={t.otherLang.lang} lang={t.otherLang.lang}>
              {t.otherLang.label}
            </a>
          </div>
          <h1 className={s.title}>
            {t.write.title[0]}
            <br />
            {t.write.title[1]}
          </h1>
          <p className={s.lead}>{t.write.lead}</p>
        </header>

        <section aria-label={t.write.letter} className={s.card}>
          <label className={s.row}>
            <span className={s.rowLabel}>{t.write.to}</span>
            <input className={s.rowInput} value={to} placeholder={t.write.toPlaceholder} maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className={s.row}>
            <span className={s.rowLabel}>{t.write.from}</span>
            <input className={s.rowInput} value={from} placeholder={t.write.fromPlaceholder} maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setFrom(e.target.value)} />
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
            <span className={s.rowLabel}>{t.write.when}</span>
            <span className={s.rowValue} data-past={inPast || undefined}>
              {t.write.whenValue(unlock)}
            </span>
            <Chevron />
          </button>
          <textarea
            aria-label={t.write.body}
            className={s.textarea}
            value={body}
            placeholder={t.write.bodyPlaceholder}
            onChange={(e) => setBody(Array.from(e.target.value).slice(0, BODY_MAX).join(''))}
          />
          <div className={s.cardFoot}>
            <span className={s.lockNote}>
              <Lock />
              {t.write.lockNote}
            </span>
            <span>
              {t.date.number(Array.from(body).length)} / {t.date.number(BODY_MAX)}
            </span>
          </div>
        </section>

        <section className={s.group12}>
          <h2 className={s.sectionTitle}>{t.write.teaserTitle}</h2>
          <div className={s.teaser}>
            <span className={s.teaserSub}>{t.write.teaserTo(to.trim() || t.preview.to)}</span>
            <span className={s.teaserMain}>
              {t.teaserParts.line1}
              <br />
              {t.teaserParts.before}
              <mark className={s.teaserDate}>{t.date.teaserDate(unlock, now)}</mark>
              {t.teaserParts.after}
            </span>
            {from.trim() && <span className={s.teaserSub}>{from.trim()}</span>}
          </div>
          <p className={s.note} role={inPast ? 'alert' : undefined}>
            {inPast ? t.write.pastNote : t.write.teaserNote}
          </p>
        </section>

        <section className={s.look}>
          <div className={s.lookHead}>
            <h2 className={s.sectionTitle}>{t.write.lookTitle}</h2>
            <span className={s.note}>{t.write.lookNote}</span>
          </div>

          <div className={s.pills}>
            {themes.map((x) => (
              <button key={x.id} type="button" className={s.pill} aria-pressed={x.id === theme.id} onClick={() => setThemeId(x.id)}>
                {x.name[lang]}
              </button>
            ))}
          </div>

          {theme.tints && (
            <div className={s.tints}>
              <span className={s.note}>{t.write.color}</span>
              {theme.tints.map((c, i) => (
                <button key={c.hex} type="button" className={s.tint} aria-label={c.name} aria-pressed={i === tint} style={{ background: c.hex }} onClick={() => setTint(i)} />
              ))}
            </div>
          )}

          <PreviewPair draft={draft} onOpen={setPreview} />

          <button type="button" className={s.fullButton} onClick={(e) => (e.currentTarget.focus(), setPreview('before'))}>
            {t.write.fullPreview}
          </button>
        </section>

        <div className={s.bottom}>
          {error && (
            <span className={s.error} role="alert">
              {error}
            </span>
          )}
          <button type="submit" className={s.submit} disabled={busy}>
            {busy ? t.write.submitting : t.write.submit}
          </button>
          <span className={s.noteCenter}>{t.write.bottomNote}</span>
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
