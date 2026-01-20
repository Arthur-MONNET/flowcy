export type MobilitesRoute = {
  id: string;
  name: string;
  direction: string;
  direction_id: string;
  route_id: string;
};

export type MobilitesLine = {
  id: string;
  code: string;
  name: string;
  color: string;
  text: string;
  mode: string;
  cat: string;
  network: string;
  routes: MobilitesRoute[];
};

export type MobilitesInit = {
  hash: string;
  lines: MobilitesLine[];
};

export type MobilitesStop = {
  index: number;
  name: string;
  coord: { lat: string; lon: string };
  id: string;
  pmr: boolean;
  sens: string;
  stop_area: string;
  terminus: boolean;
};

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: string; coordinates: unknown };
    properties?: Record<string, unknown>;
  }>;
};

export type VehiclePosition = {
  trip?: {
    routeId?: string;
    directionId?: number;
    tripId?: string;
  };
  position?: {
    latitude?: number;
    longitude?: number;
    bearing?: number;
    speed?: number;
  };
  currentStatus?: string;
  timestamp?: string;
  stopId?: string;
  vehicle?: {
    id?: string;
    label?: string;
  };
  occupancyStatus?: string;
};

export type VehiclesResponse = {
  vehicles: VehiclePosition[];
};

const BASE_URL = 'https://annecy-mobilites.latitude-cartagene.com';

let initCache: MobilitesInit | null = null;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const fetchInitApplication = async (): Promise<MobilitesInit> => {
  if (initCache) {
    return initCache;
  }
  const data = await fetchJson<MobilitesInit>(`${BASE_URL}/api/init-application`);
  initCache = data;
  return data;
};

export const fetchTerritoryOutline = async () => {
  return fetchJson<GeoJsonFeatureCollection>(
    `${BASE_URL}/api/file?name=territory_outline&folder=map&ext=geojson`
  );
};

export const fetchRouteGeoJson = async (routeId: string, hash: string) => {
  return fetchJson<GeoJsonFeatureCollection>(
    `${BASE_URL}/api/file?folder=routes&ext=geojson&name=${routeId}~${hash}`
  );
};

export const fetchStopsForRoute = async (routeId: string, hash: string) => {
  return fetchJson<MobilitesStop[]>(
    `${BASE_URL}/api/file?name=${routeId}~${hash}&folder=stops&ext=json`
  );
};

export const fetchVehiclePositions = async (routeId: string) => {
  return fetchJson<VehiclesResponse>(`${BASE_URL}/api/vehicles-positions?route_id=${routeId}`);
};
