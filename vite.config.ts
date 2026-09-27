import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),

    // Copy Silero VAD WASM/ONNX assets so they are served at the root path
    // and accessible by the AudioWorklet in the browser.
    viteStaticCopy({
      targets: [
        {
          // Silero VAD AudioWorklet bundle
          src: 'node_modules/@ricky0123/vad-web/dist/*.worklet.bundle.min.js',
          dest: './',
        },
        {
          // Silero VAD ONNX model
          src: 'node_modules/@ricky0123/vad-web/dist/*.onnx',
          dest: './',
        },
        {
          // ONNX Runtime WebAssembly binaries
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './',
        },
      ],
    }),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'AJAY-VANI (पीएम-अजय आजीविका वाणी)',
        short_name: 'AJAY-VANI',
        description: 'AI-Driven Multilingual Voice Livelihood Assistant for PM-AJAY',
        theme_color: '#009378',
        background_color: '#F6F6F6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 35 * 1024 * 1024, // 35 MB to allow precaching large ONNX & WASM binaries
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm,onnx}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // Ensure onnxruntime-web and vad-web WASM files are not inlined
  optimizeDeps: {
    exclude: ['@ricky0123/vad-web', 'onnxruntime-web'],
  },
});
