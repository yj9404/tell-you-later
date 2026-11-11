import type { ComponentType } from 'react'

export interface Tint {
  hex: string
  name: string
}


/** 테마 컴포넌트가 받는 편지 정보. 본문은 여기 없다(열린 뒤에만 따로 전달). */
export interface LetterInfo {
  to: string
  from: string
  /** 색을 고르는 테마에서 고른 색. 그 외에는 null */
  tint: string | null
  createdAt: Date
  unlockAt: Date
  /** 링크 해시. 같은 링크는 항상 같은 값(의사난수 시드용) */
  hash: string
  /** 암호문 바이트 수 */
  cipherLength: number
}

/** waiting: 개봉 전 / opening: 열쇠를 받아 푸는 중 / error: 실패 */
export type LockStatus = 'waiting' | 'opening' | 'error'

export interface LockedProps {
  letter: LetterInfo
  /** 1초마다 갱신되는 현재 시각(ms) */
  now: number
  status: LockStatus
  /** status가 error일 때의 원인 */
  error?: string
  onRetry: () => void
  onSaveCalendar: () => void
  onWrite: () => void
}

export interface OpenProps {
  letter: LetterInfo
  text: string
  /** 처음 여는 링크이고 모션을 줄이지 않은 경우에만 true */
  autoplay: boolean
  /** 모션 줄이기 설정. true면 다시 보기도 연출 없이 보여준다 */
  reducedMotion: boolean
  onReply: () => void
}

/** 쓰기 화면의 테마 타일 */
export interface ThemeTile {
  /** 없으면 고른 색 */
  bg?: string
  /** 없으면 고른 색 */
  markBg?: string
  markW: string
  markH: string
  markRadius: string
}

/** 쓰기 화면의 미리보기 상자 */
export interface ThemePreview {
  /** 없으면 고른 색 */
  bg?: string
  fg: string
  font: string
  /** 'TINT'면 고른 색 */
  bubbleBg: string
  bubbleFg: string
  radius: string
  pad: string
  size: string
}

export interface Theme {
  id: string
  /** 링크에 들어가는 번호. 한번 배포하면 바꾸지 않는다 */
  code: number
  name: string
  /** 색을 고르는 테마만. 링크에는 인덱스가 들어가므로 한번 배포하면 순서를 바꾸지 않는다 */
  tints: readonly Tint[] | null
  /** Google Fonts css2의 family 값. 이 테마를 열 때만 불러온다 */
  fonts: readonly string[]
  tile: ThemeTile
  preview: ThemePreview
  Locked: ComponentType<LockedProps>
  Open: ComponentType<OpenProps>
}
