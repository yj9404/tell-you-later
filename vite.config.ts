import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // tlock-js가 BigInt를 쓰므로 es2020 이상이어야 한다 (tlock-js README).
  build: { target: 'es2020' },
  test: { include: ['src/**/*.test.ts'] },
})
