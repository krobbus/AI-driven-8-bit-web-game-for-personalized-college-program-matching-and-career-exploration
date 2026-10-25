import { resolve } from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.VERCEL ? '/' : '/8-Bit/';

export default defineConfig({
  plugins: [react()],
  base,
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