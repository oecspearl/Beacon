export interface CountryProfile {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  emergencyNumbers: {
    police: string;
    ambulance: string;
    fire: string;
    general: string | null;
  };
  diplomaticMissions: DiplomaticMission[];
  safeZones: SafeZone[];
  mapTileUrl: string | null;
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  briefingPack: BriefingPack | null;
  lastUpdated: string;
}

export interface DiplomaticMission {
  name: string;
  type: "embassy" | "consulate" | "honorary_consul" | "caricom_mission";
  country: string; // representing country
  address: string;
  phone: string;
  email: string | null;
  latitude: number;
  longitude: number;
  operatingHours: string | null;
}

export interface SafeZone {
  id: string;
  name: string;
  type: "embassy" | "hospital" | "airport" | "seaport" | "evacuation_point" | "shelter";
  address: string;
  latitude: number;
  longitude: number;
  capacity: number | null;
  notes: string | null;
}

export interface BriefingPack {
  countryCode: string;
  version: number;
  lastUpdated: string;
  sections: {
    title: string;
    content: string; // Markdown
  }[];
}
