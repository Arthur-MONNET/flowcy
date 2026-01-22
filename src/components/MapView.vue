<template>
  <div ref="mapElement" class="h-full w-full"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';
import {
  LAYER_IDS,
  MAP_CONSTANTS,
  SCHOOL_PUBLIC_TRANSPORT_SHARE,
  SCHOOL_WALKING_SHARE,
  SCHOOL_WALKING_SPEED_KMH,
  personas,
} from '../data/sampleData';
import {
  fetchInitApplication,
  fetchRouteGeoJson,
  fetchStopsForRoute,
  fetchTerritoryOutline,
  fetchVehiclePositions,
  type GeoJsonFeatureCollection,
  type MobilitesStop,
  type VehiclesResponse,
} from '../utils/mobilitesApi';
import {
  fetchSchools74,
  fetchSchoolEnrollmentsByUai,
  type EducationRecord,
  type SchoolEnrollment,
} from '../utils/educationApi';
import {
  buildBusStopGraph,
  fetchGtfsStopTimes,
  fetchGtfsStops,
  type BusStopGraph,
  type GtfsStop,
} from '../utils/gtfsApi';

const mapElement = ref<HTMLDivElement | null>(null);
const mapStore = useMapStore();
const { t, currentLanguage } = useI18n();
const emit = defineEmits<{ (event: 'map-interaction'): void }>();

const COLORS = {
  annecyStops: '#2563eb',
  annecyTerritory: '#64748b',
  annecyVehicles: '#0f172a',
  schoolCollege: '#0ea5e9',
  schoolLycee: '#f97316',
  schoolLyceePro: '#a855f7',
  schoolPrimary: '#22c55e',
  schoolNursery: '#22c55e',
} as const;

const RESIDENTIAL_DENSITY_STOPS = [
  { max: 500, color: '#fef3c7' },
  { max: 1500, color: '#fdba74' },
  { max: 3000, color: '#fb923c' },
  { max: Number.POSITIVE_INFINITY, color: '#c2410c' },
] as const;

const BUS_WALK_PANE_OPACITY = 0.6;
const PANE_PREFIX = 'flowcy-layer-';

const getPaneName = (layerId: string) => `${PANE_PREFIX}${layerId}`;

let mapInstance: LeafletMap | null = null;
let layerGroups: Record<string, LayerGroup> | null = null;
let bikeshareLayer: LayerGroup | null = null;
let annecyRoutesLoaded = false;
let annecyStopsLoaded = false;
let annecyTerritoryLoaded = false;
let annecyVehiclesLoaded = false;
let schoolsLoaded = false;
let schoolZonesLoaded = false;
let schoolBusZonesLoaded = false;
let residentialDensityLoaded = false;
let schoolEnrollmentCache: Map<string, SchoolEnrollment> | null = null;
let schoolRecordsCache: EducationRecord[] | null = null;
let gtfsStopsCache: Map<string, GtfsStop> | null = null;
let gtfsGraphCache: BusStopGraph | null = null;
const gtfsDijkstraCache = new Map<string, Map<string, number>>();
let vehiclesRefreshId: number | null = null;
const vehicleMarkers = new Map<string, L.CircleMarker>();
const vehicleAnimations = new Map<string, number>();

const routeCache = new Map<string, GeoJsonFeatureCollection>();
const stopsCache = new Map<string, MobilitesStop[]>();

const createLayerGroups = () => ({
  [LAYER_IDS.bikeshare]: L.layerGroup(),
  [LAYER_IDS.annecySibraRoutes]: L.layerGroup(),
  [LAYER_IDS.annecySibraStops]: L.layerGroup(),
  [LAYER_IDS.annecyTerritory]: L.layerGroup(),
  [LAYER_IDS.annecySibraVehicles]: L.layerGroup(),
  [LAYER_IDS.schools74]: L.layerGroup(),
  [LAYER_IDS.schoolWalkingZones]: L.layerGroup(),
  [LAYER_IDS.schoolBusWalkingZones]: L.layerGroup(),
  [LAYER_IDS.inseeResidentialDensity]: L.layerGroup(),
});

const updateLayerPanes = () => {
  if (!mapInstance) {
    return;
  }
  const baseZIndex = 400;
  mapStore.layerOrder.forEach((layerId, index) => {
    const paneName = getPaneName(layerId);
    const pane = mapInstance?.getPane(paneName) ?? mapInstance?.createPane(paneName);
    if (!pane) {
      return;
    }
    pane.style.zIndex = String(baseZIndex + index);
    if (layerId === LAYER_IDS.schoolBusWalkingZones) {
      pane.style.opacity = String(BUS_WALK_PANE_OPACITY);
    } else {
      pane.style.opacity = '1';
    }
  });
};

const loadBikeshareStations = async (group: LayerGroup) => {
  try {
    const [infoResponse, statusResponse] = await Promise.all([
      fetch('/datasets/gbfs/station_information.json'),
      fetch('/datasets/gbfs/station_status.json'),
    ]);
    if (!infoResponse.ok || !statusResponse.ok) {
      return;
    }
    const info = await infoResponse.json();
    const status = await statusResponse.json();
    const statusById = new Map<string, { bikes: number; docks: number }>();
    (status?.data?.stations ?? []).forEach(
      (station: { station_id: string; num_bikes_available: number; num_docks_available: number }) => {
        statusById.set(station.station_id, {
          bikes: station.num_bikes_available ?? 0,
          docks: station.num_docks_available ?? 0,
        });
      }
    );

    (info?.data?.stations ?? []).forEach(
      (station: { station_id: string; name: string; lat: number; lon: number }) => {
        const availability = statusById.get(station.station_id) ?? { bikes: 0, docks: 0 };
        const color = availability.bikes > 5 ? '#22c55e' : availability.bikes > 0 ? '#f59e0b' : '#ef4444';
        L.circleMarker([station.lat, station.lon], {
          radius: 6,
          color,
          weight: 2,
          fillOpacity: 0.7,
          pane: getPaneName(LAYER_IDS.bikeshare),
        })
          .bindPopup(
            `<strong>${t('map.stationLabel')}</strong><br/>${station.name}<br/>${t('map.bikesAvailableLabel')}: ${availability.bikes}<br/>${t('map.docksAvailableLabel')}: ${availability.docks}`
          )
          .addTo(group);
      }
    );
  } catch (error) {
    console.warn('Failed to load bikeshare stations', error);
  }
};

const formatYesNo = (value: boolean) => (value ? t('ui.yes') : t('ui.no'));
const REALTIME_REFRESH_MS = 5000;

const getResidentialDensityColor = (density: number) => {
  const normalized = Number.isFinite(density) ? density : 0;
  return RESIDENTIAL_DENSITY_STOPS.find((stop) => normalized <= stop.max)?.color ?? '#c2410c';
};

const loadAnnecyTerritory = async (group: LayerGroup) => {
  try {
    const geojson = await fetchTerritoryOutline();
    L.geoJSON(geojson, {
      style: {
        color: COLORS.annecyTerritory,
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.05,
      },
      pane: getPaneName(LAYER_IDS.annecyTerritory),
    }).addTo(group);
  } catch (error) {
    console.warn('Failed to load Annecy territory', error);
  }
};

const loadResidentialDensity = async (group: LayerGroup) => {
  try {
    group.clearLayers();
    const response = await fetch('/datasets/insee/filosofi2015_carreaux_200m_74.geojson');
    if (!response.ok) {
      return;
    }
    const geojson = await response.json();
    L.geoJSON(geojson, {
      style: (feature) => {
        const density = Number(feature?.properties?.density ?? 0);
        return {
          color: 'transparent',
          weight: 0,
          fillColor: getResidentialDensityColor(density),
          fillOpacity: 0.55,
          pane: getPaneName(LAYER_IDS.inseeResidentialDensity),
        };
      },
      onEachFeature: (feature, layer) => {
        const density = Number(feature?.properties?.density ?? 0);
        const population = Number(feature?.properties?.population ?? 0);
        layer.bindPopup(
          `<strong>${t('layers.inseeResidentialDensity.label')}</strong><br/>${t('map.residentialDensityLabel')}: ${Math.round(density)} / km2<br/>${t('map.populationLabel')}: ${Math.round(population)}`
        );
      },
    }).addTo(group);
  } catch (error) {
    console.warn('Failed to load residential density', error);
  }
};

const loadAnnecySibraRoutes = async (group: LayerGroup) => {
  try {
    const init = await fetchInitApplication();
    const sibraLines = init.lines.filter((line) => line.network === 'SIBRA');
    await Promise.all(
      sibraLines.flatMap((line) =>
        line.routes.map(async (route) => {
          const cacheKey = `${route.id}~${init.hash}`;
          const cached = routeCache.get(cacheKey);
          const geojson = cached ?? (await fetchRouteGeoJson(route.id, init.hash));
          if (!cached) {
            routeCache.set(cacheKey, geojson);
          }
          const color = line.color ? `#${line.color}` : '#2563eb';
          L.geoJSON(geojson, {
            style: { color, weight: 3, opacity: 0.8 },
            pane: getPaneName(LAYER_IDS.annecySibraRoutes),
            onEachFeature: (_feature, layer) => {
              const label = `${t('map.lineLabel')} ${line.code}`;
              layer.bindPopup(
                `<strong>${label}</strong><br/>${line.name}<br/>${t('map.directionLabel')}: ${route.direction}`
              );
            },
          }).addTo(group);
        })
      )
    );
  } catch (error) {
    console.warn('Failed to load SIBRA routes', error);
  }
};

const loadAnnecySibraStops = async (group: LayerGroup) => {
  try {
    group.clearLayers();
    const init = await fetchInitApplication();
    const sibraLines = init.lines.filter((line) => line.network === 'SIBRA');
    let busWalkCache: SchoolBusWalkCache | null = null;
    try {
      busWalkCache = await getSchoolBusWalkCache();
    } catch (error) {
      console.warn('Failed to load bus walk cache for stops', error);
    }
    await Promise.all(
      sibraLines.flatMap((line) =>
        line.routes.map(async (route) => {
          const cacheKey = `${route.id}~${init.hash}`;
          const cached = stopsCache.get(cacheKey);
          const stops = cached ?? (await fetchStopsForRoute(route.id, init.hash));
          if (!cached) {
            stopsCache.set(cacheKey, stops);
          }
          stops.forEach((stop) => {
            const lat = Number(stop.coord.lat);
            const lon = Number(stop.coord.lon);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
              return;
            }
            const busWalkDemand = busWalkCache
              ? (() => {
                  const matchedId = findNearestGtfsStopId(lat, lon, busWalkCache.stopsById);
                  return matchedId ? busWalkCache.byStop.get(matchedId) ?? null : null;
                })()
              : null;
            const demandTotal = busWalkDemand ? Math.round(busWalkDemand.total) : 0;
            const demandDetails = busWalkDemand
              ? busWalkDemand.bySchool
                  .map((entry) => ({ schoolName: entry.schoolName, count: Math.round(entry.count) }))
                  .filter((entry) => entry.count > 0)
                  .sort((a, b) => b.count - a.count)
              : [];
            const demandHtml =
              demandDetails.length > 0
                ? `${t('map.busWalkDemandLabel')}: ${demandTotal}<br/>${t('map.busWalkSourcesLabel')}:<br/>${demandDetails
                    .map((entry) => `${entry.schoolName}: ${entry.count}`)
                    .join('<br/>')}`
                : `${t('map.busWalkDemandLabel')}: ${demandTotal}<br/>${t('map.busWalkNoneLabel')}`;

            L.circleMarker([lat, lon], {
              radius: stop.terminus ? 6 : 4,
              color: COLORS.annecyStops,
              weight: 2,
              fillOpacity: 0.7,
              pane: getPaneName(LAYER_IDS.annecySibraStops),
            })
              .bindPopup(
                `<strong>${t('map.stopLabel')}</strong><br/>${stop.name}<br/>${t('map.lineLabel')}: ${line.code}<br/>${t('map.directionLabel')}: ${route.direction}<br/>${t('map.accessibilityLabel')}: ${formatYesNo(stop.pmr)}<br/>${t('map.terminusLabel')}: ${formatYesNo(stop.terminus)}<br/>${demandHtml}`
              )
              .addTo(group);
          });
        })
      )
    );
  } catch (error) {
    console.warn('Failed to load SIBRA stops', error);
  }
};

const loadAnnecySibraVehicles = async (group: LayerGroup) => {
  try {
    const init = await fetchInitApplication();
    const sibraLines = init.lines.filter((line) => line.network === 'SIBRA');
    const lineByRouteId = new Map<string, { code: string; name: string; color: string }>();
    sibraLines.forEach((line) => {
      line.routes.forEach((route) => {
        lineByRouteId.set(route.route_id, {
          code: line.code,
          name: line.name,
          color: line.color,
        });
      });
    });
    const routeIds = Array.from(lineByRouteId.keys());

    const animateMarker = (id: string, marker: L.CircleMarker, toLat: number, toLon: number) => {
      const from = marker.getLatLng();
      const start = performance.now();
      const duration = 1000;
      const previous = vehicleAnimations.get(id);
      if (previous) {
        cancelAnimationFrame(previous);
      }
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const lat = from.lat + (toLat - from.lat) * t;
        const lon = from.lng + (toLon - from.lng) * t;
        marker.setLatLng([lat, lon]);
        if (t < 1) {
          vehicleAnimations.set(id, requestAnimationFrame(step));
        } else {
          vehicleAnimations.delete(id);
        }
      };
      vehicleAnimations.set(id, requestAnimationFrame(step));
    };

    const refresh = async () => {
      const responses = await Promise.all(
        routeIds.map(async (routeId) => {
          try {
            return { routeId, data: await fetchVehiclePositions(routeId) };
          } catch (error) {
            console.warn('Failed to load vehicles for route', routeId, error);
            return null;
          }
        })
      );

      const activeVehicleIds = new Set<string>();

      responses.filter(Boolean).forEach((item) => {
        if (!item) {
          return;
        }
        const { routeId, data } = item as { routeId: string; data: VehiclesResponse };
        const lineInfo = lineByRouteId.get(routeId);
        const color = lineInfo?.color ? `#${lineInfo.color}` : COLORS.annecyVehicles;
        (data.vehicles || []).forEach((vehicle) => {
          const lat = vehicle.position?.latitude;
          const lon = vehicle.position?.longitude;
          if (!lat || !lon) {
            return;
          }
          const vehicleId = vehicle.vehicle?.id || vehicle.vehicle?.label || `${routeId}-${lat}-${lon}`;
          activeVehicleIds.add(vehicleId);
          const lineLabel = lineInfo ? `${t('map.lineLabel')} ${lineInfo.code}` : t('map.lineLabel');
          const vehicleLabel = vehicle.vehicle?.label || vehicle.vehicle?.id || '';
          const popup = `<strong>${t('map.vehicleLabel')}</strong><br/>${vehicleLabel}<br/>${lineLabel}: ${lineInfo?.name ?? ''}<br/>${t('map.statusLabel')}: ${vehicle.currentStatus ?? ''}<br/>${t('map.occupancyLabel')}: ${vehicle.occupancyStatus ?? ''}`;
          const existing = vehicleMarkers.get(vehicleId);
          if (existing) {
            existing.setStyle({ color });
            existing.bindPopup(popup);
            animateMarker(vehicleId, existing, lat, lon);
            return;
          }
          const marker = L.circleMarker([lat, lon], {
            radius: 5,
            color,
            weight: 2,
            fillOpacity: 0.8,
            pane: getPaneName(LAYER_IDS.annecySibraVehicles),
          })
            .bindPopup(popup)
            .addTo(group);
          vehicleMarkers.set(vehicleId, marker);
        });
      });

      vehicleMarkers.forEach((marker, id) => {
        if (activeVehicleIds.has(id)) {
          return;
        }
        marker.remove();
        vehicleMarkers.delete(id);
        const anim = vehicleAnimations.get(id);
        if (anim) {
          cancelAnimationFrame(anim);
          vehicleAnimations.delete(id);
        }
      });
    };

    await refresh();
    vehiclesRefreshId = window.setInterval(refresh, REALTIME_REFRESH_MS);
  } catch (error) {
    console.warn('Failed to load SIBRA vehicles', error);
  }
};

const getSchoolsData = async () => {
  if (schoolRecordsCache) {
    return schoolRecordsCache;
  }
  const schools = await fetchSchools74();
  schoolRecordsCache = schools;
  return schools;
};

const getSchoolEnrollments = async (schools: EducationRecord[]) => {
  let enrollments = schoolEnrollmentCache ?? new Map<string, SchoolEnrollment>();
  if (!schoolEnrollmentCache) {
    try {
      enrollments = await fetchSchoolEnrollmentsByUai(schools.map((school) => school.numero_uai));
      schoolEnrollmentCache = enrollments;
    } catch (error) {
      console.warn('Failed to load school enrollments', error);
    }
  }
  return enrollments;
};

const getSchoolCategory = (type: string) => {
  if (type.startsWith('ECOLE')) {
    return 'primary';
  }
  if (type === 'COLLEGE') {
    return 'college';
  }
  if (type.startsWith('LYCEE')) {
    return 'lycee';
  }
  return 'primary';
};

const getActivePersonaSchoolCategories = () => {
  const active = personas.find((persona) => persona.id === mapStore.activePersonaId) ?? personas[0];
  return active?.schoolCategories ?? ['primary', 'college', 'lycee'];
};

const getFallbackEnrollment = (type: string) => {
  if (type.startsWith('ECOLE')) {
    return 112;
  }
  if (type === 'COLLEGE') {
    return 470;
  }
  if (type === 'LYCEE PROFESSIONNEL') {
    return 400;
  }
  if (type.startsWith('LYCEE')) {
    return 700;
  }
  return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const findNearestGtfsStopId = (lat: number, lon: number, stopsById: Map<string, GtfsStop>) => {
  let nearestId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  stopsById.forEach((stop) => {
    const distance = distanceMeters(lat, lon, stop.lat, stop.lon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = stop.id;
    }
  });
  if (nearestId && nearestDistance <= MAX_GTFS_STOP_MATCH_METERS) {
    return nearestId;
  }
  return null;
};

class MinHeap<T> {
  private heap: Array<{ key: number; value: T }> = [];

  get size() {
    return this.heap.length;
  }

  push(key: number, value: T) {
    const node = { key, value };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) {
      return null;
    }
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return root;
  }

  private bubbleUp(index: number) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.heap[parent].key <= this.heap[current].key) {
        break;
      }
      [this.heap[parent], this.heap[current]] = [this.heap[current], this.heap[parent]];
      current = parent;
    }
  }

  private bubbleDown(index: number) {
    let current = index;
    const length = this.heap.length;
    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;
      if (left < length && this.heap[left].key < this.heap[smallest].key) {
        smallest = left;
      }
      if (right < length && this.heap[right].key < this.heap[smallest].key) {
        smallest = right;
      }
      if (smallest === current) {
        break;
      }
      [this.heap[current], this.heap[smallest]] = [this.heap[smallest], this.heap[current]];
      current = smallest;
    }
  }
}

const getGtfsStops = async () => {
  if (gtfsStopsCache) {
    return gtfsStopsCache;
  }
  const stops = await fetchGtfsStops();
  const map = new Map<string, GtfsStop>();
  stops.forEach((stop) => map.set(stop.id, stop));
  gtfsStopsCache = map;
  return map;
};

const getGtfsGraph = async () => {
  if (gtfsGraphCache) {
    return gtfsGraphCache;
  }
  const stopTimes = await fetchGtfsStopTimes();
  const graph = buildBusStopGraph(stopTimes);
  gtfsGraphCache = graph;
  return graph;
};

const DIJKSTRA_BUCKET_SECONDS = 60;

const buildDijkstraCacheKey = (sourceStopId: string, cutoffSeconds: number) => {
  const bucket = Math.floor(cutoffSeconds / DIJKSTRA_BUCKET_SECONDS);
  return `${sourceStopId}:${bucket}`;
};

const runDijkstra = (graph: BusStopGraph, sourceStopId: string, cutoffSeconds: number) => {
  const cacheKey = buildDijkstraCacheKey(sourceStopId, cutoffSeconds);
  const cached = gtfsDijkstraCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const distances = new Map<string, number>();
  const queue = new MinHeap<string>();
  distances.set(sourceStopId, 0);
  queue.push(0, sourceStopId);

  while (queue.size > 0) {
    const next = queue.pop();
    if (!next) {
      break;
    }
    const { key: currentDistance, value: stopId } = next;
    if (currentDistance > cutoffSeconds) {
      continue;
    }
    if (currentDistance !== distances.get(stopId)) {
      continue;
    }
    const edges = graph.get(stopId) ?? [];
    edges.forEach((edge) => {
      const candidate = currentDistance + edge.travelSeconds;
      if (candidate > cutoffSeconds) {
        return;
      }
      const existing = distances.get(edge.toStopId);
      if (existing === undefined || candidate < existing) {
        distances.set(edge.toStopId, candidate);
        queue.push(candidate, edge.toStopId);
      }
    });
  }

  gtfsDijkstraCache.set(cacheKey, distances);
  return distances;
};

const buildSchoolBusWalkCacheKey = () =>
  `${mapStore.activePersonaId}:${mapStore.walkingMinutes}:${mapStore.busWalkMaxMinutes}`;

const buildSchoolBusWalkCache = async (): Promise<SchoolBusWalkCache> => {
  const [schools, stopsById, graph] = await Promise.all([getSchoolsData(), getGtfsStops(), getGtfsGraph()]);
  const enrollments = await getSchoolEnrollments(schools);
  const maxTotalSeconds = mapStore.busWalkMaxMinutes * 60;
  const byStop = new Map<string, BusWalkStopDemand>();
  const bySchool = new Map<string, BusWalkTarget[]>();
  const activeCategories = getActivePersonaSchoolCategories();

  if (maxTotalSeconds <= 0) {
    return {
      key: buildSchoolBusWalkCacheKey(),
      byStop,
      bySchool,
      stopsById,
    };
  }

  schools.forEach((school) => {
    const lat = Number(school.latitude);
    const lon = Number(school.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return;
    }
    const category = getSchoolCategory(school.nature_uai_libe);
    if (!activeCategories.includes(category)) {
      return;
    }
    const speedKmH = SCHOOL_WALKING_SPEED_KMH[category];
    const speedMps = (speedKmH * 1000) / 3600;
    const schoolRadiusMeters = (speedKmH * mapStore.walkingMinutes * 1000) / 60;
    const enrollment = enrollments.get(school.numero_uai);
    const fallbackEnrollment = getFallbackEnrollment(school.nature_uai_libe);
    const totalEnrollment = enrollment?.total ?? fallbackEnrollment ?? 0;
    const busShare = SCHOOL_PUBLIC_TRANSPORT_SHARE[category];
    if (totalEnrollment <= 0 || busShare <= 0) {
      return;
    }

    const sourceStops: Array<{ stopId: string; walkSeconds: number }> = [];
    stopsById.forEach((stop) => {
      const distance = distanceMeters(lat, lon, stop.lat, stop.lon);
      if (distance <= schoolRadiusMeters) {
        sourceStops.push({ stopId: stop.id, walkSeconds: distance / speedMps });
      }
    });
    if (sourceStops.length === 0) {
      return;
    }

    const bestTotalSecondsByStop = new Map<string, number>();
    sourceStops.forEach((source) => {
      const cutoffSeconds = maxTotalSeconds - source.walkSeconds;
      if (cutoffSeconds <= 0) {
        return;
      }
      const distances = runDijkstra(graph, source.stopId, cutoffSeconds);
      distances.forEach((busSeconds, stopId) => {
        const totalSeconds = source.walkSeconds + busSeconds;
        if (totalSeconds > maxTotalSeconds) {
          return;
        }
        const current = bestTotalSecondsByStop.get(stopId);
        if (current === undefined || totalSeconds < current) {
          bestTotalSecondsByStop.set(stopId, totalSeconds);
        }
      });
    });

    const targets = Array.from(bestTotalSecondsByStop.entries())
      .map(([stopId, totalSeconds]) => {
        const remainingSeconds = maxTotalSeconds - totalSeconds;
        const remainingRatio = remainingSeconds / maxTotalSeconds;
        const radiusMeters = remainingSeconds * speedMps;
        const busWalkers = totalEnrollment * busShare * remainingRatio;
        const baseOpacity = Math.min(1, busWalkers / MAX_BUS_WALKERS_FOR_OPACITY);
        return { stopId, radiusMeters, baseOpacity, busWalkers, remainingSeconds };
      })
      .filter((target) => target.radiusMeters >= MIN_BUS_WALK_RADIUS_METERS && target.baseOpacity > 0)
      .sort((a, b) => b.remainingSeconds - a.remainingSeconds)
      .slice(0, MAX_BUS_WALK_TARGET_STOPS);

    if (targets.length === 0) {
      return;
    }

    const schoolId = school.numero_uai;
    const schoolName = school.appellation_officielle;
    bySchool.set(
      schoolId,
      targets.map((target) => ({
        stopId: target.stopId,
        radiusMeters: target.radiusMeters,
        baseOpacity: target.baseOpacity,
        busWalkers: target.busWalkers,
      }))
    );

    targets.forEach((target) => {
      const entry = byStop.get(target.stopId) ?? { total: 0, bySchool: [], entries: [] };
      entry.total += target.busWalkers;
      entry.bySchool.push({ schoolName, count: target.busWalkers });
      entry.entries.push({ radiusMeters: target.radiusMeters, baseOpacity: target.baseOpacity });
      byStop.set(target.stopId, entry);
    });
  });

  return {
    key: buildSchoolBusWalkCacheKey(),
    byStop,
    bySchool,
    stopsById,
  };
};

const getSchoolBusWalkCache = async () => {
  const key = buildSchoolBusWalkCacheKey();
  if (schoolBusWalkCache && schoolBusWalkCache.key === key) {
    return schoolBusWalkCache;
  }
  const cache = await buildSchoolBusWalkCache();
  schoolBusWalkCache = cache;
  return cache;
};

const loadSchools74 = async (group: LayerGroup) => {
  try {
    group.clearLayers();
    const schools = await getSchoolsData();
    const enrollments = await getSchoolEnrollments(schools);
    const activeCategories = getActivePersonaSchoolCategories();
    schools.forEach((school) => {
      const lat = Number(school.latitude);
      const lon = Number(school.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return;
      }
      const type = school.nature_uai_libe;
      const category = getSchoolCategory(type);
      if (!activeCategories.includes(category)) {
        return;
      }
      const isPrimarySchool = type.startsWith('ECOLE');
      const color =
        isPrimarySchool
          ? COLORS.schoolPrimary
          : type === 'COLLEGE'
            ? COLORS.schoolCollege
            : type === 'LYCEE PROFESSIONNEL'
              ? COLORS.schoolLyceePro
              : COLORS.schoolLycee;
      const enrollment = enrollments.get(school.numero_uai);
      const fallbackEnrollment = getFallbackEnrollment(type);
      const enrollmentLabel = enrollment
        ? `${enrollment.total} (${enrollment.schoolYear})`
        : fallbackEnrollment
          ? `${fallbackEnrollment} (${t('map.enrollmentEstimatedLabel')})`
          : t('map.enrollmentUnavailableLabel');
      L.circleMarker([lat, lon], {
        radius: 6,
        color,
        weight: 2,
        fillOpacity: 0.7,
        pane: getPaneName(LAYER_IDS.schools74),
      })
        .bindPopup(
          `<strong>${t('map.schoolLabel')}</strong><br/>${school.appellation_officielle}<br/>${t('map.schoolTypeLabel')}: ${type}<br/>${t('map.schoolCityLabel')}: ${school.libelle_commune}<br/>${t('map.schoolEnrollmentLabel')}: ${enrollmentLabel}`
        )
        .addTo(group);
    });
  } catch (error) {
    console.warn('Failed to load schools 74', error);
  }
};

const MAX_WALKERS_FOR_OPACITY = 500;
const MAX_BUS_WALKERS_FOR_OPACITY = 1000;
const WALKING_ZONE_RINGS = 5;

const loadSchoolWalkingZones = async (group: LayerGroup) => {
  try {
    group.clearLayers();
    const schools = await getSchoolsData();
    const enrollments = await getSchoolEnrollments(schools);
    const minutes = mapStore.walkingMinutes;
    const activeCategories = getActivePersonaSchoolCategories();

    schools.forEach((school) => {
      const lat = Number(school.latitude);
      const lon = Number(school.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return;
      }
      const type = school.nature_uai_libe;
      const category = getSchoolCategory(type);
      if (!activeCategories.includes(category)) {
        return;
      }
      const speed = SCHOOL_WALKING_SPEED_KMH[category];
      const radiusMeters = (speed * minutes * 1000) / 60;
      const enrollment = enrollments.get(school.numero_uai);
      const fallbackEnrollment = getFallbackEnrollment(type);
      const totalEnrollment = enrollment?.total ?? fallbackEnrollment ?? 0;
      const walkers = totalEnrollment * SCHOOL_WALKING_SHARE[category];
      const baseOpacity = Math.min(0.6, (walkers / MAX_WALKERS_FOR_OPACITY) * 0.6);
      if (baseOpacity <= 0 || radiusMeters <= 0) {
        return;
      }

      for (let ring = 1; ring <= WALKING_ZONE_RINGS; ring += 1) {
        const ratio = ring / WALKING_ZONE_RINGS;
        const ringOpacity = baseOpacity * (1 - ratio);
        L.circle([lat, lon], {
          radius: radiusMeters * ratio,
          color: '#2563eb',
          weight: 0,
          fillColor: '#2563eb',
          fillOpacity: ringOpacity,
          pane: getPaneName(LAYER_IDS.schoolWalkingZones),
        }).addTo(group);
      }
    });
  } catch (error) {
    console.warn('Failed to load school walking zones', error);
  }
};

const MAX_BUS_WALK_TARGET_STOPS = 300;
const MIN_BUS_WALK_RADIUS_METERS = 150;
const BUS_WALK_ZONE_RINGS = 4;
const MAX_GTFS_STOP_MATCH_METERS = 80;

type BusWalkTarget = {
  stopId: string;
  radiusMeters: number;
  baseOpacity: number;
  busWalkers: number;
};

type BusWalkStopDemand = {
  total: number;
  bySchool: Array<{ schoolName: string; count: number }>;
  entries: Array<{ radiusMeters: number; baseOpacity: number }>;
};

type SchoolBusWalkCache = {
  key: string;
  byStop: Map<string, BusWalkStopDemand>;
  bySchool: Map<string, BusWalkTarget[]>;
};

let schoolBusWalkCache: SchoolBusWalkCache | null = null;

const loadSchoolBusWalkingZones = async (group: LayerGroup) => {
  try {
    group.clearLayers();
    const cache = await getSchoolBusWalkCache();
    cache.byStop.forEach((demand, stopId) => {
      const stop = cache.stopsById.get(stopId);
      if (!stop) {
        return;
      }
      const maxRadius = demand.entries.reduce((max, entry) => Math.max(max, entry.radiusMeters), 0);
      if (maxRadius <= 0) {
        return;
      }
      for (let ring = 1; ring <= BUS_WALK_ZONE_RINGS; ring += 1) {
        const ratio = ring / BUS_WALK_ZONE_RINGS;
        const ringRadius = maxRadius * ratio;
        let ringOpacity = 0;
        demand.entries.forEach((entry) => {
          if (entry.radiusMeters >= ringRadius) {
            ringOpacity += entry.baseOpacity;
            return;
          }
          if (entry.radiusMeters > 0) {
            ringOpacity += entry.baseOpacity * (entry.radiusMeters / ringRadius);
          }
        });
        ringOpacity = Math.min(1, ringOpacity) * (1 - ratio);
        if (ringOpacity <= 0) {
          continue;
        }
        L.circle([stop.lat, stop.lon], {
          radius: ringRadius,
          color: '#f97316',
          weight: 0,
          fillColor: '#f97316',
          fillOpacity: ringOpacity,
          pane: getPaneName(LAYER_IDS.schoolBusWalkingZones),
        }).addTo(group);
      }
    });
  } catch (error) {
    console.warn('Failed to load school bus walking zones', error);
  }
};

const syncLayerVisibility = () => {
  if (!mapInstance || !layerGroups) {
    return;
  }
  Object.values(layerGroups).forEach((group) => {
    if (mapInstance && mapInstance.hasLayer(group)) {
      mapInstance.removeLayer(group);
    }
  });

  mapStore.layerOrder.forEach((id) => {
    const group = layerGroups?.[id];
    if (!group) {
      return;
    }
    if (mapStore.activeLayerIds.includes(id)) {
      group.addTo(mapInstance);
    }
  });
};

const initializeLayers = () => {
  layerGroups = createLayerGroups();
  bikeshareLayer = layerGroups[LAYER_IDS.bikeshare];
  loadBikeshareStations(bikeshareLayer);
  ensureAnnecyLayers();
  syncLayerVisibility();
};

const ensureAnnecyLayers = () => {
  if (!layerGroups) {
    return;
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraRoutes) && !annecyRoutesLoaded) {
    annecyRoutesLoaded = true;
    loadAnnecySibraRoutes(layerGroups[LAYER_IDS.annecySibraRoutes]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraStops) && !annecyStopsLoaded) {
    annecyStopsLoaded = true;
    loadAnnecySibraStops(layerGroups[LAYER_IDS.annecySibraStops]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.annecyTerritory) && !annecyTerritoryLoaded) {
    annecyTerritoryLoaded = true;
    loadAnnecyTerritory(layerGroups[LAYER_IDS.annecyTerritory]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraVehicles) && !annecyVehiclesLoaded) {
    annecyVehiclesLoaded = true;
    loadAnnecySibraVehicles(layerGroups[LAYER_IDS.annecySibraVehicles]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.schools74) && !schoolsLoaded) {
    schoolsLoaded = true;
    loadSchools74(layerGroups[LAYER_IDS.schools74]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolWalkingZones) && !schoolZonesLoaded) {
    schoolZonesLoaded = true;
    loadSchoolWalkingZones(layerGroups[LAYER_IDS.schoolWalkingZones]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolBusWalkingZones) && !schoolBusZonesLoaded) {
    schoolBusZonesLoaded = true;
    loadSchoolBusWalkingZones(layerGroups[LAYER_IDS.schoolBusWalkingZones]);
  }
  if (mapStore.activeLayerIds.includes(LAYER_IDS.inseeResidentialDensity) && !residentialDensityLoaded) {
    residentialDensityLoaded = true;
    loadResidentialDensity(layerGroups[LAYER_IDS.inseeResidentialDensity]);
  }
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraVehicles)) {
    stopVehiclesRefresh();
    layerGroups[LAYER_IDS.annecySibraVehicles].clearLayers();
    annecyVehiclesLoaded = false;
  }
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.schools74)) {
    layerGroups[LAYER_IDS.schools74].clearLayers();
    schoolsLoaded = false;
  }
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.schoolWalkingZones)) {
    layerGroups[LAYER_IDS.schoolWalkingZones].clearLayers();
    schoolZonesLoaded = false;
  }
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.schoolBusWalkingZones)) {
    layerGroups[LAYER_IDS.schoolBusWalkingZones].clearLayers();
    schoolBusZonesLoaded = false;
  }
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.inseeResidentialDensity)) {
    layerGroups[LAYER_IDS.inseeResidentialDensity].clearLayers();
    residentialDensityLoaded = false;
  }
};

const stopVehiclesRefresh = () => {
  if (vehiclesRefreshId) {
    window.clearInterval(vehiclesRefreshId);
    vehiclesRefreshId = null;
  }
  vehicleMarkers.forEach((marker) => marker.remove());
  vehicleMarkers.clear();
  vehicleAnimations.forEach((id) => cancelAnimationFrame(id));
  vehicleAnimations.clear();
};

const resetAnnecyLayers = () => {
  annecyRoutesLoaded = false;
  annecyStopsLoaded = false;
  annecyTerritoryLoaded = false;
  annecyVehiclesLoaded = false;
  schoolsLoaded = false;
  schoolZonesLoaded = false;
  schoolBusZonesLoaded = false;
  residentialDensityLoaded = false;
  gtfsStopsCache = null;
  gtfsGraphCache = null;
  gtfsDijkstraCache.clear();
  schoolBusWalkCache = null;
  schoolRecordsCache = null;
  schoolEnrollmentCache = null;
  stopVehiclesRefresh();
};

const rebuildLayers = () => {
  if (!mapInstance || !layerGroups) {
    return;
  }
  Object.values(layerGroups).forEach((group) => {
    if (mapInstance && mapInstance.hasLayer(group)) {
      mapInstance.removeLayer(group);
    }
  });
  resetAnnecyLayers();
  initializeLayers();
};

onMounted(() => {
  if (!mapElement.value) {
    return;
  }

  mapInstance = L.map(mapElement.value, {
    zoomControl: true,
  }).setView(MAP_CONSTANTS.center, MAP_CONSTANTS.zoom);

  mapInstance.on('click', () => emit('map-interaction'));
  mapInstance.on('dragstart', () => emit('map-interaction'));
  mapInstance.on('zoomstart', () => emit('map-interaction'));

  updateLayerPanes();

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(mapInstance);

  initializeLayers();
});

watch(
  () => mapStore.activeLayerIds,
  () => {
    ensureAnnecyLayers();
    syncLayerVisibility();
  },
  { deep: true }
);

watch(
  () => mapStore.layerOrder,
  () => {
    updateLayerPanes();
    syncLayerVisibility();
  },
  { deep: true }
);

watch(
  () => currentLanguage.value,
  () => {
    rebuildLayers();
  }
);

watch(
  () => mapStore.walkingMinutes,
  () => {
    if (!layerGroups) {
      return;
    }
    schoolBusWalkCache = null;
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolWalkingZones)) {
      loadSchoolWalkingZones(layerGroups[LAYER_IDS.schoolWalkingZones]);
    }
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolBusWalkingZones)) {
      loadSchoolBusWalkingZones(layerGroups[LAYER_IDS.schoolBusWalkingZones]);
    }
    if (mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraStops)) {
      annecyStopsLoaded = false;
      loadAnnecySibraStops(layerGroups[LAYER_IDS.annecySibraStops]);
    }
  }
);

watch(
  () => mapStore.busWalkMaxMinutes,
  () => {
    if (!layerGroups) {
      return;
    }
    schoolBusWalkCache = null;
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolBusWalkingZones)) {
      loadSchoolBusWalkingZones(layerGroups[LAYER_IDS.schoolBusWalkingZones]);
    }
    if (mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraStops)) {
      annecyStopsLoaded = false;
      loadAnnecySibraStops(layerGroups[LAYER_IDS.annecySibraStops]);
    }
  }
);

watch(
  () => mapStore.activePersonaId,
  () => {
    if (!layerGroups) {
      return;
    }
    schoolBusWalkCache = null;
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schools74)) {
      loadSchools74(layerGroups[LAYER_IDS.schools74]);
    }
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolWalkingZones)) {
      loadSchoolWalkingZones(layerGroups[LAYER_IDS.schoolWalkingZones]);
    }
    if (mapStore.activeLayerIds.includes(LAYER_IDS.schoolBusWalkingZones)) {
      loadSchoolBusWalkingZones(layerGroups[LAYER_IDS.schoolBusWalkingZones]);
    }
  }
);

onBeforeUnmount(() => {
  mapInstance?.remove();
  mapInstance = null;
  layerGroups = null;
  bikeshareLayer = null;
  resetAnnecyLayers();
});
</script>
