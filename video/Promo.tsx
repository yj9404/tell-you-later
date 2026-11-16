import type { ReactNode } from 'react'
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { SITE_LABEL } from './demo.ts'
import { DoneScreen, LockedScreen, OpenScreen, RECEIVE, WriteScreen } from './screens.tsx'
import './video.css'

// 앱과 같은 Google Fonts를 미리 받아 둔다. 글꼴 CSS가 붙기 전에 찍으면 대체 글꼴로 나온다.
const FONT_CSS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap',
]
const fontsHandle = delayRender('Google Fonts CSS')
Promise.all(
  FONT_CSS.map(
    (href) =>
      new Promise<void>((resolve) => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        link.onload = link.onerror = () => resolve()
        document.head.appendChild(link)
      }),
  ),
).then(() => continueRender(fontsHandle))

const YELLOW = '#FFD966'
const INK = '#111111'
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// 앱 화면의 기준 크기(src/screens/Preview.tsx와 같다)
const SCREEN_W = 390
const SCREEN_H = 844
const BEZEL = 14
const PHONE_SCALE = 1.12

// 장면 경계(초)
const SCENES = { done: 3.9, receive: 5, end: 11 }

export function Promo() {
  const { fps } = useVideoConfig()
  // 초 → 프레임. 3.9 * 30 같은 곱은 소수점 오차가 생기므로 반올림한다.
  const at = (s: number) => Math.round(s * fps)
  const wordmark = staticFile('wordmark.svg')
  return (
    <AbsoluteFill style={{ background: YELLOW, fontFamily: "'Noto Sans KR', sans-serif", color: INK }}>
      <Sequence name="Captions" durationInFrames={at(SCENES.end)} layout="none">
        <Caption from={0} to={at(SCENES.done)} title="지금 쓰고" sub="정한 날에야 열리는 편지" />
        <Caption from={at(SCENES.done)} to={at(SCENES.receive)} title="링크로 보내면" sub="가입도, 앱도 필요 없어요" />
        <Caption from={at(SCENES.receive)} to={at(SCENES.receive) + RECEIVE.openAt} title={'그날까지는\n아무도 못 열어요'} sub="보낸 사람도, 저희도요" />
        <Caption from={at(SCENES.receive) + RECEIVE.openAt} to={at(SCENES.end)} title={'그날이 되면\n열려요'} />
      </Sequence>

      <Phone exitAt={at(SCENES.end)}>
        <Sequence name="쓰기 · 여는 날" durationInFrames={at(SCENES.done)}>
          <WriteScreen wordmark={wordmark} />
        </Sequence>
        <Sequence name="링크 완성" from={at(SCENES.done)} durationInFrames={at(SCENES.receive) - at(SCENES.done)}>
          <DoneScreen />
        </Sequence>
        <Sequence name="잠김" from={at(SCENES.receive)} durationInFrames={RECEIVE.openAt + RECEIVE.fade}>
          <LockedScreen />
        </Sequence>
        <Sequence name="열림" from={at(SCENES.receive) + RECEIVE.openAt} durationInFrames={at(SCENES.end) - at(SCENES.receive) - RECEIVE.openAt}>
          <FadeIn frames={RECEIVE.fade}>
            <OpenScreen />
          </FadeIn>
        </Sequence>
      </Phone>

      <Sequence name="끝" from={at(SCENES.end)}>
        <EndCard wordmark={wordmark} />
      </Sequence>
    </AbsoluteFill>
  )
}

/** 오른쪽의 휴대폰. 안의 앱 화면은 390×844로 그린 뒤 키운다. */
function Phone({ exitAt, children }: { exitAt: number; children: ReactNode }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const w = (SCREEN_W + BEZEL * 2) * PHONE_SCALE
  const h = (SCREEN_H + BEZEL * 2) * PHONE_SCALE
  return (
    <div
      style={{
        position: 'absolute',
        left: width - 72 - w,
        top: (height - h) / 2,
        padding: BEZEL,
        borderRadius: 64,
        background: INK,
        boxShadow: '0 30px 80px rgba(0,0,0,0.22)',
        transformOrigin: 'top left',
        scale: String(PHONE_SCALE),
        translate: `0 ${interpolate(frame, [exitAt - 0.2 * fps, exitAt], [0, 120], { ...clamp, easing: Easing.in(Easing.cubic) })}px`,
        opacity: interpolate(frame, [exitAt - 0.2 * fps, exitAt], [1, 0], clamp),
      }}
    >
      {/* transform: 시트처럼 position: fixed인 요소가 영상 전체가 아니라 이 화면을 기준으로 놓이게 한다. */}
      <div
        className="tyl-video-screen"
        style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 50, overflow: 'hidden', background: '#FFFFFF', transform: 'translateZ(0)', ['--screen-h' as string]: `${SCREEN_H}px` }}
      >
        {children}
      </div>
    </div>
  )
}

function FadeIn({ frames, children }: { frames: number; children: ReactNode }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(frame, [0, frames], [0, 1], clamp),
        scale: String(interpolate(frame, [0, frames], [1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) })),
        background: '#FFFFFF',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

/** 왼쪽 설명 글. from~to 프레임 동안 보인다. */
function Caption({ from, to, title, sub }: { from: number; to: number; title: string; sub?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < from || frame >= to) return null
  const enter = interpolate(frame, [from, from + 0.3 * fps], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  const exit = interpolate(frame, [to - 0.15 * fps, to], [1, 0], clamp)
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 0,
        bottom: 0,
        width: 450,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 20,
        opacity: enter * exit,
        translate: `0 ${(1 - enter) * 24}px`,
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.22, letterSpacing: '-0.03em', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{title}</div>
      {sub && <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.4, opacity: 0.62, wordBreak: 'keep-all' }}>{sub}</div>}
    </div>
  )
}

function EndCard({ wordmark }: { wordmark: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill
      style={{
        background: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 44,
        opacity: interpolate(frame, [0, 0.2 * fps], [0, 1], clamp),
      }}
    >
      <Img src={wordmark} style={{ width: 600, scale: String(interpolate(frame, [0, 0.5 * fps], [0.94, 1], { ...clamp, easing: Easing.out(Easing.cubic) })) }} />
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.01em' }}>{SITE_LABEL}</div>
    </AbsoluteFill>
  )
}
