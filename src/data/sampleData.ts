import type { LayerDefinition, Persona } from '../domain/types';

export const LAYER_IDS = {
  bikeshare: 'bikeshare',
  annecySibraRoutes: 'annecySibraRoutes',
  annecySibraStops: 'annecySibraStops',
  annecyTerritory: 'annecyTerritory',
  annecySibraVehicles: 'annecySibraVehicles',
  schools74: 'schools74',
  schoolWalkingZones: 'schoolWalkingZones',
  schoolBusWalkingZones: 'schoolBusWalkingZones',
} as const;

export const MAP_CONSTANTS = {
  center: [45.8855, 6.083] as [number, number],
  zoom: 12,
};

export const layers: LayerDefinition[] = [
  { id: LAYER_IDS.bikeshare, labelKey: 'layers.bikeshare.label', type: 'bikeshare', isDefaultOn: false },
  {
    id: LAYER_IDS.annecySibraRoutes,
    labelKey: 'layers.annecySibraRoutes.label',
    type: 'annecySibraRoutes',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.annecySibraStops,
    labelKey: 'layers.annecySibraStops.label',
    type: 'annecySibraStops',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.annecyTerritory,
    labelKey: 'layers.annecyTerritory.label',
    type: 'annecyTerritory',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.annecySibraVehicles,
    labelKey: 'layers.annecySibraVehicles.label',
    type: 'annecySibraVehicles',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.schools74,
    labelKey: 'layers.schools74.label',
    type: 'schools74',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.schoolWalkingZones,
    labelKey: 'layers.schoolWalkingZones.label',
    type: 'schoolWalkingZones',
    isDefaultOn: false,
  },
  {
    id: LAYER_IDS.schoolBusWalkingZones,
    labelKey: 'layers.schoolBusWalkingZones.label',
    type: 'schoolBusWalkingZones',
    isDefaultOn: false,
  },
];

export const SCHOOL_PUBLIC_TRANSPORT_SHARE = {
  primary: 0.15,
  college: 0.45,
  lycee: 0.3,
} as const;

export const SCHOOL_WALKING_SHARE = {
  primary: 0.5,
  college: 0.3,
  lycee: 0.2,
} as const;

export const SCHOOL_WALKING_SPEED_KMH = {
  primary: 3.5,
  college: 4.0,
  lycee: 4.5,
} as const;

export const personas: Persona[] = [
  {
    id: 'after-school-teens',
    labelKey: 'personas.after-school-teens.label',
    ageRange: '12-17',
    rhythm: 'afterSchool',
    dominantMode: 'bus',
    summaryKey: 'personas.after-school-teens.summary',
  },
  {
    id: 'students-multi',
    labelKey: 'personas.students-multi.label',
    ageRange: '18-24',
    rhythm: 'evening',
    dominantMode: 'bike',
    summaryKey: 'personas.students-multi.summary',
  },
];
