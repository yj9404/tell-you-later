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
