import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages は /shukkin-calendar/ 配下で配信される
  base: process.env.GITHUB_PAGES === 'true' ? '/shukkin-calendar/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
