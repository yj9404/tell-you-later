import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { encodeLink, NAME_MAX } from '../lib/codec.ts'
import { roundForTime, timeForRound } from '../lib/drand.ts'
import { loadFonts } from '../lib/fonts.ts'
import { lockLetter } from '../lib/timelock.ts'
import { THEMES } from '../themes/registry.ts'
import { FullPreview, PreviewPair, type Draft, type Side } from './Preview.tsx'
import { WhenSheet } from './WhenSheet.tsx'
import { resolveWhen, whenLabel, type When } from './when.ts'
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

/** 긴 이름은 글자를 줄여 한 줄에 들어가게 한다. 한글은 1, 그 밖의 글자는 0.6으로 센다. */
function nameScale(name: string, fits: number): string | undefined {
  const units = Array.from(name).reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 1 : 0.6), 0)
  return units > fits ? `${Math.max(0.5, fits / units).toFixed(2)}em` : undefined
}

/** 문장 안의 이름 입력칸. 글자 수에 맞춰 폭이 늘어난다(보이지 않는 같은 글자가 폭을 정한다). */
function NameInput({ label, value, placeholder, fits, onChange }: { label: string; value: string; placeholder: string; fits: number; onChange: (v: string) => void }) {
  return (
    <span className={s.auto} data-value={value || placeholder} style={{ fontSize: nameScale(value || placeholder, fits) }}>
      <input aria-label={label} value={value} placeholder={placeholder} maxLength={NAME_MAX} size={1} autoComplete="off" onChange={(e) => onChange(e.target.value)} />
    </span>
  )
}

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
      setError(err instanceof Error ? err.message : '링크를 만들지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form className={s.page} onSubmit={submit} noValidate>
        <div className={s.head}>
          <h1 className={s.sentence}>
            <NameInput label="받는 사람" value={to} placeholder="받는 사람" fits={7} onChange={setTo} />
            에게
            <br />
            할 말이 있는데
            <br />
            <button type="button" className={s.whenButton} aria-haspopup="dialog"
              onClick={(e) => {
                // Safari는 버튼을 눌러도 포커스를 주지 않는다. 시트를 닫을 때 여기로 돌아오게 미리 잡아 둔다.
                e.currentTarget.focus()
                setSheet(true)
              }}
            >
              {whenLabel(unlock, now)}
            </button>
            에
            <br />
            할게
          </h1>
          <div className={s.sender}>
            <NameInput label="보내는 사람" value={from} placeholder="보내는 사람" fits={12} onChange={setFrom} />
            <span>보냄</span>
          </div>
          <p className={s.note}>{inPast ? '정한 시각이 이미 지났습니다. 노란 날짜를 눌러 다시 정해 주세요.' : '노란 부분을 눌러서 바꾸세요. 이 문장이 받는 사람에게 먼저 보입니다.'}</p>
        </div>

        <div className={s.letter}>
          <div className={s.sectionHead}>
            <label htmlFor="wBody" className={s.sectionTitle}>
              그날 할 말
            </label>
            <span className={s.count}>
              {Array.from(body).length.toLocaleString('ko-KR')} / {BODY_MAX.toLocaleString('ko-KR')}
            </span>
          </div>
          <textarea
            id="wBody"
            className={s.textarea}
            value={body}
            placeholder={'여기에 써 주세요.\n그날이 되기 전에는 아무도 못 봅니다. 쓴 사람도요.\n\n한 줄을 비우면 말풍선이 나뉩니다.'}
            onChange={(e) => setBody(Array.from(e.target.value).slice(0, BODY_MAX).join(''))}
          />
        </div>

        <div className={s.look}>
          <span className={`${s.sectionTitle} ${s.sectionLine}`}>어떻게 도착할까요</span>

          <div className={s.pills}>
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={s.pill} aria-pressed={t.id === theme.id} onClick={() => setThemeId(t.id)}>
                {t.name}
              </button>
            ))}
          </div>

          {theme.tints && (
            <div className={s.tints}>
              <span className={s.tintLabel}>색</span>
              {theme.tints.map((c, i) => (
                <button key={c.hex} type="button" className={s.tint} aria-label={c.name} aria-pressed={i === tint} style={{ background: c.hex }} onClick={() => setTint(i)} />
              ))}
            </div>
          )}

          <PreviewPair draft={draft} onOpen={setPreview} />

          <p className={s.note}>이름과 날짜, 맨 위 문장은 링크를 받은 사람에게 바로 보입니다. 그날 할 말만 잠깁니다.</p>
        </div>

        <div className={s.bottom}>
          {error && (
            <span className={s.error} role="alert">
              {error}
            </span>
          )}
          <button type="submit" className={s.submit} disabled={busy}>
            {busy ? '잠그는 중…' : '잠그고 링크 만들기'}
          </button>
          <span className={s.noteCenter}>편지는 서버에 저장되지 않습니다. 링크를 잃어버리면 다시 찾을 수 없어요.</span>
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
