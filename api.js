// Unofficial Météo-France webservice (same one used by the open-source
// `meteofrance-api` client). Not a documented API: may change without notice.
const BASE = 'https://webservice.meteofrance.com';
const TOKEN = '__Wj7dVSTjV9YGu1guveLyDq0g7S7TfTjaHBTPTpO0kj8__';

async function get(path, params) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries({ ...params, token: TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** @returns {{position, updated_on, forecast: {dt, rain: 1|2|3|4, desc}[]}} */
export const getRain = (lat, lon) => get('/rain', { lat, lon, lang: 'fr' });

export const searchPlaces = (q) => get('/places', { q });
