// PWA Service: Handles Service Worker registration, install prompts, and standalone state

let deferredPrompt = null;
const listeners = new Set();

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    new URLSearchParams(window.location.search).get('pwa') === '1'
  );
}

export function isIos() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /android/.test(window.navigator.userAgent.toLowerCase());
}

export function canInstallPrompt() {
  return !!deferredPrompt;
}

export function subscribePwaState(callback) {
  listeners.add(callback);
  callback({
    isStandalone: isStandalone(),
    canInstall: canInstallPrompt(),
    isIos: isIos(),
    isAndroid: isAndroid()
  });

  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  const state = {
    isStandalone: isStandalone(),
    canInstall: canInstallPrompt(),
    isIos: isIos(),
    isAndroid: isAndroid()
  };
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch (e) {
      console.warn('PWA listener error:', e);
    }
  });
}

export async function promptInstall() {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return choiceResult;
  } catch (err) {
    console.warn('Install prompt error:', err);
    return { outcome: 'error' };
  }
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Intercept PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  // Track app installation event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
    console.log('[SWM PWA] App installed successfully');
  });

  // Register Service Worker
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SWM PWA] Service Worker registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SWM PWA] New update available');
              window.dispatchEvent(new CustomEvent('swm:pwa-update', { detail: reg }));
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SWM PWA] Service Worker registration failed:', err);
      });
  });
}
