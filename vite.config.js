import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../frontend/dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      cookie: '/node_modules/cookie/dist/index.js'
    }
  },
  server: {
    proxy: {
      '/admin': 'http://localhost:3000',
      '/user':  'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/signup': 'http://localhost:3000',
      '/getBuilding': 'http://localhost:3000',
      '/admin-login': 'http://localhost:3000',
      '/admin-logout': 'http://localhost:3000',
    }
  }
})