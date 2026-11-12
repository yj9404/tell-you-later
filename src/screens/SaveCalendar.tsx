import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
  androidIntentUrl,
  detectPlatform,
  eventTitle,
  googleCalendarUrl,
  icsDataUrl,
  isInAppBrowser,
  outlookCalendarUrl,
  type CalendarEvent,
} from '../lib/calendar.ts'
import { buildIcs, downloadIcs } from '../lib/ics.ts'
import { useModal } from './useModal.ts'
import c from './calendar.module.css'

// 이 시간 안에 페이지가 가려지지(새 탭·다른 앱·시스템 시트) 않으면 인앱 브라우저가 막은 것으로 본다.
const LEAVE_WAIT_MS = 1500
const MENU_W = 220

interface Source {
  from: string
  unlockAt: Date
  uid: string
}

/**
 * 캘린더 저장 버튼의 동작. 폰에서는 파일을 받는 대신 캘린더를 바로 연다.
 * - Android: 캘린더 앱 인텐트(안 되면 브라우저가 구글 캘린더 웹으로 넘김). 일반 Chrome·인앱 모두 같은 방식
 * - iOS: data:text/calendar로 이동(실기기 확인용 1단계)
 * - 데스크톱: 구글 캘린더 / Outlook / .ics 파일 메뉴
 * iOS·데스크톱의 인앱 브라우저에서 막히면 외부 브라우저로 열라고 안내한다.
 * Android는 인앱 브라우저가 캘린더를 열었다 닫아도 실패로 보이는 오탐이 있어 판정·안내를 하지 않는다.
 */
export function useSaveCalendar(src: Source): { onSaveCalendar: (e: MouseEvent<HTMLElement>) => void; overlay: ReactNode } {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [blocked, setBlocked] = useState(false)

  // 링크는 누른 순간의 주소를 쓴다.
  const title = eventTitle(src.from)
  const event = (): CalendarEvent => ({ title, start: src.unlockAt, link: location.href })
  const ics = () => buildIcs({ title, unlockAt: src.unlockAt, link: location.href, uid: src.uid })

  /** action은 클릭 처리 안에서 동기로 불러야 팝업 차단에 걸리지 않는다. false면 바로 실패. */
  const run = (action: () => boolean) => {
    setBlocked(false)
    const inApp = isInAppBrowser(navigator.userAgent)
    const left = inApp ? leftPageWithin(LEAVE_WAIT_MS) : null
    if (!action()) return setBlocked(true)
    void left?.then((ok) => ok || setBlocked(true))
  }

  const onSaveCalendar = (e: MouseEvent<HTMLElement>) => {
    switch (detectPlatform(navigator.userAgent, navigator.maxTouchPoints)) {
      case 'android':
        location.href = androidIntentUrl(event())
        return
      case 'ios':
        return run(() => {
          location.href = icsDataUrl(ics())
          return true
        })
      case 'desktop':
        return setAnchor(e.currentTarget.getBoundingClientRect())
    }
  }

  const closeMenu = useCallback(() => setAnchor(null), [])
  const pick = (action: () => boolean) => {
    closeMenu()
    run(action)
  }

  const overlay = (
    <>
      {anchor && (
        <Menu
          anchor={anchor}
          onClose={closeMenu}
          items={[
            ['구글 캘린더', () => pick(() => openTab(googleCalendarUrl(event())))],
            ['Outlook', () => pick(() => openTab(outlookCalendarUrl(event())))],
            ['파일로 받기(.ics)', () => pick(() => (downloadIcs(ics()), true))],
          ]}
        />
      )}
      {blocked && (
        <div role="alert" className={c.notice}>
          <span>Safari/Chrome에서 열면 캘린더에 저장할 수 있어요</span>
          <button type="button" className={c.noticeClose} onClick={() => setBlocked(false)}>
            닫기
          </button>
        </div>
      )}
    </>
  )

  return { onSaveCalendar, overlay }
}

/** 새 탭으로 연다. 팝업이 막히면 일반 브라우저에서는 같은 탭으로, 인앱 브라우저에서는 실패로 돌린다. */
function openTab(url: string): boolean {
  const w = window.open(url, '_blank')
  if (w) {
    w.opener = null
    return true
  }
  if (isInAppBrowser(navigator.userAgent)) return false
  location.assign(url)
  return true
}

/** ms 안에 페이지가 가려지거나 떠나면 true. 동작을 일으키기 전에 불러야 한다. */
function leftPageWithin(ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const onVisibility = () => document.visibilityState === 'hidden' && done(true)
    const onLeave = () => done(true)
    const timer = setTimeout(() => done(false), ms)
    function done(left: boolean) {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('blur', onLeave)
      resolve(left)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onLeave)
    window.addEventListener('blur', onLeave)
  })
}

function Menu({ anchor, items, onClose }: { anchor: DOMRect; items: [string, () => void][]; onClose: () => void }) {
  useModal(onClose)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.querySelector('button')?.focus(), [])

  // 버튼 아래가 좁으면 위로 띄운다. 가로는 버튼 가운데에 맞추되 화면 밖으로 나가지 않게 한다.
  const below = anchor.bottom < window.innerHeight * 0.6
  const left = Math.max(16, Math.min(anchor.left + anchor.width / 2 - MENU_W / 2, window.innerWidth - MENU_W - 16))
  const pos = below ? { top: anchor.bottom + 8 } : { bottom: window.innerHeight - anchor.top + 8 }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const buttons = [...(ref.current?.querySelectorAll('button') ?? [])]
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    buttons[(i + step + buttons.length) % buttons.length]?.focus()
  }

  return (
    <div className={c.backdrop} onClick={onClose}>
      <div
        ref={ref}
        role="menu"
        aria-label="캘린더에 저장"
        className={c.menu}
        style={{ width: MENU_W, left, ...pos }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        {items.map(([label, onPick]) => (
          <button key={label} type="button" role="menuitem" className={c.item} onClick={onPick}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
