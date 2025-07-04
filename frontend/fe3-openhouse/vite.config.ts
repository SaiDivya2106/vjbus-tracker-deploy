import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    host: 'localhost',

    allowedHosts: [
      '127.0.0.1',
      '103.248.208.119',
      'openhouse.vnrzone.site'
    ],
    port: 3000,
    strictPort: true,
    open: true,
    cors: true, // ✅ Enable CORS
  }
  
});



        
        
    
