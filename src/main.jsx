import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './services/pwaService'

// Catch Vite dynamic import / chunk loading errors when a new deployment invalidates old hashes
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const reloadKey = 'swm:preload_reload_ts';
    const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
    if (Date.now() - lastReload > 8000) {
      sessionStorage.setItem(reloadKey, String(Date.now()));
      window.location.reload();
    }
  });
}

// Initialize PWA Service Worker
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
