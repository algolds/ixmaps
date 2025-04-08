import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'public/dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/js/index.ts'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        format: 'es', // Ensure ES module format
        globals: {
          leaflet: 'L' // Map the external 'leaflet' import to global 'L' variable
        }
      },
      external: ['leaflet']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/js'),
      'leaflet-module': resolve(__dirname, 'src/js/leaflet-module.ts')
    }
  }
});