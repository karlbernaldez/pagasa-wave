import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  json: {
    stringify: false // Import as object
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dashboards': path.resolve(__dirname, './src/dashboards'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    allowedHosts: [
      "dev.wavelab.adovelopers.com"
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.js'],
  },
})


