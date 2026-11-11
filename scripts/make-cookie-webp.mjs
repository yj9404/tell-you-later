// assets/의 포춘쿠키 PNG 원본을 가로 600px WebP(투명 배경 유지)로 줄여 테마 폴더에 넣는다.
// 앱은 이 WebP만 불러오므로 원본 PNG는 번들에 들어가지 않는다.
// sharp는 이 스크립트에서만 쓰므로 package.json에 넣지 않았다:
//   npm i --no-save sharp && node scripts/make-cookie-webp.mjs
import { statSync } from 'node:fs'
import sharp from 'sharp'

const names = ['fortune-cookie', 'cookie-left', 'cookie-right', 'cookie-slip']
let total = 0
for (const name of names) {
  const out = `src/themes/cookie/${name}.webp`
  await sharp(`assets/${name}.png`).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(out)
  const { width, height, hasAlpha } = await sharp(out).metadata()
  const size = statSync(out).size
  total += size
  console.log(`${out}: ${width}x${height}, alpha=${hasAlpha}, ${(size / 1024).toFixed(1)}KB`)
}
console.log(`합계 ${(total / 1024).toFixed(1)}KB`)
