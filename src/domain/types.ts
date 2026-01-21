export type SourceCategory = 'education' | 'residential' | 'activity' | 'commercial';
export type MobilityMode = 'walk' | 'bike' | 'bus' | 'car';
export type PersonaRhythm = 'afterSchool' | 'daytime' | 'evening' | 'weekend';
export type LayerType =
  | 'bikeshare'
  | 'annecySibraRoutes'
  | 'annecySibraStops'
  | 'annecyTerritory'
  | 'annecySibraVehicles'
  | 'schools74'
  | 'schoolWalkingZones'
  | 'schoolBusWalkingZones';

export interface Source {
  id: string;
  name: string;
  category: SourceCategory;
  coordinates: [number, number];
  weight: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  kind: string;
  coordinates: [number, number];
  influence: number;
}

export interface Flux {
  id: string;
  fromSourceId: string;
  toPoiId: string;
  mode: MobilityMode;
  intensity: number;
  line: [number, number][];
}

export interface Persona {
  id: string;
  labelKey: string;
  ageRange: string;
  rhythm: PersonaRhythm;
  dominantMode: MobilityMode;
  summaryKey: string;
}

export interface LayerDefinition {
  id: string;
  labelKey: string;
  type: LayerType;
  isDefaultOn: boolean;
}
