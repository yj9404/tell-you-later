// 빌드 후처리: 테마마다 공유 미리보기가 다른 페이지 dist/t/{id}/index.html을 만든다.
// 편지는 # 뒤에 있어 서버도 크롤러도 볼 수 없으므로, 미리보기를 고를 단서는 경로(/t/{id}/)뿐이다.
// dist/index.html을 그대로 복사하고 미리보기 태그만 바꾼다. 앱은 경로와 상관없이 # 뒤를 읽어 연다.
// 실행: npm run build (vite build 뒤에 자동으로 돈다)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const themes = JSON.parse(readFileSync(join(root, 'scripts', 'themes.json'), 'utf8'))
const html = readFileSync(join(dist, 'index.html'), 'utf8')

// /t/{id}/에서도 같은 파일을 불러오려면 자산 경로가 사이트 기준 절대 경로여야 한다.
const relative = html.match(/(?:src|href)="(?!\/|https?:|data:)[^"]+"/g)
if (relative) throw new Error(`상대 경로 자산이 있어 /t/{id}/에서 깨집니다: ${relative.join(', ')}`)

const TITLE = '할 말이 있는데 나중에 할게'

/** <meta {attr}="{key}" content="…">의 content를 바꾼다. 태그가 없으면 실패한다(조용히 기본 미리보기로 남지 않게). */
function setMeta(page, attr, key, value) {
  const tag = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
  if (!tag.test(page)) throw new Error(`dist/index.html에 ${key}가 없습니다.`)
  return page.replace(tag, (_, a, b) => a + value + b)
}

const site = html.match(/<meta property="og:url" content="([^"]*)\/"/)?.[1]
if (site === undefined) throw new Error('dist/index.html에서 og:url을 찾지 못했습니다.')

for (const { id, name } of themes) {
  // 이미지가 없으면 미리보기가 빈칸으로 나온다. 테마를 추가했다면 npm run og-images로 만든다.
  if (!existsSync(join(dist, 'og', `${id}.png`))) throw new Error(`public/og/${id}.png가 없습니다. npm run og-images로 만드세요.`)
  let page = html
  page = setMeta(page, 'property', 'og:title', `${TITLE} · ${name}`)
  // og:url은 크롤러가 정본 주소로 다시 읽기도 한다. 첫 페이지를 가리키면 기본 미리보기로 돌아갈 수 있다.
  page = setMeta(page, 'property', 'og:url', `${site}/t/${id}/`)
  page = setMeta(page, 'property', 'og:image', `${site}/og/${id}.png`)
  page = setMeta(page, 'name', 'twitter:image', `${site}/og/${id}.png`)
  const out = join(dist, 't', id, 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, page)
}
console.log(`theme pages: ${themes.length} → dist/t/{id}/index.html`)
