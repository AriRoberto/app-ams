import { CITY_FALLBACK } from '../utils/constants.js';

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3165305';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?q=São%20Vicente%20de%20Minas,%20Minas%20Gerais,%20Brasil&format=jsonv2&limit=1';

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Falha em ${url}: ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeIbge(raw) {
  return {
    ibge_id: raw.id,
    nome: raw.nome,
    uf: raw?.microrregiao?.mesorregiao?.UF?.sigla || 'MG',
    regiao: raw?.microrregiao?.mesorregiao?.UF?.regiao?.nome || 'Sudeste'
  };
}

function normalizeNominatim(raw) {
  return {
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    display_name: raw.display_name,
    bounding_box: Array.isArray(raw.boundingbox) ? raw.boundingbox.map(Number) : CITY_FALLBACK.bounding_box
  };
}

export async function getSaoVicenteGeo() {
  try {
    const [ibgeRaw, nominatimRawList] = await Promise.all([
      fetchJsonWithTimeout(IBGE_URL, { headers: { Accept: 'application/json' } }),
      fetchJsonWithTimeout(NOMINATIM_URL, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'cidadeatende-demo/1.0 (contato@cidadeatende.demo)'
        }
      })
    ]);

    const ibge = normalizeIbge(ibgeRaw);
    const nominatimRaw = Array.isArray(nominatimRawList) ? nominatimRawList[0] : null;
    if (!nominatimRaw) throw new Error('Nominatim sem dados.');

    const nominatim = normalizeNominatim(nominatimRaw);

    return {
      source: 'api',
      ...ibge,
      ...nominatim
    };
  } catch {
    return {
      source: 'fallback',
      ibge_id: CITY_FALLBACK.ibge_id,
      nome: CITY_FALLBACK.nome,
      uf: CITY_FALLBACK.uf,
      regiao: 'Sudeste',
      lat: CITY_FALLBACK.lat,
      lon: CITY_FALLBACK.lon,
      bounding_box: CITY_FALLBACK.bounding_box,
      display_name: CITY_FALLBACK.display_name
    };
  }
}
