import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3112,
    allowedHosts: [
	    '127.0.0.1',
	    'outpass.vjstartup.com',
	    'dev-outpass.vjstartup.com'
    ]
  },
})
