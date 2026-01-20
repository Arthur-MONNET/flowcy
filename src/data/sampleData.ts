import type { LayerDefinition, Persona } from '../domain/types';

export const LAYER_IDS = {
  bikeshare: 'bikeshare',
  annecySibraRoutes: 'annecySibraRoutes',
  annecySibraStops: 'annecySibraStops',
  annecyTerritory: 'annecyTerritory',
  annecySibraVehicles: 'annecySibraVehicles',
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
];

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
  {
    id: 'family-weekend',
    labelKey: 'personas.family-weekend.label',
    ageRange: '30-45',
    rhythm: 'weekend',
    dominantMode: 'car',
    summaryKey: 'personas.family-weekend.summary',
  },
];
