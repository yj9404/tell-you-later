import { useCallback, useEffect, useState } from 'react'
import { loadFonts } from './lib/fonts.ts'
import { Write, type Created, type Prefill } from './screens/Write.tsx'
import { Done } from './screens/Done.tsx'
import { View } from './screens/View.tsx'
import { fragmentOf, homePath, langOf } from './lib/route.ts'
import { LangContext } from './i18n/index.ts'

const currentFragment = () => fragmentOf(location.href)

// 화면 언어는 경로(/en/)로 정한다. 앱 안에서 옮겨 다녀도 언어 경로는 그대로라 처음 한 번만 읽는다.
const lang = langOf(location.pathname)

// 화면은 # 뒤로만 정한다. 비어 있으면 쓰기(또는 방금 만든 링크), 있으면 받는 사람 화면.
// /t/{테마}/ 경로는 공유 미리보기용이라 여기서는 보지 않는다(src/lib/route.ts).
export function App() {
  return (
    <LangContext.Provider value={lang}>
      <Screens />
    </LangContext.Provider>
  )
}

function Screens() {
  const [fragment, setFragment] = useState(currentFragment)
  const [created, setCreated] = useState<Created | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  useEffect(() => {
    document.documentElement.lang = lang
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
    history.pushState(null, '', next ? `#${next}` : homePath(location.pathname) + location.search)
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
