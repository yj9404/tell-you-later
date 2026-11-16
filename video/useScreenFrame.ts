import { useLayoutEffect, useRef } from 'react'
import { useCurrentFrame, useDelayRender, useVideoConfig } from 'remotion'

/**
 * 화면을 frame 시점의 상태로 맞추는 한 걸음. 할 일이 있으면 DOM을 조작하고 그 동작이 "원래" 일어날 프레임을 돌려준다.
 * 할 일이 없으면 null. 매번 지금 상태를 보고 판단해야 한다(중간 프레임부터 그려도 같은 화면이 나오게).
 */
export type Step = (root: HTMLElement, frame: number) => number | null

const nextPaint = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

/**
 * 앱 화면을 그대로 영상에 넣기 위한 장치.
 *
 * 앱 컴포넌트는 CSS 애니메이션·트랜지션과 자체 상태로 움직이지만 Remotion은 프레임마다 정지 화면을 찍는다.
 * 그래서 프레임마다 (1) step으로 상태를 맞추고 (2) 화면 안의 모든 애니메이션을 멈춘 뒤
 * 시작 시점부터 지난 시간으로 옮기고 (3) 글꼴·이미지가 다 불러와질 때까지 촬영을 미룬다.
 * 앱 코드는 고치지 않는다.
 *
 * 돌려주는 key를 화면 컴포넌트에 달아야 한다. Studio에서 뒤로 감으면 처음부터 다시 그리기 위해서다.
 */
export function useScreenFrame(step?: Step) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { delayRender, continueRender } = useDelayRender()
  const ref = useRef<HTMLDivElement>(null)
  const starts = useRef(new WeakMap<Animation, number>())
  const last = useRef(-1)
  const mount = useRef(0)

  // 앞으로만 진행하는 상태(시트 열기 등)는 되감을 수 없으므로 새로 그린다. 렌더링은 앞으로만 가서 여기에 걸리지 않는다.
  if (frame < last.current) mount.current++
  last.current = frame

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const handle = delayRender(`screen frame ${frame}`)
    let live = true

    // 처음 보는 애니메이션의 시작 프레임을 at으로 기록한다.
    const claim = (at: number) => {
      for (const a of root.getAnimations({ subtree: true })) if (!starts.current.has(a)) starts.current.set(a, at)
    }

    void (async () => {
      claim(0)
      for (let i = 0; i < 30 && live; i++) {
        const at = step?.(root, frame) ?? null
        if (at === null) break
        await nextPaint()
        claim(at)
      }
      claim(0)
      await Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})))
      // 새 글자가 그려지면 그 글자가 든 글꼴 조각을 이때 받기 시작한다.
      await nextPaint()
      await document.fonts.ready
      if (!live) return
      for (const a of root.getAnimations({ subtree: true })) {
        a.pause()
        a.currentTime = (Math.max(0, frame - (starts.current.get(a) ?? 0)) / fps) * 1000
      }
      continueRender(handle)
    })()

    return () => {
      live = false
      continueRender(handle)
    }
  }, [frame, fps, step, delayRender, continueRender])

  return { ref, key: mount.current }
}
