// Morning / afternoon / evening outlook from Open-Meteo (CC BY 4.0),
// using Météo-France's AROME/ARPEGE models. No key needed; CORS is open.
const URL_BASE = 'https://api.open-meteo.com/v1/forecast';

export const PERIODS = [
  { id: 'morning', from: 6, to: 12 },
  { id: 'afternoon', from: 12, to: 18 },
  { id: 'evening', from: 18, to: 24 },
];

/** WMO weather code → icon/description group. */
export function codeGroup(code) {
  if (code >= 95) return 'thunder';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 80) return 'showers';
  if (code >= 61) return 'rain';
  if (code >= 51) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'overcast';
  if (code === 2) return 'partly';
  if (code === 1) return 'mostlyClear';
  return 'clear';
}

const isPrecip = (c) => c >= 51;

function summarize(hours) {
  const codes = hours.map((h) => h.code);
  // Any precipitation wins (worst one); otherwise the most frequent sky state.
  const wet = codes.filter(isPrecip);
  let code;
  if (wet.length) code = Math.max(...wet);
  else {
    const n = {};
    for (const c of codes) n[c] = (n[c] || 0) + 1;
    code = +Object.entries(n).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  }
  const temps = hours.map((h) => h.temp);
  return {
    code,
    group: codeGroup(code),
    isDay: hours.filter((h) => h.isDay).length * 2 >= hours.length,
    tMin: Math.round(Math.min(...temps)),
    tMax: Math.round(Math.max(...temps)),
    precip: Math.round(hours.reduce((s, h) => s + (h.precip || 0), 0) * 10) / 10,
  };
}

/**
 * The three periods coming up, starting with the one we're in
 * (e.g. at 14:00 → this afternoon, this evening, tomorrow morning).
 * @returns {Promise<{id, tomorrow, code, group, isDay, tMin, tMax, precip}[]>}
 */
export async function getPeriods(lat, lon) {
  const url = new URL(URL_BASE);
  url.search = new URLSearchParams({
    latitude: lat, longitude: lon,
    hourly: 'temperature_2m,weather_code,precipitation,is_day',
    models: 'meteofrance_seamless',
    timezone: 'auto',
    forecast_days: 3,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  const h = d.hourly;

  // Local "now" in the place's timezone, as "YYYY-MM-DDTHH".
  const nowLocal = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(0, 13);
  const today = nowLocal.slice(0, 10);
  const hourNow = +nowLocal.slice(11, 13);

  const byDay = {};
  h.time.forEach((t, i) => {
    if (h.temperature_2m[i] == null || h.weather_code[i] == null) return;
    (byDay[t.slice(0, 10)] ??= []).push({
      hour: +t.slice(11, 13), temp: h.temperature_2m[i], code: h.weather_code[i], precip: h.precipitation[i], isDay: !!h.is_day[i],
    });
  });
  const days = Object.keys(byDay).sort().filter((day) => day >= today);

  const out = [];
  for (const day of days) {
    for (const p of PERIODS) {
      if (out.length === 3) break;
      if (day === today && p.to <= hourNow) continue; // already over
      const from = day === today ? Math.max(p.from, hourNow) : p.from;
      const hours = byDay[day].filter((x) => x.hour >= from && x.hour < p.to);
      if (!hours.length) continue;
      out.push({ id: p.id, tomorrow: day !== today, ...summarize(hours) });
    }
  }
  return out;
}
