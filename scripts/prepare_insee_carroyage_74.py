import csv
import json
import math
import re
from pathlib import Path

SOURCE_PATH = Path('datasets/insee/filosofi2015_carreaux_200m/Filosofi2015_carreaux_200m_metropole.csv')
OUTPUT_PATH = Path('public/datasets/insee/filosofi2015_carreaux_200m_74.geojson')

DEPARTMENT_PREFIX = '74'
CELL_SIZE_METERS = 200.0
HALF_CELL_METERS = CELL_SIZE_METERS / 2.0
CELL_AREA_KM2 = (CELL_SIZE_METERS * CELL_SIZE_METERS) / 1_000_000.0

# EPSG:3035 (ETRS89 / LAEA Europe) parameters
LAT0 = math.radians(52.0)
LON0 = math.radians(10.0)
FALSE_EASTING = 4321000.0
FALSE_NORTHING = 3210000.0
RADIUS = 6378137.0

ID_RE = re.compile(r'N(\d+)E(\d+)')


def laea_to_lonlat(x: float, y: float) -> tuple[float, float]:
    x -= FALSE_EASTING
    y -= FALSE_NORTHING
    p = math.hypot(x, y)
    if p == 0:
        return math.degrees(LON0), math.degrees(LAT0)
    c = 2 * math.asin(min(1.0, p / (2 * RADIUS)))
    sin_c = math.sin(c)
    cos_c = math.cos(c)
    lat = math.asin(cos_c * math.sin(LAT0) + (y * sin_c * math.cos(LAT0) / p))
    lon = LON0 + math.atan2(x * sin_c, p * math.cos(LAT0) * cos_c - y * math.sin(LAT0) * sin_c)
    return math.degrees(lon), math.degrees(lat)


def parse_center_from_id(cell_id: str) -> tuple[float, float] | None:
    match = ID_RE.search(cell_id)
    if not match:
        return None
    northing = float(match.group(1))
    easting = float(match.group(2))
    return easting, northing


def build_polygon(easting: float, northing: float) -> list[list[float]]:
    x0 = easting - HALF_CELL_METERS
    x1 = easting + HALF_CELL_METERS
    y0 = northing - HALF_CELL_METERS
    y1 = northing + HALF_CELL_METERS
    return [
        list(laea_to_lonlat(x0, y0)),
        list(laea_to_lonlat(x1, y0)),
        list(laea_to_lonlat(x1, y1)),
        list(laea_to_lonlat(x0, y1)),
        list(laea_to_lonlat(x0, y0)),
    ]


def main() -> None:
    if not SOURCE_PATH.exists():
        raise SystemExit(f'Source CSV not found: {SOURCE_PATH}')

    features = []
    with SOURCE_PATH.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            depcom = row.get('Depcom', '')
            if not depcom.startswith(DEPARTMENT_PREFIX):
                continue
            cell_id = row.get('IdINSPIRE', '')
            center = parse_center_from_id(cell_id)
            if center is None:
                continue
            population_raw = row.get('Ind', '')
            try:
                population = float(population_raw) if population_raw else 0.0
            except ValueError:
                population = 0.0
            if population <= 0:
                continue
            density = population / CELL_AREA_KM2
            polygon = build_polygon(*center)
            features.append(
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [polygon],
                    },
                    'properties': {
                        'id': cell_id,
                        'population': population,
                        'density': density,
                    },
                }
            )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output = {
        'type': 'FeatureCollection',
        'datasetVersion': 'v0.1',
        'metadata': {
            'source': 'INSEE Filosofi 2015 (carroyage 200m)',
            'date': '2015-01-01',
            'accuracy': 'medium',
            'license': 'INSEE Open Data',
        },
        'features': features,
    }
    OUTPUT_PATH.write_text(json.dumps(output), encoding='utf-8')
    print(f'Wrote {len(features)} features to {OUTPUT_PATH}')


if __name__ == '__main__':
    main()
