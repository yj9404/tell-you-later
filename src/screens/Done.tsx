import { useCallback, useState } from 'react'
import { longDate, shareText } from '../lib/date.ts'
import { letterLink } from '../lib/route.ts'
import { useLang } from '../i18n/index.ts'
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
  const link = letterLink(location.origin, lang, created.draft.themeId, created.fragment)
  const canShare = typeof navigator.share === 'function'
  const message = () => shareText(created.draft.to, created.unlockAt, new Date())

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
          잠갔어요.
          <br />
          이제 링크를 보내세요
        </h1>
        <p className={s.lead}>{longDate(created.unlockAt)}에 열립니다. 그 전에는 누구도 열 수 없습니다.</p>
      </div>

      <div className={s.field}>
        <div className={s.sectionHead}>
          <label htmlFor="dLink" className={s.label}>
            편지 링크
          </label>
          <span className={s.count}>{link.length.toLocaleString('ko-KR')}자</span>
        </div>
        <textarea id="dLink" className={s.link} readOnly value={link} onFocus={(e) => e.target.select()} />
        {link.length > LINK_WARN_LENGTH && (
          <span className={s.error} role="alert">
            링크가 길어서 메신저에 따라 중간에 잘릴 수 있습니다. 보낸 뒤 링크가 열리는지 확인하거나, 편지를 줄여 다시 만들어 주세요.
          </span>
        )}
      </div>

      <div className={s.group10}>
        <div className={s.row}>
          {/* 기본은 문구와 링크를 함께 복사한다. 붙여 넣기만 하면 무슨 링크인지 알 수 있게. */}
          <button type="button" className={s.primary} onClick={() => copy('text')}>
            {copied === 'text' ? '복사했어요' : '복사'}
          </button>
          <button type="button" className={s.secondary} onClick={() => copy('link')}>
            {copied === 'link' ? '복사했어요' : '링크만 복사'}
          </button>
        </div>
        {copied === 'fail' && (
          <span className={s.error} role="alert">
            복사하지 못했습니다. 위 링크를 길게 눌러 직접 복사해 주세요.
          </span>
        )}
        {canShare && (
          <button type="button" className={s.secondary} onClick={share}>
            공유하기
          </button>
        )}
        <button type="button" className={s.secondary} onClick={onPreview}>
          받는 사람 화면 보기
        </button>
      </div>

      <div className={s.group10}>
        <button type="button" className={s.secondary} onClick={(e) => (e.currentTarget.focus(), setWatching(true))}>
          열리는 모습 마지막으로 보기
        </button>
        <span className={s.noteCenter}>이 화면을 떠나면 그날까지 누구도 볼 수 없습니다</span>
      </div>

      <div className={s.bottom}>
        <span className={s.noteCenter}>
          편지는 서버에 저장되지 않습니다. 이 링크가 편지 그 자체예요.
          <br />
          링크를 잃어버리면 다시 찾을 수 없어요.
        </span>
        <button type="button" className={s.textButton} onClick={onNew}>
          새 편지 쓰기
        </button>
      </div>

      {watching && <FullPreview draft={created.draft} start="after" onClose={stopWatching} />}
    </div>
  )
}
