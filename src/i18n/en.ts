// 영어 화면 문구. 말투는 한국어판 반말처럼 캐주얼하게.
// 날짜·시각은 받는 사람 기기의 지역 관습을 따른다(date-en.ts).
import type { ErrorCode } from '../lib/errors.ts'
import { enLocale, makeEnDates } from './date-en.ts'
import type { Strings } from './ko.ts'

const date = makeEnDates(enLocale(typeof navigator === 'undefined' ? [] : navigator.languages))
/** 영어 전용 표기(복수형 등)까지 포함한 날짜·숫자 함수. 테마 문구가 쓴다. */
export const enDates = date

const teaser = (unlock: Date, now: Date) => `Got something to tell you. Tell you on ${date.teaserDate(unlock, now)}.`
const callName = (to: string) => to.trim()

const openError: Record<ErrorCode, string> = {
  'not-yet': "The key isn't out yet. Check that your device clock is right, then try again in a bit.",
  network: "Couldn't get the key. Check your connection and try again.",
  unsupported: "This browser can't open the letter. Try another browser.",
  corrupt: "Couldn't open the letter. Part of the link may have been cut off.",
  'broken-link': "This link is broken, so the letter can't be opened.",
  'lock-failed': "Couldn't open the letter.",
  unknown: "Couldn't open the letter.",
}

export const en: Strings = {
  serviceName: 'Tell You Later',
  wordmark: { src: '/wordmark-en.svg', width: 112, height: 52 },
  otherLang: { label: '한국어', href: '/', lang: 'ko' },

  date,
  teaser,
  teaserParts: { line1: 'Got something to tell you.', before: 'Tell you on ', after: '.' },
  shareText: (to, unlock, now) => {
    const name = callName(to)
    return name ? `${name}, got something to tell you. Tell you on ${date.teaserDate(unlock, now)}.` : teaser(unlock, now)
  },
  callName,
  eventTitle: (from) => `${from.trim()} has something to tell you`,

  openError,
  lockError: "Couldn't create the link. Try again.",

  write: {
    title: ['Write a letter that', 'opens on the day you pick'],
    lead: 'Send the finished link. Nobody can open it before that day.',
    letter: 'Letter',
    to: 'To',
    toPlaceholder: 'Name or nickname',
    from: 'From',
    fromPlaceholder: 'Your name',
    when: 'Opens',
    whenValue: (at) => date.dateClock(at),
    body: 'Letter',
    bodyPlaceholder: 'Write what you want to say here.\n\nA blank line starts a new paragraph. Depending on the theme, that becomes a new bubble or scene.',
    lockNote: 'Only this part gets locked',
    teaserTitle: 'What they see when they open the link',
    teaserTo: (name) => `To ${name}`,
    teaserNote: 'Change the names and date above. What you write stays hidden until that day.',
    pastNote: 'That time has already passed. Tap Opens to pick a new one.',
    lookTitle: 'How should it arrive?',
    lookNote: "Preview what they'll see.",
    color: 'Color',
    fullPreview: 'Full-screen preview with my letter',
    submit: 'Lock it & get the link',
    submitting: 'Locking…',
    bottomNote: "Letters aren't stored on any server. Lose the link and it's gone for good.",
    needNames: 'Fill in both To and From.',
    needBody: 'Write what you want to tell them.',
    needFuture: 'The opening time has to be in the future. Pick a new date.',
  },

  when: {
    title: 'When should it open?',
    newyear: "New Year's, midnight",
    year: 'One year from now',
    custom: 'Pick a date',
    dayClock: (at) => date.longDate(at),
    date: 'Date',
    ampm: 'AM or PM',
    am: 'AM',
    pm: 'PM',
    ampmAfter: true,
    hour: 'Hour',
    minute: 'Minute',
    past: (at) => `That time already passed (${at}). Pick a later one.`,
    opens: (at, days) => `Opens ${at}. ${days > 0 ? `${date.plural(days, 'day')} to go.` : 'Opens later today.'}`,
    confirm: 'Set this time',
  },

  preview: {
    to: 'Recipient',
    from: 'Sender',
    example: "Your message shows up here on the day.\n\nThis is just sample text. Once you write your letter, it'll appear right here.\n\nNobody gets to see it before then.",
    before: 'Before',
    after: 'After',
    enlargeBefore: 'Enlarge the before screen',
    enlargeAfter: 'Enlarge the after screen',
    title: 'Preview',
    exampleNote: 'Sample text',
    tabs: 'Screen to show',
    tabBefore: 'Before',
    tabAfter: 'After',
    replay: 'Replay',
    close: 'Close preview',
  },

  done: {
    title: ['Locked.', 'Now send the link'],
    lead: (at) => `Opens ${date.longDate(at)}. Nobody can open it before then.`,
    link: 'Letter link',
    length: (n) => `${n} chars`,
    tooLong: 'This link is long, so some messengers might cut it off. After sending, check that it opens, or shorten your letter and make a new one.',
    copy: 'Copy',
    copyLink: 'Copy link only',
    copied: 'Copied',
    copyFailed: "Couldn't copy. Press and hold the link above to copy it yourself.",
    share: 'Share',
    view: "See what they'll see",
    watch: 'Watch it open one last time',
    watchNote: 'Once you leave this screen, nobody can see it until the day',
    bottomNote: ["Letters aren't stored on any server. This link is the letter.", "Lose the link and it's gone for good."],
    again: 'Write another',
  },

  broken: {
    title: ['This link is broken,', "so the letter won't open"],
    lead: "Looks like the link got cut off or changed. The letter lives only inside the link, so it can't be recovered here. Ask the sender for the link again.",
    write: 'Write your own letter',
  },

  calendar: {
    save: 'Save to calendar',
    google: 'Google Calendar',
    outlook: 'Outlook',
    ics: 'Download file (.ics)',
    blocked: 'Open this in Safari or Chrome to save it to your calendar',
    close: 'Close',
    icsNote: 'You can open it at this link on the day.',
  },

  locked: {
    retry: 'Try again',
    opening: 'Opening…',
    showAll: 'Show all',
    replay: 'Replay',
  },
}
