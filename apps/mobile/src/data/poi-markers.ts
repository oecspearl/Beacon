// ---------------------------------------------------------------------------
// Pre-loaded Point of Interest (POI) Data
//
// Hardcoded POI arrays for the three pilot countries. These are embedded
// in the app so they are available offline without any network request.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type POIType =
  | "embassy"
  | "hospital"
  | "airport"
  | "seaport"
  | "police"
  | "evacuation_point"
  | "safe_zone";

export interface POI {
  id: string;
  name: string;
  type: POIType;
  latitude: number;
  longitude: number;
  country: string;
  phone?: string;
  address?: string;
}

// ---------------------------------------------------------------------------
// Marker colours by POI type
// ---------------------------------------------------------------------------

export const POI_COLORS: Record<POIType, string> = {
  embassy: "#3b82f6",          // blue
  hospital: "#ef4444",         // red
  airport: "#22c55e",          // green
  seaport: "#06b6d4",          // cyan
  police: "#eab308",           // yellow
  evacuation_point: "#f97316", // orange
  safe_zone: "#a855f7",        // purple
};

/** Human-readable labels for each POI type */
export const POI_LABELS: Record<POIType, string> = {
  embassy: "Embassy",
  hospital: "Hospital",
  airport: "Airport",
  seaport: "Seaport",
  police: "Police",
  evacuation_point: "Evacuation Point",
  safe_zone: "Safe Zone",
};

/** Icon names (Ionicons) mapped to POI types */
export const POI_ICONS: Record<POIType, string> = {
  embassy: "flag",
  hospital: "medkit",
  airport: "airplane",
  seaport: "boat",
  police: "shield",
  evacuation_point: "exit",
  safe_zone: "shield-checkmark",
};

// ---------------------------------------------------------------------------
// Cuba POIs
// ---------------------------------------------------------------------------

const CUBA_POIS: POI[] = [
  {
    id: "cu-embassy-01",
    name: "CARICOM Embassy",
    type: "embassy",
    latitude: 23.13,
    longitude: -82.38,
    country: "Cuba",
    phone: "+53 7 204 2516",
    address: "Miramar, Havana, Cuba",
  },
  {
    id: "cu-hospital-01",
    name: "Hospital Hermanos Ameijeiras",
    type: "hospital",
    latitude: 23.142,
    longitude: -82.392,
    country: "Cuba",
    phone: "+53 7 876 1000",
    address: "San Lazaro 701, Centro Habana, Havana",
  },
  {
    id: "cu-hospital-02",
    name: "Clinica Cira Garcia",
    type: "hospital",
    latitude: 23.126,
    longitude: -82.41,
    country: "Cuba",
    phone: "+53 7 204 2811",
    address: "Calle 20 No. 4101, Playa, Havana",
  },
  {
    id: "cu-airport-01",
    name: "Jose Marti International Airport",
    type: "airport",
    latitude: 22.9892,
    longitude: -82.4091,
    country: "Cuba",
    phone: "+53 7 266 4644",
    address: "Boyeros, Havana, Cuba",
  },
  {
    id: "cu-seaport-01",
    name: "Port of Havana",
    type: "seaport",
    latitude: 23.145,
    longitude: -82.348,
    country: "Cuba",
    address: "Havana Bay, Old Havana, Cuba",
  },
  {
    id: "cu-safezone-01",
    name: "University of Havana",
    type: "safe_zone",
    latitude: 23.1367,
    longitude: -82.3814,
    country: "Cuba",
    phone: "+53 7 878 3231",
    address: "Calle L, Vedado, Havana",
  },
];

// ---------------------------------------------------------------------------
// Jamaica POIs
// ---------------------------------------------------------------------------

const JAMAICA_POIS: POI[] = [
  {
    id: "jm-embassy-01",
    name: "OECS Liaison Office",
    type: "embassy",
    latitude: 18.01,
    longitude: -76.79,
    country: "Jamaica",
    phone: "+1 876-926-6020",
    address: "Kingston, Jamaica",
  },
  {
    id: "jm-hospital-01",
    name: "University Hospital of the West Indies",
    type: "hospital",
    latitude: 18.005,
    longitude: -76.7465,
    country: "Jamaica",
    phone: "+1 876-927-1620",
    address: "Mona, Kingston 7, Jamaica",
  },
  {
    id: "jm-hospital-02",
    name: "Kingston Public Hospital",
    type: "hospital",
    latitude: 17.974,
    longitude: -76.787,
    country: "Jamaica",
    phone: "+1 876-922-0210",
    address: "North Street, Kingston, Jamaica",
  },
  {
    id: "jm-airport-01",
    name: "Norman Manley International Airport",
    type: "airport",
    latitude: 17.9357,
    longitude: -76.7875,
    country: "Jamaica",
    phone: "+1 876-924-8235",
    address: "Palisadoes, Kingston, Jamaica",
  },
  {
    id: "jm-seaport-01",
    name: "Port of Kingston",
    type: "seaport",
    latitude: 17.965,
    longitude: -76.783,
    country: "Jamaica",
    address: "Kingston Harbour, Kingston, Jamaica",
  },
  {
    id: "jm-safezone-01",
    name: "UWI Mona Campus",
    type: "safe_zone",
    latitude: 18.006,
    longitude: -76.748,
    country: "Jamaica",
    phone: "+1 876-927-1660",
    address: "Mona, Kingston 7, Jamaica",
  },
];

// ---------------------------------------------------------------------------
// Trinidad & Tobago POIs
// ---------------------------------------------------------------------------

const TRINIDAD_POIS: POI[] = [
  {
    id: "tt-embassy-01",
    name: "OECS Office",
    type: "embassy",
    latitude: 10.66,
    longitude: -61.51,
    country: "Trinidad",
    phone: "+1 868-623-4116",
    address: "Port of Spain, Trinidad",
  },
  {
    id: "tt-hospital-01",
    name: "Eric Williams Medical Sciences Complex",
    type: "hospital",
    latitude: 10.635,
    longitude: -61.462,
    country: "Trinidad",
    phone: "+1 868-645-4673",
    address: "Uriah Butler Highway, Champ Fleurs, Trinidad",
  },
  {
    id: "tt-hospital-02",
    name: "Port of Spain General Hospital",
    type: "hospital",
    latitude: 10.659,
    longitude: -61.519,
    country: "Trinidad",
    phone: "+1 868-623-2951",
    address: "Charlotte Street, Port of Spain, Trinidad",
  },
  {
    id: "tt-airport-01",
    name: "Piarco International Airport",
    type: "airport",
    latitude: 10.5954,
    longitude: -61.3372,
    country: "Trinidad",
    phone: "+1 868-669-8047",
    address: "Golden Grove Road, Piarco, Trinidad",
  },
  {
    id: "tt-seaport-01",
    name: "Port of Spain Harbour",
    type: "seaport",
    latitude: 10.653,
    longitude: -61.525,
    country: "Trinidad",
    address: "Wrightson Road, Port of Spain, Trinidad",
  },
  {
    id: "tt-safezone-01",
    name: "UWI St. Augustine Campus",
    type: "safe_zone",
    latitude: 10.641,
    longitude: -61.399,
    country: "Trinidad",
    phone: "+1 868-662-2002",
    address: "St. Augustine, Trinidad",
  },
];

// ---------------------------------------------------------------------------
// Aggregated data
// ---------------------------------------------------------------------------

/** All POIs across all pilot countries */
export const ALL_POIS: POI[] = [
  ...CUBA_POIS,
  ...JAMAICA_POIS,
  ...TRINIDAD_POIS,
];

/** POIs grouped by country name */
export const POIS_BY_COUNTRY: Record<string, POI[]> = {
  Cuba: CUBA_POIS,
  Jamaica: JAMAICA_POIS,
  Trinidad: TRINIDAD_POIS,
};

/**
 * Get POIs for a specific country.
 * Matches against the `country` field (case-insensitive).
 */
export function getPOIsForCountry(country: string): POI[] {
  const normalised = country.toLowerCase().trim();

  return ALL_POIS.filter(
    (poi) => poi.country.toLowerCase() === normalised,
  );
}

/**
 * Get POIs filtered by type.
 */
export function getPOIsByType(type: POIType): POI[] {
  return ALL_POIS.filter((poi) => poi.type === type);
}

/**
 * Get all unique POI types present in the data.
 */
export function getAvailablePOITypes(): POIType[] {
  const types = new Set(ALL_POIS.map((poi) => poi.type));
  return Array.from(types);
}
