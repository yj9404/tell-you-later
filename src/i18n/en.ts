// 영어 화면 문구. 말투는 한국어판 반말처럼 캐주얼하게.
import type { ErrorCode } from '../lib/errors.ts'
import type { Strings } from './ko.ts'

export const en: Strings = {
  otherLang: { label: '한국어', href: '/', lang: 'ko' },

  callName: (to) => to.trim(),
  eventTitle: (from) => `${from.trim()} has something to tell you`,

  openError: {
    'not-yet': "The key isn't out yet. Check that your device clock is right, then try again in a bit.",
    network: "Couldn't get the key. Check your connection and try again.",
    unsupported: "This browser can't open the letter. Try another browser.",
    corrupt: "Couldn't open the letter. Part of the link may have been cut off.",
    'broken-link': "This link is broken, so the letter can't be opened.",
    'lock-failed': "Couldn't open the letter.",
    unknown: "Couldn't open the letter.",
  } satisfies Record<ErrorCode, string>,
  lockError: "Couldn't create the link. Please try again.",
}
