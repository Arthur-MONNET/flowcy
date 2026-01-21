export type EducationRecord = {
  numero_uai: string;
  appellation_officielle: string;
  nature_uai_libe: string;
  latitude: number;
  longitude: number;
  libelle_commune: string;
  code_departement: string;
  etat_etablissement_libe: string;
};

export type EducationResponse = {
  total_count: number;
  records: Array<{ record: { fields: EducationRecord } }>;
};

type GenericResponse = {
  total_count: number;
  records: Array<{ record: { fields: Record<string, unknown> } }>;
};

export type SchoolEnrollment = {
  total: number;
  schoolYear: string;
};

const DATASET_BASE =
  'https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records';

const ENROLLMENT_DATASET_BASE = 'https://data.education.gouv.fr/api/v2/catalog/datasets';

const SELECT_FIELDS =
  'numero_uai,appellation_officielle,nature_uai_libe,latitude,longitude,libelle_commune,code_departement,etat_etablissement_libe';

const WHERE_CLAUSE =
  'etat_etablissement_libe = "OUVERT" AND code_departement = "074" AND nature_uai_libe IN (' +
  '"COLLEGE",' +
  '"ECOLE MATERNELLE",' +
  '"ECOLE ELEMENTAIRE",' +
  '"ECOLE PRIMAIRE",' +
  '"ECOLE ELEMENTAIRE ET MATERNELLE",' +
  '"ECOLE PRIMAIRE PUBLIQUE",' +
  '"ECOLE ELEMENTAIRE PUBLIQUE",' +
  '"ECOLE MATERNELLE PUBLIQUE",' +
  '"ECOLE DE NIVEAU ELEMENTAIRE",' +
  '"LYCEE PROFESSIONNEL",' +
  '"LYCEE ENSEIGNT GENERAL ET TECHNOLOGIQUE",' +
  '"LYCEE POLYVALENT",' +
  '"LYCEE D ENSEIGNEMENT GENERAL",' +
  '"LYCEE D ENSEIGNEMENT TECHNOLOGIQUE",' +
  '"LYCEE ENS GENERAL TECHNO PROF AGRICOLE",' +
  '"LYCEE EXPERIMENTAL",' +
  '"LYCEE CLIMATIQUE"' +
  ')';

const DEFAULT_MAX_SCHOOL_RECORDS = Number.POSITIVE_INFINITY;

export const fetchSchools74 = async (maxRecords = DEFAULT_MAX_SCHOOL_RECORDS): Promise<EducationRecord[]> => {
  const limit = 100;
  let offset = 0;
  const results: EducationRecord[] = [];
  const seenUai = new Set<string>();

  while (results.length < maxRecords) {
    const url = `${DATASET_BASE}?select=${encodeURIComponent(SELECT_FIELDS)}&where=${encodeURIComponent(
      WHERE_CLAUSE
    )}&order_by=numero_uai&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Education API error: ${response.status}`);
    }
    const data = (await response.json()) as EducationResponse;
    const batch = data.records.map((item) => item.record.fields);
    batch.forEach((record) => {
      const uai = record.numero_uai?.trim().toUpperCase();
      if (!uai) {
        return;
      }
      if (seenUai.has(uai)) {
        return;
      }
      seenUai.add(uai);
      results.push(record);
    });
    if (batch.length < limit) {
      break;
    }
    offset += limit;
  }

  return results.slice(0, maxRecords);
};

const ENROLLMENT_DATASETS = [
  'fr-en-college-effectifs-niveau-sexe-lv',
  'fr-en-lycee_gt-effectifs-niveau-sexe-lv',
  'fr-en-lycee_pro-effectifs-niveau-sexe-lv',
] as const;

const UAI_KEYS = [
  'numero_uai',
  'uai',
  'code_uai',
  'uai_etablissement',
  'numero_uai_etablissement',
  'numero_college',
  'numero_lycee',
] as const;
const YEAR_KEYS = ['rentree_scolaire', 'annee_scolaire', 'annee', 'year'] as const;
const DEPARTMENT_KEYS = ['departement', 'code_departement', 'code_dept', 'dept'] as const;
const REGION_KEYS = ['region_academique', 'region', 'region_academy'] as const;

const TARGET_DEPARTMENT = 'HAUTE SAVOIE';
const TARGET_REGION = 'AUVERGNE-RHONE-ALPES';
const TARGET_SCHOOL_YEAR = '2024';
const ENROLLMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const EFFECTIF_KEYS = [
  'effectif_total',
  'effectif',
  'effectifs',
  'nb_eleves',
  'nombre_eleves',
  'effectif_eleves',
  'total_eleves',
  'nombre_total_eleves',
  'nombre_eleves_total',
] as const;

const SECONDARY_EFFECTIF_KEYS = [
  'effectif_filles',
  'effectif_garcons',
  'nb_filles',
  'nb_garcons',
  'nombre_filles',
  'nombre_garcons',
] as const;

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.').replace(/\s+/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const pickField = (fields: Record<string, unknown>, keys: readonly string[]) => {
  for (const key of keys) {
    if (key in fields) {
      return fields[key];
    }
  }
  return null;
};

const extractUai = (fields: Record<string, unknown>) => {
  const value = pickField(fields, UAI_KEYS);
  if (typeof value === 'string') {
    return value.trim().toUpperCase();
  }
  return null;
};

const extractSchoolYear = (fields: Record<string, unknown>) => {
  const value = pickField(fields, YEAR_KEYS);
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return 'unknown';
};

const extractEffectif = (fields: Record<string, unknown>) => {
  const primary = pickField(fields, EFFECTIF_KEYS);
  const primaryNumber = toNumber(primary);
  if (primaryNumber !== null) {
    return primaryNumber;
  }

  const secondaryValues = SECONDARY_EFFECTIF_KEYS.map((key) => toNumber(fields[key])).filter(
    (value): value is number => value !== null
  );
  if (secondaryValues.length > 0) {
    return secondaryValues.reduce((sum, value) => sum + value, 0);
  }

  const numericCandidates: number[] = [];
  Object.entries(fields).forEach(([key, value]) => {
    const lower = key.toLowerCase();
    if (
      lower.includes('taux') ||
      lower.includes('pourcent') ||
      lower.includes('ratio') ||
      lower.includes('part') ||
      lower.includes('indice')
    ) {
      return;
    }
    if (
      lower.includes('effectif') ||
      lower.includes('eleves') ||
      lower.includes('nb_') ||
      lower.includes('nombre')
    ) {
      const numberValue = toNumber(value);
      if (numberValue !== null) {
        numericCandidates.push(numberValue);
      }
    }
  });

  if (numericCandidates.length > 0) {
    return numericCandidates.reduce((sum, value) => sum + value, 0);
  }

  return null;
};

const yearToNumber = (value: string) => {
  const match = value.match(/(\d{4})/);
  if (!match) {
    return -1;
  }
  return Number(match[1]);
};

const chunkArray = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const isBrowserStorageAvailable = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__flowcy_cache_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hashUaiList = (uais: string[]) => {
  let hash = 0;
  for (const uai of uais) {
    for (let i = 0; i < uai.length; i += 1) {
      hash = (hash * 31 + uai.charCodeAt(i)) % 1_000_000_007;
    }
  }
  return String(hash);
};

const buildEnrollmentCacheKey = (uais: string[]) => {
  const signature = `${TARGET_DEPARTMENT}|${TARGET_REGION}|${TARGET_SCHOOL_YEAR}|${hashUaiList(uais)}`;
  return `flowcy:enrollment:${signature}`;
};

const loadEnrollmentCache = (uais: string[]) => {
  if (!isBrowserStorageAvailable()) {
    return null;
  }
  const key = buildEnrollmentCacheKey(uais);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    const payload = JSON.parse(raw) as { timestamp: number; entries: Array<[string, SchoolEnrollment]> };
    if (!payload?.timestamp || !payload?.entries) {
      return null;
    }
    if (Date.now() - payload.timestamp > ENROLLMENT_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return new Map<string, SchoolEnrollment>(payload.entries);
  } catch {
    return null;
  }
};

const saveEnrollmentCache = (uais: string[], data: Map<string, SchoolEnrollment>) => {
  if (!isBrowserStorageAvailable()) {
    return;
  }
  const key = buildEnrollmentCacheKey(uais);
  const payload = {
    timestamp: Date.now(),
    entries: Array.from(data.entries()),
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
};

const fetchEnrollmentRecords = async (datasetId: string, whereClause: string) => {
  const limit = 100;
  let offset = 0;
  const results: Record<string, unknown>[] = [];

  while (true) {
    const url = `${ENROLLMENT_DATASET_BASE}/${datasetId}/records?where=${encodeURIComponent(
      whereClause
    )}&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      let errorMessage = `Education API error: ${response.status}`;
      try {
        const payload = (await response.json()) as { error_code?: string; message?: string };
        if (payload?.message) {
          errorMessage = `${errorMessage} ${payload.message}`;
        }
      } catch {
        // ignore parse failure
      }
      throw new Error(errorMessage);
    }
    const data = (await response.json()) as GenericResponse;
    const batch = data.records.map((item) => item.record.fields);
    results.push(...batch);
    if (batch.length < limit) {
      break;
    }
    offset += limit;
  }

  return results;
};

type DatasetField = { name: string; type?: string };

const fetchDatasetFields = async (datasetId: string): Promise<DatasetField[]> => {
  const url = `${ENROLLMENT_DATASET_BASE}/${datasetId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Education API error: ${response.status}`);
  }
  const data = (await response.json()) as {
    dataset?: { fields?: Array<{ name?: string; type?: string }> };
    fields?: Array<{ name?: string; type?: string }>;
  };
  const fields = data.dataset?.fields ?? data.fields ?? [];
  return fields
    .map((field) => ({ name: field.name, type: field.type }))
    .filter((field): field is DatasetField => Boolean(field.name));
};

const resolveUaiField = (fields: DatasetField[]) => {
  const lowerFields = fields.map((field) => field.name.toLowerCase());
  for (const key of UAI_KEYS) {
    const index = lowerFields.indexOf(key.toLowerCase());
    if (index >= 0) {
      return fields[index];
    }
  }
  const fallbackIndex = lowerFields.findIndex((field) => field.includes('uai'));
  return fallbackIndex >= 0 ? fields[fallbackIndex] : null;
};

const resolveDepartmentField = (fields: DatasetField[]) => {
  const lowerFields = fields.map((field) => field.name.toLowerCase());
  for (const key of DEPARTMENT_KEYS) {
    const index = lowerFields.indexOf(key.toLowerCase());
    if (index >= 0) {
      return fields[index];
    }
  }
  const fallbackIndex = lowerFields.findIndex((field) => field.includes('depart'));
  return fallbackIndex >= 0 ? fields[fallbackIndex] : null;
};

const resolveRegionField = (fields: DatasetField[]) => {
  const lowerFields = fields.map((field) => field.name.toLowerCase());
  for (const key of REGION_KEYS) {
    const index = lowerFields.indexOf(key.toLowerCase());
    if (index >= 0) {
      return fields[index];
    }
  }
  const fallbackIndex = lowerFields.findIndex((field) => field.includes('region'));
  return fallbackIndex >= 0 ? fields[fallbackIndex] : null;
};

const resolveYearField = (fields: DatasetField[]) => {
  const lowerFields = fields.map((field) => field.name.toLowerCase());
  for (const key of YEAR_KEYS) {
    const index = lowerFields.indexOf(key.toLowerCase());
    if (index >= 0) {
      return fields[index];
    }
  }
  return null;
};

const buildYearClause = (field: DatasetField, year: string) => {
  const fieldType = field.type?.toLowerCase() ?? '';
  if (fieldType.includes('date')) {
    const nextYear = String(Number(year) + 1);
    const startDate = `${year}-01-01`;
    const endDate = `${nextYear}-01-01`;
    return `${field.name} >= "${startDate}" AND ${field.name} < "${endDate}"`;
  }
  return `${field.name} = "${year}"`;
};

export const fetchSchoolEnrollmentsByUai = async (
  uais: string[]
): Promise<Map<string, SchoolEnrollment>> => {
  const normalizedUais = Array.from(
    new Set(uais.map((uai) => uai.trim().toUpperCase()).filter((uai) => uai.length > 0))
  );
  if (normalizedUais.length === 0) {
    return new Map();
  }

  const cached = loadEnrollmentCache(normalizedUais);
  if (cached) {
    return cached;
  }

  const totalsByUai = new Map<string, Map<string, number>>();
  const uaiChunks = chunkArray(normalizedUais, 50);

  for (const datasetId of ENROLLMENT_DATASETS) {
    let uaiField: DatasetField | null = null;
    let departmentField: DatasetField | null = null;
    let regionField: DatasetField | null = null;
    let yearField: DatasetField | null = null;
    try {
      const fields = await fetchDatasetFields(datasetId);
      uaiField = resolveUaiField(fields);
      departmentField = resolveDepartmentField(fields);
      regionField = resolveRegionField(fields);
      yearField = resolveYearField(fields);
    } catch (error) {
      console.warn('Failed to load enrollment schema', datasetId, error);
      continue;
    }

    if (!uaiField) {
      console.warn('No UAI field found for enrollment dataset', datasetId);
      continue;
    }
    if (!departmentField || !regionField || !yearField) {
      console.warn('Missing required filters for enrollment dataset', datasetId, {
        departmentField,
        regionField,
        yearField,
      });
      continue;
    }

    for (const chunk of uaiChunks) {
      const quoted = chunk.map((uai) => `"${uai}"`).join(',');
      let records: Record<string, unknown>[] = [];
      const whereClause = `${uaiField.name} in (${quoted}) AND ${departmentField.name} = "${TARGET_DEPARTMENT}" AND ${regionField.name} = "${TARGET_REGION}" AND ${buildYearClause(
        yearField,
        TARGET_SCHOOL_YEAR
      )}`;
      records = await fetchEnrollmentRecords(datasetId, whereClause);

      records.forEach((fields) => {
        const uai = extractUai(fields);
        if (!uai) {
          return;
        }
        const effectif = extractEffectif(fields);
        if (effectif === null) {
          return;
        }
        const schoolYear = extractSchoolYear(fields);
        const yearTotals = totalsByUai.get(uai) ?? new Map<string, number>();
        const current = yearTotals.get(schoolYear) ?? 0;
        yearTotals.set(schoolYear, current + effectif);
        totalsByUai.set(uai, yearTotals);
      });
    }
  }

  const result = new Map<string, SchoolEnrollment>();
  totalsByUai.forEach((yearTotals, uai) => {
    let selectedYear = '';
    let selectedTotal = 0;
    yearTotals.forEach((total, year) => {
      if (!selectedYear || yearToNumber(year) > yearToNumber(selectedYear)) {
        selectedYear = year;
        selectedTotal = total;
      }
    });
    result.set(uai, { total: Math.round(selectedTotal), schoolYear: selectedYear || 'unknown' });
  });

  saveEnrollmentCache(normalizedUais, result);
  return result;
};
