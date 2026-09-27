/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

clientsClaim();

// The exact string "self.__WB_MANIFEST" MUST be present in source so that
// vite-plugin-pwa can inject the precache manifest at build time.
precacheAndRoute(self.__WB_MANIFEST as any);

const PACK_CACHE = 'ajay-vani-pack-cache-v1';

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;
  if (!data || data.type !== 'CACHE_PACK') return;

  const { url, blob } = data;
  const port = event.ports[0];

  if (!url || !blob) {
    port?.postMessage({ type: 'CACHE_PACK_RESULT', success: false, error: 'Missing url or blob' });
    return;
  }

  caches.open(PACK_CACHE)
    .then((cache) => {
      return cache.put(url, new Response(blob));
    })
    .then(() => {
      port?.postMessage({ type: 'CACHE_PACK_RESULT', success: true });
    })
    .catch((err: any) => {
      console.error('[SW] CACHE_PACK failed:', err);
      port?.postMessage({ type: 'CACHE_PACK_RESULT', success: false, error: err.message });
    });
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = event.request.url;
  if (url.match(/\.(onnx|wasm)$/) || url.includes('/models/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
    );
  }
});
