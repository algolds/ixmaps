import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/js/index.ts'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: 'assets/[name].[ext]'
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