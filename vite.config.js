import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages, set base to '/<repo-name>/'
  base: './',
  // three.js (Paper 3D mode) is its own lazy chunk of ~560 kB
  build: { chunkSizeWarningLimit: 700 },
})
