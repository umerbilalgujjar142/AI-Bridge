import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    // Fail instead of silently picking another port: the backend's CORS_ORIGIN expects exactly 5178.
    strictPort: true,
  },
  preview: {
    port: 5178,
    strictPort: true,
  },
})
