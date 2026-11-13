import { createContext, useContext } from 'react'
import { en } from './en.ts'
import { ko, type Strings } from './ko.ts'
import type { Lang } from './lang.ts'

export type { Lang } from './lang.ts'
export type { Strings } from './ko.ts'

const STRINGS: Record<Lang, Strings> = { ko, en }

/** 화면 언어. App이 경로(/en/)로 정해 맨 위에서 넣는다. */
export const LangContext = createContext<Lang>('ko')

export const useLang = (): Lang => useContext(LangContext)
export const useStrings = (): Strings => STRINGS[useLang()]
export const stringsFor = (lang: Lang): Strings => STRINGS[lang]
