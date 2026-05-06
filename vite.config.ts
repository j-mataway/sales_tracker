import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/sales_tracker/',
  plugins: [react()],
  server: {
    port: 4173
  }
});
