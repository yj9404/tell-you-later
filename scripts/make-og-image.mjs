// 공유 미리보기 이미지(1200×630)를 만든다.
// - public/og.png, public/og-en.png: 사이트 공통. design/og.svg, og-en.svg를 그대로 그린다(글자를 도형으로 바꿔 둔 원본이라 글꼴과 무관).
// - public/og/{테마id}.png, public/og/en/{테마id}.png: 테마별. 영어는 scripts/themes.json에 en이 있는 테마만.
//   테마 대표색 바탕에 왼쪽은 로고와 "{테마}로 도착"("Arrives as a DM"), 오른쪽은 그 테마의 잠김 화면을
//   예시 데이터로 그린 휴대폰 화면(scripts/og/compose.html, frame.tsx). 색·문구는 scripts/themes.json의 og 값.
//   시각·이름이 고정이고 움직임을 멈춰 다시 돌려도 같은 그림이 나온다.
// 문구나 테마 화면을 바꾸면 다시 돌린다.
// 실행: npm run og-images   (Microsoft Edge 또는 Chrome 필요. 다른 위치면 BROWSER 환경 변수로 지정)
//
// 브라우저의 --screenshot 옵션은 headless 창 테두리만큼 화면이 줄어 아래·오른쪽이 잘려 찍힌다.
// 그래서 DevTools 프로토콜로 화면 크기를 1200×630으로 정확히 고정하고 찍는다(추가 의존성 없이 Node 내장 WebSocket 사용).
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const themes = JSON.parse(readFileSync(join(root, 'scripts', 'themes.json'), 'utf8'))
const W = 1200
const H = 630

const pf = process.env.ProgramFiles ?? 'C:/Program Files'
const pf86 = process.env['ProgramFiles(x86)'] ?? 'C:/Program Files (x86)'
const browserPath = [
  process.env.BROWSER,
  join(pf86, 'Microsoft/Edge/Application/msedge.exe'),
  join(pf, 'Microsoft/Edge/Application/msedge.exe'),
  join(pf, 'Google/Chrome/Application/chrome.exe'),
  join(pf86, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p))
if (!browserPath) throw new Error('Microsoft Edge 또는 Chrome이 필요합니다. BROWSER 환경 변수로 경로를 지정할 수 있습니다.')

/** headless 브라우저를 띄우고 첫 탭에 DevTools로 붙는다. 평소 쓰는 프로필과 섞이지 않게 임시 프로필을 쓴다. */
async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'tyl-og-'))
  const child = spawn(browserPath, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--lang=ko-KR', '--disable-lcd-text', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
  const portFile = join(profile, 'DevToolsActivePort')
  for (let i = 0; !existsSync(portFile) || !readFileSync(portFile, 'utf8').includes('\n'); i++) {
    if (i > 100) throw new Error('브라우저가 DevTools 포트를 열지 않았습니다.')
    await sleep(100)
  }
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => ((ws.onopen = resolve), (ws.onerror = reject)))

  let nextId = 0
  const pending = new Map()
  const listeners = new Map()
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data)
    if (msg.id !== undefined) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result)
    } else listeners.get(msg.method)?.(msg.params)
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  const once = (method) => new Promise((resolve) => listeners.set(method, (p) => (listeners.delete(method), resolve(p))))

  await send('Page.enable')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

  return {
    /**
     * width×height 화면(배율 scale)으로 url을 열고, ready(페이지 안에서 평가할 Promise 식)가 끝나면 PNG를 돌려준다.
     * 같은 그림이 나오도록 소수 배율 변환 없이 정수 배율로만 찍는다.
     */
    async capture(url, { width, height, scale = 1 }, ready = 'document.fonts.ready') {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
      const loaded = once('Page.loadEventFired')
      await send('Page.navigate', { url })
      await loaded
      const r = await send('Runtime.evaluate', { expression: ready, awaitPromise: true, timeout: 30000 })
      if (r.exceptionDetails) throw new Error(`${url}: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`)
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } })
      return Buffer.from(data, 'base64')
    },
    /** 지금 열린 페이지에서 Promise 식을 평가해 값을 돌려준다. */
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 30000 })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
      return r.result.value
    },
    /** 시간대를 고정한다. 영어 잠김 화면에는 시간대 약칭이 나오므로 어느 컴퓨터에서 돌려도 같은 글이 나오게 한다. */
    async timezone(timezoneId) {
      await send('Emulation.setTimezoneOverride', { timezoneId })
    },
    async close() {
      await send('Browser.close').catch(() => {})
      ws.close()
      await new Promise((r) => (child.exitCode !== null ? r() : child.on('exit', r)))
      rmSync(profile, { recursive: true, force: true })
    },
  }
}

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`

// 같은 화면이어도 한글 글자의 안티앨리어싱이 실행마다 드물게 다르게 나온다(지금까지 본 것은 0.4% 이하의 픽셀, 밝기 차 66 이하).
// 그 정도는 그림이 바뀐 것이 아니므로 기존 파일을 그대로 둔다. 글자가 바뀌면 밝기 차가 200을 넘고,
// 바탕색이 바뀌면 대부분의 픽셀이 달라지므로 둘 중 하나라도 넘으면 새로 쓴다.
const SAME = { maxDelta: 96, changedRatio: 0.01 }
// 두 PNG를 비교해 { max: 가장 큰 채널 차(0–255), ratio: 달라진 픽셀 비율 }. 크기가 다르면 완전히 다른 것으로 본다.
const compare = (a, b) => `(async () => {
  const pixels = async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d')
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height).data
  }
  const [p, q] = await Promise.all([pixels(${JSON.stringify(dataUrl(a))}), pixels(${JSON.stringify(dataUrl(b))})])
  if (p.length !== q.length) return { max: 255, ratio: 1 }
  let max = 0
  let changed = 0
  for (let i = 0; i < p.length; i += 4) {
    const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]), Math.abs(p[i + 3] - q[i + 3]))
    if (d) changed++
    if (d > max) max = d
  }
  return { max, ratio: changed / (p.length / 4) }
})()`

/** 기존 파일과 눈에 띄게 다를 때만 쓴다. 다시 돌려도 파일이 바뀌지 않게 한다. */
async function save(out, png) {
  if (existsSync(out)) {
    const { max, ratio } = await browser.evaluate(compare(readFileSync(out), png))
    if (max <= SAME.maxDelta && ratio < SAME.changedRatio) {
      console.log(`same  ${out}`)
      return
    }
  }
  writeFileSync(out, png)
  console.log(`saved ${out}`)
}

// frame.html은 글꼴·그림을 다 받으면 <html data-ready="1">을 단다.
const FRAME_READY = `new Promise((resolve, reject) => {
  const start = Date.now()
  const poll = () => {
    if (document.documentElement.dataset.ready === '1') return resolve()
    if (Date.now() - start > 25000) return reject(new Error('테마 화면이 준비되지 않았습니다.'))
    setTimeout(poll, 50)
  }
  poll()
})`
const OG = { width: W, height: H }
// 휴대폰 화면(디자인 기준 390×844). 2배율로 찍어 두어야 줄여 넣어도 글자가 뭉개지지 않는다.
const PHONE = { width: 390, height: 844, scale: 2 }

const browser = await launch()
// 테마 화면은 앱 코드(TSX·CSS 모듈)를 그대로 쓰므로 Vite 개발 서버로 연다.
const server = await createServer({ root, logLevel: 'warn', server: { port: 5199, hmr: false } })
try {
  await save(join(root, 'public', 'og.png'), await browser.capture(pathToFileURL(join(root, 'design', 'og.svg')).href, OG))
  await save(join(root, 'public', 'og-en.png'), await browser.capture(pathToFileURL(join(root, 'design', 'og-en.svg')).href, OG))

  await server.listen()
  const base = server.resolvedUrls.local[0].replace(/\/$/, '')
  mkdirSync(join(root, 'public', 'og'), { recursive: true })
  for (const { id, og } of themes) {
    const screen = await browser.capture(`${base}/scripts/og/frame.html?theme=${id}`, PHONE, FRAME_READY)
    const src = dataUrl(screen)
    await save(join(root, 'public', 'og', `${id}.png`), await browser.capture(`${base}/scripts/og/compose.html`, OG, `compose(${JSON.stringify(src)}, ${JSON.stringify(og)})`))
  }

  // 영어: 미국 서부 시간으로 그린다(잠김 화면의 "12:00 AM PST").
  await browser.timezone('America/Los_Angeles')
  mkdirSync(join(root, 'public', 'og', 'en'), { recursive: true })
  for (const { id, og, en } of themes.filter((t) => t.en)) {
    const screen = await browser.capture(`${base}/scripts/og/frame.html?theme=${id}&lang=en`, PHONE, FRAME_READY)
    // 영어판 그림이 다른 테마(greet)는 en.bg로 바탕색을 따로 정할 수 있다.
    const theme = { bg: en.bg ?? og.bg, label: en.label, lang: 'en' }
    await save(join(root, 'public', 'og', 'en', `${id}.png`), await browser.capture(`${base}/scripts/og/compose.html`, OG, `compose(${JSON.stringify(dataUrl(screen))}, ${JSON.stringify(theme)})`))
  }
} finally {
  await server.close()
  await browser.close()
}
