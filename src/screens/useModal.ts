import { useEffect } from 'react'

/**
 * 시트·전체 화면 미리보기가 함께 쓰는 동작.
 * 떠 있는 동안 뒤 화면의 스크롤을 잠그고 Esc로 닫는다. 닫히면 뒤 화면의 스크롤 위치와
 * 포커스(열기 전에 눌렀던 버튼)를 그대로 돌려놓는다.
 */
export function useModal(onClose: () => void): void {
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const scrollY = window.scrollY
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      opener?.focus({ preventScroll: true })
      window.scrollTo(0, scrollY)
    }
  }, [onClose])
}
