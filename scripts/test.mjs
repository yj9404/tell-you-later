// vitest 실행기. Windows에서 드라이브 문자가 소문자인 경로(c:\…, VS Code 터미널의 기본값)로 실행하면
// vitest 런타임이 c:/…와 C:/… 두 경로로 따로 불려 두 벌이 되고, 모든 테스트가
// "Cannot read properties of undefined (reading 'config')"로 실패한다.
// 드라이브 문자를 대문자로 맞춘 뒤 vitest를 불러 한 벌만 쓰게 한다. 인자는 그대로 넘어간다.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

process.chdir(process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase()))
await import(pathToFileURL(resolve('node_modules/vitest/vitest.mjs')).href)
