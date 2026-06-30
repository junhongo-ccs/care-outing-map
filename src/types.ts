export type CareMode = "wheelchair" | "child" | "older";

export type ToiletFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    source: "public_facility" | "railway_station";
    name: string;
    toilet_name: string;
    floor: string;
    address: string;
    distance_to_ueno_station_m?: number;
    photo_entrance: string;
    photo_inside: string;
    wheelchair_entry: boolean;
    wheelchair_turning_space: boolean;
    handrails: boolean;
    ostomate: boolean;
    large_bed: boolean;
    diaper_changing_table: boolean;
    baby_chair: boolean;
    emergency_call_button: boolean;
    outing_confidence_score: number;
    outing_confidence_band: string;
  };
};

export type PoiFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    osm_type: string;
    osm_id: number;
    name: string;
    tourism: string;
    amenity: string;
    leisure: string;
    website: string;
    distance_to_ueno_station_m: number;
  };
};

export type FeatureCollection<T> = {
  type: "FeatureCollection";
  name?: string;
  metadata?: Record<string, unknown>;
  features: T[];
};
