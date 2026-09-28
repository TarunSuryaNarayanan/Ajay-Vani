import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { assertVADAssets } from './services/audioCapture';

if (typeof window !== 'undefined') {
  assertVADAssets().catch((err) => {
    console.warn('[AudioCapture] Asset assertion error:', err);
  });
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
