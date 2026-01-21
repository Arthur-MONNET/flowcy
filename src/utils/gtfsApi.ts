const GTFS_BASE_PATH = '/datasets/gtfs/sibra';

export type GtfsStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type GtfsTrip = {
  id: string;
  routeId: string;
  serviceId: string;
};

export type GtfsStopTime = {
  tripId: string;
  stopId: string;
  stopSequence: number;
  arrivalSeconds: number;
  departureSeconds: number;
};

export type BusStopEdge = {
  toStopId: string;
  travelSeconds: number;
};

export type BusStopGraph = Map<string, BusStopEdge[]>;

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
};

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
};

const parseTimeToSeconds = (value: string) => {
  if (!value) {
    return null;
  }
  const parts = value.split(':').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

const fetchText = async (path: string) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GTFS fetch error: ${response.status}`);
  }
  return response.text();
};

export const fetchGtfsStops = async (): Promise<GtfsStop[]> => {
  const text = await fetchText(`${GTFS_BASE_PATH}/stops.txt`);
  return parseCsv(text)
    .map((record) => ({
      id: record.stop_id,
      name: record.stop_name,
      lat: Number(record.stop_lat),
      lon: Number(record.stop_lon),
    }))
    .filter((stop) => stop.id && Number.isFinite(stop.lat) && Number.isFinite(stop.lon));
};

export const fetchGtfsTrips = async (): Promise<GtfsTrip[]> => {
  const text = await fetchText(`${GTFS_BASE_PATH}/trips.txt`);
  return parseCsv(text)
    .map((record) => ({
      id: record.trip_id,
      routeId: record.route_id,
      serviceId: record.service_id,
    }))
    .filter((trip) => trip.id && trip.routeId);
};

export const fetchGtfsStopTimes = async (): Promise<GtfsStopTime[]> => {
  const text = await fetchText(`${GTFS_BASE_PATH}/stop_times.txt`);
  return parseCsv(text)
    .map((record) => {
      const arrivalSeconds = parseTimeToSeconds(record.arrival_time);
      const departureSeconds = parseTimeToSeconds(record.departure_time);
      return {
        tripId: record.trip_id,
        stopId: record.stop_id,
        stopSequence: Number(record.stop_sequence),
        arrivalSeconds: arrivalSeconds ?? -1,
        departureSeconds: departureSeconds ?? -1,
      };
    })
    .filter((item) => item.tripId && item.stopId && Number.isFinite(item.stopSequence));
};

export const buildBusStopGraph = (
  stopTimes: GtfsStopTime[]
): BusStopGraph => {
  const edgesByStop = new Map<string, Map<string, number>>();
  const timesByTrip = new Map<string, GtfsStopTime[]>();

  stopTimes.forEach((entry) => {
    const list = timesByTrip.get(entry.tripId) ?? [];
    list.push(entry);
    timesByTrip.set(entry.tripId, list);
  });

  timesByTrip.forEach((entries) => {
    entries.sort((a, b) => a.stopSequence - b.stopSequence);
    for (let i = 0; i < entries.length - 1; i += 1) {
      const from = entries[i];
      const to = entries[i + 1];
      const depart = from.departureSeconds >= 0 ? from.departureSeconds : from.arrivalSeconds;
      const arrive = to.arrivalSeconds >= 0 ? to.arrivalSeconds : to.departureSeconds;
      if (depart < 0 || arrive < 0) {
        continue;
      }
      const travelSeconds = arrive - depart;
      if (travelSeconds <= 0) {
        continue;
      }
      const fromMap = edgesByStop.get(from.stopId) ?? new Map<string, number>();
      const current = fromMap.get(to.stopId);
      if (current === undefined || travelSeconds < current) {
        fromMap.set(to.stopId, travelSeconds);
      }
      edgesByStop.set(from.stopId, fromMap);
    }
  });

  const graph: BusStopGraph = new Map();
  edgesByStop.forEach((toMap, fromStopId) => {
    const edges: BusStopEdge[] = [];
    toMap.forEach((seconds, toStopId) => {
      edges.push({ toStopId, travelSeconds: seconds });
    });
    graph.set(fromStopId, edges);
  });

  return graph;
};
