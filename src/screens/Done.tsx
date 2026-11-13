import { useCallback, useState } from 'react'
import { letterLink } from '../lib/route.ts'
import { useLang, useStrings } from '../i18n/index.ts'
import { FullPreview } from './Preview.tsx'
import type { Created } from './Write.tsx'
import s from './screens.module.css'

// 이 길이를 넘으면 경고한다.
// TODO(출시 전): 카카오톡에서 실제로 링크가 잘리는 길이를 기기로 시험해서 이 값을 정한다. 지금은 임시값이다.
export const LINK_WARN_LENGTH = 2000

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 인앱 브라우저 등 clipboard API가 막힌 곳
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

export function Done({ created, onPreview, onNew }: { created: Created; onPreview: () => void; onNew: () => void }) {
  const [copied, setCopied] = useState<'' | 'link' | 'text' | 'fail'>('')
  const [watching, setWatching] = useState(false)
  const stopWatching = useCallback(() => setWatching(false), [])
  const lang = useLang()
  const t = useStrings()
  const link = letterLink(location.origin, lang, created.draft.themeId, created.fragment)
  const canShare = typeof navigator.share === 'function'
  const message = () => t.shareText(created.draft.to, created.unlockAt, new Date())

  async function copy(what: 'link' | 'text') {
    const text = what === 'link' ? link : `${message()}\n${link}`
    setCopied((await copyText(text)) ? what : 'fail')
  }

  async function share() {
    try {
      await navigator.share({ text: message(), url: link })
    } catch {
      // 사용자가 공유 창을 닫은 경우
    }
  }

  return (
    <div className={s.page}>
      <div className={s.head}>
        <h1 className={s.title}>
          {t.done.title[0]}
          <br />
          {t.done.title[1]}
        </h1>
        <p className={s.lead}>{t.done.lead(created.unlockAt)}</p>
      </div>

      <div className={s.field}>
        <div className={s.sectionHead}>
          <label htmlFor="dLink" className={s.label}>
            {t.done.link}
          </label>
          <span className={s.count}>{t.done.length(t.date.number(link.length))}</span>
        </div>
        <textarea id="dLink" className={s.link} readOnly value={link} onFocus={(e) => e.target.select()} />
        {link.length > LINK_WARN_LENGTH && (
          <span className={s.error} role="alert">
            {t.done.tooLong}
          </span>
        )}
      </div>

      <div className={s.group10}>
        <div className={s.row}>
          {/* 기본은 문구와 링크를 함께 복사한다. 붙여 넣기만 하면 무슨 링크인지 알 수 있게. */}
          <button type="button" className={s.primary} onClick={() => copy('text')}>
            {copied === 'text' ? t.done.copied : t.done.copy}
          </button>
          <button type="button" className={s.secondary} onClick={() => copy('link')}>
            {copied === 'link' ? t.done.copied : t.done.copyLink}
          </button>
        </div>
        {copied === 'fail' && (
          <span className={s.error} role="alert">
            {t.done.copyFailed}
          </span>
        )}
        {canShare && (
          <button type="button" className={s.secondary} onClick={share}>
            {t.done.share}
          </button>
        )}
        <button type="button" className={s.secondary} onClick={onPreview}>
          {t.done.view}
        </button>
      </div>

      <div className={s.group10}>
        <button type="button" className={s.secondary} onClick={(e) => (e.currentTarget.focus(), setWatching(true))}>
          {t.done.watch}
        </button>
        <span className={s.noteCenter}>{t.done.watchNote}</span>
      </div>

      <div className={s.bottom}>
        <span className={s.noteCenter}>
          {t.done.bottomNote[0]}
          <br />
          {t.done.bottomNote[1]}
        </span>
        <button type="button" className={s.textButton} onClick={onNew}>
          {t.done.again}
        </button>
      </div>

      {watching && <FullPreview draft={created.draft} start="after" onClose={stopWatching} />}
    </div>
  )
}
