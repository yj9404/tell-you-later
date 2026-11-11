// 현재 링크 형식으로 만든 편지와, 그 편지를 여는 drand 서명을 테스트 픽스처로 저장한다.
// 형식을 바꾼 뒤에도 옛 링크가 열리는지 확인하는 기준이므로, 이미 저장된 픽스처는 덮어쓰지 않는다.
// 실행: node scripts/make-fixture.ts v1   (→ src/lib/fixtures/v1.json)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { encodeLink } from '../src/lib/codec.ts'
import { drandClient, roundForTime, timeForRound } from '../src/lib/drand.ts'
import { lockLetter } from '../src/lib/timelock.ts'

const name = process.argv[2]
if (!name) throw new Error('픽스처 이름을 주세요. 예: v1')
const path = `src/lib/fixtures/${name}.json`
if (existsSync(path)) throw new Error(`${path}가 이미 있습니다. 옛 형식의 기준이므로 덮어쓰지 않습니다.`)

const text = '지민아, 이걸 쓰는 지금은 11월이야 🍂\n너는 아직 고민 중이고\n\n나는 네 편이야. 새해 복 많이 받아!'
const round = roundForTime(Date.now() + 6000)
const body = await lockLetter(text, round)
const link = encodeLink({ theme: 1, tint: 0, to: '지민', from: '영진 🎄', round, created: Math.floor(Date.now() / 60_000), body })

await new Promise((r) => setTimeout(r, timeForRound(round) - Date.now() + 3000))
const beacon = await drandClient.get(round)

mkdirSync('src/lib/fixtures', { recursive: true })
writeFileSync(path, JSON.stringify({ link, text, to: '지민', from: '영진 🎄', beacon }, null, 2) + '\n')
console.log(`${path} 저장: 라운드 ${round}, 링크 ${link.length}자`)
