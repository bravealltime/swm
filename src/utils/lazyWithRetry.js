import { lazy } from 'react';

/**
 * Resilient React.lazy wrapper that catches Vite dynamic import failures
 * (which happen when a new deployment on Vercel invalidates old chunk hashes)
 * and automatically reloads the browser to fetch the latest manifest.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} componentFactory
 * @param {string} [chunkName]
 * @returns {React.LazyExoticComponent<React.ComponentType<any>>}
 */
export function lazyWithRetry(componentFactory, chunkName = 'component') {
  return lazy(async () => {
    const key = `swm:chunk_retry:${chunkName}`;
    const storage = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined' ? window.sessionStorage : null;
    const lastRetry = storage ? storage.getItem(key) : null;

    try {
      const component = await componentFactory();
      if (storage) storage.removeItem(key);
      return component;
    } catch (error) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('error loading dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      // Avoid infinite reload loop: only retry once per chunk per session
      if (isChunkError && !lastRetry && typeof window !== 'undefined') {
        if (storage) storage.setItem(key, String(Date.now()));

        // Invalidate old service worker static cache if supported
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(
              keys.filter((k) => k.startsWith('swm-static-')).map((k) => caches.delete(k))
            );
          } catch {}
        }

        // Force a fresh reload from the server (bypassing stale cache where possible)
        if (window.location && typeof window.location.reload === 'function') {
          window.location.reload();
        }

        // Return a pending promise so React stays in Suspense during the reload
        return new Promise(() => {});
      }

      if (storage) storage.removeItem(key);
      throw error;
    }
  });
}
