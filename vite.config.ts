import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // ⚡ Performans optimizasyonları
      build: {
        minify: isProduction ? 'esbuild' : false,
        cssMinify: isProduction,
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks for better caching
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['recharts'],
              'vendor-ai': ['@google/genai'],
            }
          }
        },
        // Bundle boyut uyarı limiti
        chunkSizeWarningLimit: 1000,
      },
      // Development optimizations
      optimizeDeps: {
        include: ['react', 'react-dom', 'recharts', '@google/genai']
      }
    };
});
