import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// VITE_BASE_PATH 由部署脚本注入：
//   S2测试站：VITE_BASE_PATH=/Yise--assistant-s2/
//   S1测试站：VITE_BASE_PATH=/Luoke-yise-test/
//   生产站：VITE_BASE_PATH=/yise-Luoke-v2.0-ruby-s/
//   Vercel：VITE_BASE_PATH=/ 或 VITE_VERCEL=1（自动用根路径）
export default defineConfig(({ command }) => {
  const isVercel = process.env.VERCEL === '1'
  const basePath = process.env.VITE_BASE_PATH
  return {
    plugins: [react()],
    base: command === 'build'
      ? (isVercel ? '/' : (basePath || '/Yise--assistant-s2/'))
      : '/',
  }
})
