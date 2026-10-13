/**
 * Sangita Travels Pune — Google Maps JavaScript API Dynamic Loader
 *
 * Securely loads the Google Maps JavaScript API with Places and Geometry libraries
 * using the configured VITE_GOOGLE_MAPS_API_KEY.
 *
 * Security & Reliability Best Practices:
 * 1. Never logs or prints API keys in logs or browser consoles.
 * 2. Gracefully handles missing keys, network failure, or gm_authFailure.
 * 3. Provides singleton promise to avoid multiple script injections.
 */

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
}

let loadPromise: Promise<boolean> | null = null;
let mapsAuthFailed = false;

// Global listener for Google Maps authentication failures (e.g. invalid key or bad referrer restriction)
if (typeof window !== 'undefined') {
  const originalAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    mapsAuthFailed = true;
    console.warn('[Sangita Travels] Google Maps authentication warning: key restriction or billing issue. Switched to smart route fallback mode.');
    if (typeof originalAuthFailure === 'function') {
      originalAuthFailure();
    }
  };
}

/**
 * Checks if Google Maps JavaScript API is successfully loaded and available in the window.
 */
export function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps && !mapsAuthFailed;
}

/**
 * Loads the Google Maps JavaScript API asynchronously.
 * Returns true if loaded successfully, or false if key is missing/failed.
 */
export function loadGoogleMaps(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (isGoogleMapsAvailable()) {
    return Promise.resolve(true);
  }

  if (mapsAuthFailed) {
    return Promise.resolve(false);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  // If no API key is configured, fallback to offline/verified route engine
  if (!apiKey) {
    return Promise.resolve(false);
  }

  loadPromise = new Promise<boolean>((resolve) => {
    // Check if script is already present
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps) {
        resolve(!mapsAuthFailed);
      } else {
        existingScript.addEventListener('load', () => resolve(!mapsAuthFailed));
        existingScript.addEventListener('error', () => resolve(false));
      }
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Small timeout to allow gm_authFailure to fire if key is invalid
      setTimeout(() => {
        if (mapsAuthFailed) {
          resolve(false);
        } else {
          resolve(!!window.google?.maps);
        }
      }, 300);
    };

    script.onerror = () => {
      console.warn('[Sangita Travels] Unable to load Google Maps script. Using high-accuracy verified route fallback.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
