import { useCallback, useEffect, useState } from 'react'
import { loadFonts } from './lib/fonts.ts'
import { Write, type Created, type Prefill } from './screens/Write.tsx'
import { Done } from './screens/Done.tsx'
import { View } from './screens/View.tsx'

const currentFragment = () => location.hash.replace(/^#/, '')

// 경로는 하나다. fragment가 없으면 쓰기(또는 방금 만든 링크), 있으면 받는 사람 화면.
export function App() {
  const [fragment, setFragment] = useState(currentFragment)
  const [created, setCreated] = useState<Created | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  useEffect(() => {
    loadFonts(['Noto+Sans+KR:wght@400;700;900'])
    const sync = () => setFragment(currentFragment())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const go = useCallback((next: string) => {
    history.pushState(null, '', next ? `#${next}` : location.pathname + location.search)
    setFragment(next)
    window.scrollTo(0, 0)
  }, [])

  const startWriting = useCallback(
    (fill: Prefill | null) => {
      setCreated(null)
      setPrefill(fill)
      go('')
    },
    [go],
  )

  if (fragment) {
    // key: 다른 링크로 바뀌면 상태를 새로 시작한다.
    return <View key={fragment} fragment={fragment} onWrite={startWriting} />
  }
  if (created) {
    return <Done created={created} onPreview={() => go(created.fragment)} onNew={() => startWriting(null)} />
  }
  return <Write prefill={prefill} onCreated={setCreated} />
}
