# DATA v0.1 (Baseline)

## Purpose
Define minimal data structures for v1. All fields are explicit. Anything missing is a placeholder.

## Conventions
- GeoJSON coordinate order: [lon, lat].
- App adapters convert to Leaflet order: [lat, lon] (placeholder).
- All datasets include metadata: source, date, accuracy.
- IDs are stable strings.

## Dataset Versions
- datasetVersion: "v0.1" (placeholder, to be updated by Agent F).

## Sources (population origins)
Format (GeoJSON-like):
- type: FeatureCollection
- features: Feature<Point>
- properties: id, name, category, weight

Example:
```
{
  "type": "FeatureCollection",
  "datasetVersion": "v0.1",
  "metadata": {"source": "synthetic", "date": "2025-01-01", "accuracy": "low"},
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [6.08333, 45.883301]},
      "properties": {"id": "school-1", "name": "Middle school cluster", "category": "education", "weight": 0.9}
    }
  ]
}
```

## Attractions / POI
Format (GeoJSON-like):
- type: FeatureCollection
- features: Feature<Point>
- properties: id, name, kind, influence

Example:
```
{
  "type": "FeatureCollection",
  "datasetVersion": "v0.1",
  "metadata": {"source": "synthetic", "date": "2025-01-01", "accuracy": "low"},
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [6.10117, 45.88976]},
      "properties": {"id": "poi-1", "name": "Existing leisure venue", "kind": "leisure", "influence": 0.8}
    }
  ]
}
```

## Flows (simplified lines)
Format (GeoJSON-like):
- type: FeatureCollection
- features: Feature<LineString>
- properties: id, fromSourceId, toPoiId, mode, intensity

Example:
```
{
  "type": "FeatureCollection",
  "datasetVersion": "v0.1",
  "metadata": {"source": "synthetic", "date": "2025-01-01", "accuracy": "low"},
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "LineString", "coordinates": [[6.08333, 45.883301], [6.07201, 45.88717]]},
      "properties": {"id": "flow-1", "fromSourceId": "school-1", "toPoiId": "poi-2", "mode": "bus", "intensity": 0.7}
    }
  ]
}
```

## Constraints (polygons)
Format (GeoJSON-like):
- type: FeatureCollection
- features: Feature<Polygon>
- properties: id, label, reason

Example:
```
{
  "type": "FeatureCollection",
  "datasetVersion": "v0.1",
  "metadata": {"source": "synthetic", "date": "2025-01-01", "accuracy": "low"},
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Polygon", "coordinates": [[[6.06, 45.856], [6.095, 45.856], [6.095, 45.835], [6.06, 45.835], [6.06, 45.856]]]},
      "properties": {"id": "constraint-1", "label": "Avoid zone", "reason": "Low accessibility"}
    }
  ]
}
```

## GTFS (placeholder)
- Assumption: GTFS will be imported offline.
- Placeholder: store only simplified routes in v1.

## Local Datasets (v0.1)
- `datasets/gbfs/gbfs.json`: GBFS feed index for Annecy.
- `datasets/gbfs/station_information.json`: bike station locations and metadata.
- `datasets/gbfs/station_status.json`: live-like availability snapshot (bikes, docks).
- `datasets/gbfs/metadata.json`: provenance and extraction notes.
- `datasets/gtfs/sibra/gtfs-sibra.zip`: GTFS snapshot for SIBRA.
- `datasets/gtfs/sibra/shapes.geojson`: line shapes extracted from GTFS (shape_id + route metadata).
- `datasets/gtfs/sibra/metadata.json`: provenance and extraction notes.

## External APIs (v0.1)
- `https://annecy-mobilites.latitude-cartagene.com/api/init-application`: app bootstrap data (lines, stops, hash).
- `https://annecy-mobilites.latitude-cartagene.com/api/file?folder=routes&ext=geojson&name={routeId}~{hash}`: line geometries.
- `https://annecy-mobilites.latitude-cartagene.com/api/file?name={routeId}~{hash}&folder=stops&ext=json`: stops per route.
- `https://annecy-mobilites.latitude-cartagene.com/api/file?name=territory_outline&folder=map&ext=geojson`: territory outline.
- `https://annecy-mobilites.latitude-cartagene.com/api/vehicles-positions?route_id={routeId}`: realtime vehicle positions for a route.
- `https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records`: colleges and high schools (filtered by departement 74).
- `https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-college-effectifs-niveau-sexe-lv/records`: college enrollments by level/sex/language.
- `https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-lycee_gt-effectifs-niveau-sexe-lv/records`: general/technical high school enrollments.
- `https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-lycee_pro-effectifs-niveau-sexe-lv/records`: vocational high school enrollments.

## Notes
- Assumption: data stays local and versioned in `datasets/`.
- Placeholder: validation rules to be defined by Agent F.
