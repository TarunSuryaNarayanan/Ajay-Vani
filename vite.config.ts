import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function fixOrtWasmVariant() {
  const WALKMAN = '__ort_wasm_not_vite_resolved__';
  return {
    name: 'fix-ort-wasm-variant',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.includes('onnxruntime-web')) return null;
      let changed = false;
      let result = code
        .replace(/ort-wasm-simd-threaded\.jsep/g, () => { changed = true; return 'ort-wasm-simd-threaded'; })
        .replace(/ort-wasm-simd-threaded\.jspi/g, () => { changed = true; return 'ort-wasm-simd-threaded'; })
        .replace(/ort-wasm-simd-threaded\.asyncify/g, () => { changed = true; return 'ort-wasm-simd-threaded'; });
      // Vite resolves new URL("ort-wasm-simd-threaded.wasm", import.meta.url) at
      // build time, emitting a duplicate ~14 MB hashed wasm asset. At runtime
      // the VAD library sets ort.env.wasm.wasmPaths so this fallback is never
      // reached. Replace with a non-resolvable base so Vite skips asset emission.
      result = result.replace(
        /new URL\("ort-wasm-simd-threaded\.wasm",\s*import\.meta\.url\)/g,
        () => { changed = true; return `new URL("ort-wasm-simd-threaded.wasm", "http://${WALKMAN}")`; }
      );
      return changed ? { code: result, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    fixOrtWasmVariant(),
     // Copy Silero VAD worklet + the single v5 ONNX model so they are served
     // at the root path and accessible by the AudioWorklet in the browser.
    viteStaticCopy({
      targets: [
        {
          // Silero VAD AudioWorklet bundle
          src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: './',
        },
        {
          // Silero VAD ONNX model — ONLY v5 (v5/v6 differ only in weights;
          // legacy is never used). Saves ~4.1 MB vs copying all three.
          src: 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx',
          dest: './',
        },
        {
          // ONNX Runtime WebAssembly binary — ONLY the base threaded variant.
          // The jsep, jspi, and asyncify variants are never selected at
          // runtime (executionProviders pins ['wasm']) and are pure dead
          // weight (~88 MB).
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
          dest: './',
        },
      ],
    }),

    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
       injectRegister: false,
      strategies: 'injectManifest',
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
      injectManifest: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB — accommodate ort-wasm-simd-threaded.wasm (14.2 MB)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
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
          {
            // Runtime-cache model binaries and wasm so they are excluded
            // from the install-time precache (B7). CacheFirst with a
            // long TTL; content-addressing (C10) ensures safe caching.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/models/') ||
              url.pathname.match(/\.(onnx|wasm)$/),
            handler: 'CacheFirst',
            options: {
              cacheName: 'model-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
      ],
    }),
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
