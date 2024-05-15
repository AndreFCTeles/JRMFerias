import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  /* dev */
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://192.168.0.12:8080'
    }
  },
  /* /dev */
  plugins: [react()],
  build: {
    outDir: 'build',
  },
})
