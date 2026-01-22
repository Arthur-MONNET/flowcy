# ARCH v0.1 (Baseline)

## Stack
- Vue 3 + TypeScript.
- Vite.
- Tailwind CSS.
- Leaflet (MapLibre optional later).
- Pinia for state.

## Structure (default)
- src/components: UI and map components.
- src/domain: core types.
- src/data: sample datasets and loaders.
- src/stores: Pinia stores.
- src/utils: helpers.

## Components (v0.1)
- MapView: renders Leaflet map and layers.
- Sidebar: persona selection and context.
- LayersPanel: layer toggles.

## Stores (v0.1)
- mapStore:
  - activeLayerIds: string[]
  - activePersonaId: string
  - actions: toggleLayer, setPersona
  - actions: selectFeature, clearSelection

## Types (v0.1)
- Source: { id, name, category, coordinates, weight }
- PointOfInterest: { id, name, kind, coordinates, influence }
- Flux: { id, fromSourceId, toPoiId, mode, intensity, line }
- Persona: { id, label, ageRange, rhythm, dominantMode, summary }
- LayerDefinition: { id, label, type, isDefaultOn }
 - DatasetMetadata: { source, date, accuracy, license }
 - DatasetEnvelope<T>: { type, datasetVersion, metadata: DatasetMetadata, features: T[] }

## Contracts (v0.1)
- UI components consume data only through typed models.
- Map layers render from data definitions, not inline constants.
- Any new field requires updating types in src/domain/types.ts.
 - Dataset parsing must validate required metadata and value ranges.

## Events (v0.1)
- click: map feature selection (placeholder).
- hover: map feature preview (placeholder).
- filterChange: layer/persona change (implemented).
 - selectionChange: selection updated in mapStore.

## Versioning
- datasetVersion tracked in DATA.md (placeholder).
- Breaking contract changes require explicit version bump in ARCH.md.

## Quality Gates (v0.1)
- Smoke tests: load map, toggle each layer, change persona, view score list.
- Release checklist: lint, typecheck, build, and manual smoke tests.
