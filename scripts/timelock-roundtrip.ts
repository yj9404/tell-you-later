// 1분 뒤에 열리는 편지를 메인넷 quicknet으로 잠그고, 시각 전에는 안 열리고
// 시각 후에는 열리는지 확인한다. 실행: npm run timelock-check
import { roundForTime, timeForRound } from '../src/lib/drand.ts'
import { lockLetter, openLetter } from '../src/lib/timelock.ts'

const text = '할 말이 있는데 1분 뒤에 할게.\n한글, emoji 🎉, 줄바꿈 확인.'
const round = roundForTime(Date.now() + 60_000)
const unlockAt = timeForRound(round)
console.log(`라운드 ${round}, 개봉 시각 ${new Date(unlockAt).toLocaleTimeString()}`)

const cipher = await lockLetter(text, round)
console.log(`암호문 ${cipher.length}바이트`)

try {
  await openLetter(cipher, round)
  throw new Error('실패: 개봉 시각 전에 열렸다')
} catch (e) {
  if ((e as { kind?: string }).kind !== 'not-yet') throw e
  console.log('개봉 전 복호화 시도 → 거절됨 (정상)')
}

// 위 단계는 tlock-js의 기기 시계 검사에서 멈춘다. 시계를 조작한 사용자처럼
// Date.now를 미래로 돌려 그 검사를 통과시킨 뒤에도, drand가 미래 라운드의 서명을
// 내주지 않아 거절되는지 확인한다. 잠금의 실제 근거는 이쪽이다.
const realNow = Date.now
Date.now = () => realNow() + 365 * 24 * 60 * 60_000
try {
  await openLetter(cipher, round)
  throw new Error('실패: 기기 시계를 조작하자 개봉 시각 전에 열렸다')
} catch (e) {
  if ((e as { kind?: string }).kind !== 'not-yet') throw e
  console.log('시계를 1년 뒤로 조작한 복호화 시도 → drand가 거절함 (정상)')
} finally {
  Date.now = realNow
}

console.log('개봉 시각까지 대기…')
await new Promise((r) => setTimeout(r, unlockAt - Date.now() + 2000))

let opened = ''
for (let i = 0; i < 5 && !opened; i++) {
  try {
    opened = await openLetter(cipher, round)
  } catch (e) {
    if ((e as { kind?: string }).kind !== 'not-yet') throw e
    await new Promise((r) => setTimeout(r, 1500))
  }
}
if (opened !== text) throw new Error(`실패: 원문과 다르다 → ${opened}`)
console.log('개봉 후 복호화 → 원문과 일치 (성공)')
