<template>
  <div ref="mapElement" class="h-full w-full"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet';
import { useI18n } from '../i18n';
import { useMapStore } from '../stores/mapStore';
import { LAYER_IDS, MAP_CONSTANTS } from '../data/sampleData';
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

const mapElement = ref<HTMLDivElement | null>(null);
const mapStore = useMapStore();
const { t, currentLanguage } = useI18n();

const COLORS = {
  annecyStops: '#2563eb',
  annecyTerritory: '#64748b',
  annecyVehicles: '#0f172a',
} as const;

let mapInstance: LeafletMap | null = null;
let layerGroups: Record<string, LayerGroup> | null = null;
let bikeshareLayer: LayerGroup | null = null;
let annecyRoutesLoaded = false;
let annecyStopsLoaded = false;
let annecyTerritoryLoaded = false;
let annecyVehiclesLoaded = false;
let vehiclesRefreshId: number | null = null;

const routeCache = new Map<string, GeoJsonFeatureCollection>();
const stopsCache = new Map<string, MobilitesStop[]>();

const createLayerGroups = () => ({
  [LAYER_IDS.bikeshare]: L.layerGroup(),
  [LAYER_IDS.annecySibraRoutes]: L.layerGroup(),
  [LAYER_IDS.annecySibraStops]: L.layerGroup(),
  [LAYER_IDS.annecyTerritory]: L.layerGroup(),
  [LAYER_IDS.annecySibraVehicles]: L.layerGroup(),
});

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
const REALTIME_REFRESH_MS = 1000;

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
    }).addTo(group);
  } catch (error) {
    console.warn('Failed to load Annecy territory', error);
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
    const init = await fetchInitApplication();
    const sibraLines = init.lines.filter((line) => line.network === 'SIBRA');
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
            L.circleMarker([lat, lon], {
              radius: stop.terminus ? 6 : 4,
              color: COLORS.annecyStops,
              weight: 2,
              fillOpacity: 0.7,
            })
              .bindPopup(
                `<strong>${t('map.stopLabel')}</strong><br/>${stop.name}<br/>${t('map.lineLabel')}: ${line.code}<br/>${t('map.directionLabel')}: ${route.direction}<br/>${t('map.accessibilityLabel')}: ${formatYesNo(stop.pmr)}<br/>${t('map.terminusLabel')}: ${formatYesNo(stop.terminus)}`
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

    const refresh = async () => {
      group.clearLayers();
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
          const lineLabel = lineInfo ? `${t('map.lineLabel')} ${lineInfo.code}` : t('map.lineLabel');
          const vehicleLabel = vehicle.vehicle?.label || vehicle.vehicle?.id || '';
          L.circleMarker([lat, lon], {
            radius: 5,
            color,
            weight: 2,
            fillOpacity: 0.8,
          })
            .bindPopup(
              `<strong>${t('map.vehicleLabel')}</strong><br/>${vehicleLabel}<br/>${lineLabel}: ${lineInfo?.name ?? ''}<br/>${t('map.statusLabel')}: ${vehicle.currentStatus ?? ''}<br/>${t('map.occupancyLabel')}: ${vehicle.occupancyStatus ?? ''}`
            )
            .addTo(group);
        });
      });
    };

    await refresh();
    vehiclesRefreshId = window.setInterval(refresh, REALTIME_REFRESH_MS);
  } catch (error) {
    console.warn('Failed to load SIBRA vehicles', error);
  }
};

const syncLayerVisibility = () => {
  if (!mapInstance || !layerGroups) {
    return;
  }

  Object.entries(layerGroups).forEach(([id, group]) => {
    const shouldShow = mapStore.activeLayerIds.includes(id);
    if (shouldShow && !mapInstance.hasLayer(group)) {
      group.addTo(mapInstance);
      return;
    }
    if (!shouldShow && mapInstance.hasLayer(group)) {
      mapInstance.removeLayer(group);
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
  if (!mapStore.activeLayerIds.includes(LAYER_IDS.annecySibraVehicles)) {
    stopVehiclesRefresh();
    layerGroups[LAYER_IDS.annecySibraVehicles].clearLayers();
    annecyVehiclesLoaded = false;
  }
};

const stopVehiclesRefresh = () => {
  if (vehiclesRefreshId) {
    window.clearInterval(vehiclesRefreshId);
    vehiclesRefreshId = null;
  }
};

const resetAnnecyLayers = () => {
  annecyRoutesLoaded = false;
  annecyStopsLoaded = false;
  annecyTerritoryLoaded = false;
  annecyVehiclesLoaded = false;
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
  () => currentLanguage.value,
  () => {
    rebuildLayers();
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
