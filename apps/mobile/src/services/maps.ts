import MapLibreGL from "@maplibre/maplibre-react-native";

// ---------------------------------------------------------------------------
// Offline Map Management Service
//
// Manages downloadable map tile packs for offline use. Uses OpenFreeMap
// free tile sources so no access token is required.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise MapLibre GL Native.
 * We use free tile sources (OpenFreeMap) so no access token is needed.
 */
export async function initializeMapLibre(): Promise<void> {
  MapLibreGL.setAccessToken(null);

  // Disable telemetry for privacy
  MapLibreGL.setTelemetryEnabled(false);
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
 *
 * @param name    - Unique name for the pack (e.g. "cuba-offline")
 * @param bounds  - Geographic bounds as [[west, south], [east, north]]
 * @param minZoom - Minimum zoom level to cache (default 1)
 * @param maxZoom - Maximum zoom level to cache (default 14)
 */
export async function downloadOfflinePack(
  name: string,
  bounds: [[number, number], [number, number]],
  minZoom: number = 1,
  maxZoom: number = 14,
): Promise<void> {
  const styleURL = DEFAULT_STYLE_URL;

  await MapLibreGL.offlineManager.createPack(
    {
      name,
      styleURL,
      bounds,
      minZoom,
      maxZoom,
    },
    (region, status) => {
      // Progress callback — used by consumers to track download state
      console.log(
        `[Maps] Pack "${name}" progress:`,
        status.percentage?.toFixed(1) + "%",
      );
    },
    (region, error) => {
      console.error(`[Maps] Pack "${name}" error:`, error);
    },
  );
}

/**
 * Retrieve all previously downloaded offline packs.
 */
export async function getDownloadedPacks(): Promise<MapLibreGL.OfflinePack[]> {
  const packs = await MapLibreGL.offlineManager.getPacks();
  return packs ?? [];
}

/**
 * Delete a specific offline pack by name.
 *
 * @param name - The name of the pack to remove
 */
export async function deleteOfflinePack(name: string): Promise<void> {
  await MapLibreGL.offlineManager.deletePack(name);
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
  const subscription = MapLibreGL.offlineManager.subscribe(
    name,
    (_region, status) => {
      const pct = status.percentage ?? 0;
      const done = status.state === MapLibreGL.OfflinePackDownloadState.Complete;
      onProgress(pct, done);
    },
    (_region, error) => {
      console.error(`[Maps] Progress subscription error for "${name}":`, error);
    },
  );

  return () => {
    MapLibreGL.offlineManager.unsubscribe(name);
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
