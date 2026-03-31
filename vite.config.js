import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During local development, proxy all requests that don't match a static
    // file to the Express backend.  This means you can leave VITE_API_URL
    // empty in .env.local and every fetch('/some-api-route') will hit
    // http://localhost:3000 transparently.
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