import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined;

  if (
    id.includes('react') ||
    id.includes('react-dom') ||
    id.includes('react-router-dom') ||
    id.includes('styled-components') ||
    id.includes('@mui') ||
    id.includes('@emotion') ||
    id.includes('konva') ||
    id.includes('react-konva') ||
    id.includes('perfect-freehand') ||
    id.includes('lucide-react') ||
    id.includes('react-icons')
  ) {
    return 'vendor-ui';
  }

  if (id.includes('@tanstack/react-query') || id.includes('axios') || id.includes('socket.io-client')) {
    return 'vendor-data';
  }

  if (id.includes('mapbox-gl') || id.includes('@mapbox/mapbox-gl-draw')) {
    return 'vendor-mapbox';
  }

  if (id.includes('@turf')) {
    return 'vendor-geo';
  }

  if (id.includes('recharts')) {
    return 'vendor-charts';
  }

  if (id.includes('sweetalert2')) {
    return 'vendor-alerts';
  }

  if (id.includes('gif.js.optimized')) {
    return 'vendor-export';
  }

  return undefined;
}

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
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
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


