const scriptId = "google-maps-js-api";

let mapsLoadPromise: Promise<typeof google.maps> | null = null;

declare global {
  interface Window {
    __careOutingMapsLoaded?: () => void;
  }
}

export function loadGoogleMaps(apiKey: string) {
  if (typeof window.google?.maps?.importLibrary === "function") {
    return Promise.resolve(window.google.maps);
  }

  if (mapsLoadPromise) {
    return mapsLoadPromise;
  }

  mapsLoadPromise = new Promise<typeof google.maps>((resolve, reject) => {
    window.__careOutingMapsLoaded = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      mapsLoadPromise = null;
      reject(new Error("Google Maps namespace was not initialized."));
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("error", () => {
        mapsLoadPromise = null;
        reject(new Error("Google Maps JavaScript API failed to load."));
      });
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      v: "beta",
      language: "ja",
      region: "JP",
      loading: "async",
      callback: "__careOutingMapsLoaded",
    });

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error("Google Maps JavaScript API failed to load."));
    };

    document.head.append(script);
  });

  return mapsLoadPromise;
}
