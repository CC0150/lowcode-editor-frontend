import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 这里的 localhost 是对 vite 所在的电脑生效，没问题
        changeOrigin: true,
      }
    }
  }
})
