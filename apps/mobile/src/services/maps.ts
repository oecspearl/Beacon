// ---------------------------------------------------------------------------
// Offline Map Management Service
//
// Manages downloadable map tile packs for offline use. Uses OpenFreeMap
// free tile sources so no access token is required.
//
// MapLibre GL Native is optional — all functions gracefully return when
// the library is unavailable (e.g. in Expo Go or builds without native maps).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dynamic import — MapLibre may not be installed
// ---------------------------------------------------------------------------

let MapLibreGL: typeof import("@maplibre/maplibre-react-native") | null = null;

try {
  MapLibreGL = require("@maplibre/maplibre-react-native");
} catch {
  console.warn("[Maps] @maplibre/maplibre-react-native not available");
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise MapLibre GL Native.
 * We use free tile sources (OpenFreeMap) so no access token is needed.
 */
export async function initializeMapLibre(): Promise<void> {
  if (!MapLibreGL?.default) return;
  MapLibreGL.default.setAccessToken(null);
  MapLibreGL.default.setTelemetryEnabled(false);
}

// ---------------------------------------------------------------------------
// Tile sources
// ---------------------------------------------------------------------------

/** Default style URL for OpenFreeMap Liberty style */
export const DEFAULT_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

/**
 * Tile source URLs mapped by country code.
 * All currently point to the same global tile source; this mapping exists
 * so country-specific tile servers can be swapped in later.
 */
export const TILE_SOURCES: Record<string, string> = {
  CU: DEFAULT_STYLE_URL,
  JM: DEFAULT_STYLE_URL,
  TT: DEFAULT_STYLE_URL,
};

// ---------------------------------------------------------------------------
// Country bounding boxes
// ---------------------------------------------------------------------------

/**
 * Pre-defined geographic bounds for pilot countries.
 * Format: [[west, south], [east, north]]
 */
export const COUNTRY_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  CU: [
    [-84.95, 19.82], // [west, south]
    [-74.13, 23.28], // [east, north]
  ],
  JM: [
    [-78.37, 17.70], // [west, south]
    [-76.18, 18.53], // [east, north]
  ],
  TT: [
    [-61.93, 10.04], // [west, south]
    [-60.52, 11.36], // [east, north]
  ],
};

/** Human-readable country names keyed by country code */
export const COUNTRY_NAMES: Record<string, string> = {
  CU: "Cuba",
  JM: "Jamaica",
  TT: "Trinidad & Tobago",
};

/** Estimated download sizes in MB (approximate for zoom levels 1-14) */
export const ESTIMATED_SIZES_MB: Record<string, number> = {
  CU: 120,
  JM: 45,
  TT: 35,
};

// ---------------------------------------------------------------------------
// Offline pack management
// ---------------------------------------------------------------------------

/**
 * Download an offline map tile pack for a given bounding box.
 */
export async function downloadOfflinePack(
  name: string,
  bounds: [[number, number], [number, number]],
  minZoom: number = 1,
  maxZoom: number = 14,
): Promise<void> {
  if (!MapLibreGL?.default) {
    console.warn("[Maps] Cannot download pack — MapLibre not available");
    return;
  }

  const MGL = MapLibreGL.default;
  const styleURL = DEFAULT_STYLE_URL;

  await MGL.offlineManager.createPack(
    {
      name,
      styleURL,
      bounds,
      minZoom,
      maxZoom,
    },
    (_region: any, status: any) => {
      console.log(
        `[Maps] Pack "${name}" progress:`,
        status.percentage?.toFixed(1) + "%",
      );
    },
    (_region: any, error: any) => {
      console.error(`[Maps] Pack "${name}" error:`, error);
    },
  );
}

/**
 * Retrieve all previously downloaded offline packs.
 */
export async function getDownloadedPacks(): Promise<any[]> {
  if (!MapLibreGL?.default) return [];
  const packs = await MapLibreGL.default.offlineManager.getPacks();
  return packs ?? [];
}

/**
 * Delete a specific offline pack by name.
 */
export async function deleteOfflinePack(name: string): Promise<void> {
  if (!MapLibreGL?.default) return;
  await MapLibreGL.default.offlineManager.deletePack(name);
  console.log(`[Maps] Deleted offline pack: ${name}`);
}

/**
 * Subscribe to download progress for a given pack.
 * Returns an unsubscribe function.
 */
export function onPackProgress(
  name: string,
  onProgress: (progress: number, completed: boolean) => void,
): () => void {
  if (!MapLibreGL?.default) return () => {};

  const MGL = MapLibreGL.default;

  MGL.offlineManager.subscribe(
    name,
    (_region: any, status: any) => {
      const pct = status.percentage ?? 0;
      const done = status.state === MGL.OfflinePackDownloadState?.Complete;
      onProgress(pct, done);
    },
    (_region: any, error: any) => {
      console.error(`[Maps] Progress subscription error for "${name}":`, error);
    },
  );

  return () => {
    MGL.offlineManager.unsubscribe(name);
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the country code from a host country name.
 * Returns the 2-letter ISO code or undefined if not a pilot country.
 */
export function resolveCountryCode(
  hostCountry: string,
): string | undefined {
  const normalised = hostCountry.toLowerCase().trim();

  const mapping: Record<string, string> = {
    cuba: "CU",
    jamaica: "JM",
    trinidad: "TT",
    "trinidad and tobago": "TT",
    "trinidad & tobago": "TT",
  };

  return mapping[normalised];
}

/**
 * Get the centre coordinate for a country's bounds.
 */
export function getCountryCentre(
  countryCode: string,
): [number, number] | undefined {
  const bounds = COUNTRY_BOUNDS[countryCode];
  if (!bounds) return undefined;

  const [[west, south], [east, north]] = bounds;
  return [(west + east) / 2, (south + north) / 2];
}
