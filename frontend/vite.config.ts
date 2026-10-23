import { resolve } from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/8-Bit/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'Game.html'),
        loginOverlay: 'src/pages/login/LoginOverlay.tsx'
      },
      output:{
        manualChunks: {
          phaser: ['phaser'],
          firebase: ['firebase/app', 'firebase/database'],
        }
      }
    }
  }
})