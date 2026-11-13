// 빌드 후처리: 공유 미리보기가 다른 페이지들을 만든다.
// - 한국어: dist/t/{id}/index.html (테마 12개)
// - 영어: dist/en/index.html, dist/en/t/{id}/index.html (scripts/themes.json에 en이 있는 테마만)
// 편지는 # 뒤에 있어 서버도 크롤러도 볼 수 없으므로, 미리보기를 고를 단서는 경로뿐이다.
// dist/index.html을 그대로 복사하고 언어·제목·미리보기 태그만 바꾼다. 앱은 경로의 /en으로 화면 언어를 정하고 # 뒤를 읽어 연다.
// wrangler.toml에 SPA 폴백이 없으므로 열릴 수 있는 경로는 모두 실제 파일이어야 한다.
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

const TITLE = { ko: '할 말이 있는데 나중에 할게', en: 'Tell You Later' }
const DESCRIPTION = { ko: '정한 날짜 전에는 누구도 열 수 없는 편지', en: 'A letter nobody can open before the day you pick' }

/** pattern이 꼭 한 번 있어야 한다. 없으면 실패한다(조용히 기본 미리보기로 남지 않게). */
function replaceOnce(page, pattern, replace, what) {
  if (!pattern.test(page)) throw new Error(`dist/index.html에 ${what}가 없습니다.`)
  return page.replace(pattern, replace)
}

/** <meta {attr}="{key}" content="…">의 content를 바꾼다. */
function setMeta(page, attr, key, value) {
  return replaceOnce(page, new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), (_, a, b) => a + value + b, key)
}

const site = html.match(/<meta property="og:url" content="([^"]*)\/"/)?.[1]
if (site === undefined) throw new Error('dist/index.html에서 og:url을 찾지 못했습니다.')

function requireImage(path) {
  // 이미지가 없으면 미리보기가 빈칸으로 나온다. 테마를 추가했다면 npm run og-images로 만든다.
  if (!existsSync(join(dist, path))) throw new Error(`public/${path}가 없습니다. npm run og-images로 만드세요.`)
}

function page({ lang, title, path, image }) {
  requireImage(image)
  let out = html
  if (lang !== 'ko') {
    out = replaceOnce(out, /<html lang="ko">/, `<html lang="${lang}">`, '<html lang>')
    out = replaceOnce(out, /<title>[^<]*<\/title>/, `<title>${TITLE[lang]}</title>`, '<title>')
    out = setMeta(out, 'name', 'description', DESCRIPTION[lang])
    out = setMeta(out, 'property', 'og:description', DESCRIPTION[lang])
  }
  out = setMeta(out, 'property', 'og:title', title)
  // og:url은 크롤러가 정본 주소로 다시 읽기도 한다. 첫 페이지를 가리키면 기본 미리보기로 돌아갈 수 있다.
  out = setMeta(out, 'property', 'og:url', `${site}${path}`)
  out = setMeta(out, 'property', 'og:image', `${site}/${image}`)
  out = setMeta(out, 'name', 'twitter:image', `${site}/${image}`)
  const file = join(dist, ...path.split('/').filter(Boolean), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, out)
  return path
}

const pages = []
for (const { id, name, en } of themes) {
  pages.push(page({ lang: 'ko', title: `${TITLE.ko} · ${name}`, path: `/t/${id}/`, image: `og/${id}.png` }))
  if (en) pages.push(page({ lang: 'en', title: `${TITLE.en} · ${en.name}`, path: `/en/t/${id}/`, image: `og/en/${id}.png` }))
}
pages.push(page({ lang: 'en', title: TITLE.en, path: '/en/', image: 'og-en.png' }))
console.log(`theme pages: ${pages.length} → ${pages.join(' ')}`)
