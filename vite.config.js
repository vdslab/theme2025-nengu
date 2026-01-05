import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ninja': {
        target: 'https://poe.ninja/api/data',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ninja/, ''),
      },
    },
  },
})