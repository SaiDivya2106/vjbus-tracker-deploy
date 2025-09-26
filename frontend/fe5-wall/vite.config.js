import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port:3105,
    allowedHosts: [
      '3d87df051e73.ngrok-free.app',
      'dev-wall.vjstartup.com'
    ],
    optimizeDeps: {
      exclude: ['react-icons']
      }
  }
})
