import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      // allow Vite to serve files from the monorepo root (cert-blockchain artifacts)
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
