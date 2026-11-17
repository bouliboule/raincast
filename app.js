import { getRain, searchPlaces } from './api.js';
import { t, getLang, setLang, applyStatic } from './i18n.js';

const $ = (id) => document.getElementById(id);
const REFRESH_MS = 5 * 60 * 1000;
const STORE_KEY = 'raincast.place';
const CACHE_KEY = 'raincast.last';

const DROP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.5 4.6 6 8.1 6 11a6 6 0 0 1-12 0c0-2.9 2.5-6.4 6-11z"/></svg>';
const DRY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.5 4.6 6 8.1 6 11a6 6 0 0 1-12 0c0-2.9 2.5-6.4 6-11z" opacity=".35"/><path d="M4 20L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const hhmm = (dt, tz) => new Date(dt * 1000).toLocaleTimeString(t('locale'), { hour: '2-digit', minute: '2-digit', timeZone: tz });

const DEFAULT_PLACE = { name: 'Paris', lat: 48.8566, lon: 2.3522 };
let place = store.get(STORE_KEY) || DEFAULT_PLACE;
let timer;
let lastRender = null; // { data, stale } — re-rendered when the language changes

// ---------- rendering ----------

function headline(fc, tz) {
  const wet = fc.map((f) => f.rain > 1);
  if (!wet.some(Boolean)) return t('noRain');
  if (wet[0]) {
    const stop = wet.indexOf(false);
    if (stop === -1) return t('rainAllHour');
    return t('rainUntil')(hhmm(fc[stop].dt, tz));
  }
  return t('rainFrom')(hhmm(fc[wet.indexOf(true)].dt, tz));
}

function render(data, { stale = false } = {}) {
  lastRender = { data, stale };
  const { position: pos, forecast: fc, updated_on } = data;
  const tz = pos.timezone || 'Europe/Paris';
  const card = $('card');

  if (!pos.rain_product_available) {
    card.classList.add('unavailable');
    $('headline').textContent = t('unavailable');
  } else {
    card.classList.remove('unavailable');
    $('headline').textContent = headline(fc, tz);
  }

  // Each slot starts at fc[i].dt; the last slot lasts as long as the previous one.
  const start = fc[0].dt;
  const durs = fc.map((f, i) => (fc[i + 1]?.dt ?? f.dt + (f.dt - fc[i - 1].dt)) - f.dt);
  const end = fc.at(-1).dt + durs.at(-1);
  const total = end - start;

  $('t-start').textContent = hhmm(start, tz);
  $('t-end').textContent = hhmm(end, tz);

  $('slots').innerHTML = fc.map((f, i) =>
    `<div class="slot lv${f.rain}" style="flex:${durs[i]}" title="${hhmm(f.dt, tz)} · ${t('levels')[f.rain]}">${f.rain > 1 ? DROP : DRY}</div>`
  ).join('');

  // Tick labels at the boundaries between slots (minutes from start).
  $('ticks').innerHTML = fc.slice(1).map((f) => {
    const min = Math.round((f.dt - start) / 60);
    return `<span style="left:${((f.dt - start) / total) * 100}%">${min}</span>`;
  }).join('') + '<em>min</em>';

  // Summary bar: the strongest intensity expected over the hour.
  const max = Math.max(...fc.map((f) => f.rain));
  const sum = $('summary');
  sum.className = `summary lv${max}`;
  sum.innerHTML = `${max > 1 ? DROP : DRY}<span>${t('levels')[max]}</span>`;

  const upd = hhmm(updated_on, tz);
  $('meta').textContent = `${pos.name}${pos.dept ? ` (${pos.dept})` : ''} · ${t('updatedAt')(upd)}${stale ? ` · ${t('offline')}` : ''}`;
}

function renderError(key) {
  lastRender = { error: key };
  $('headline').textContent = t(key);
}

// ---------- data ----------

async function load() {
  clearTimeout(timer);
  if (!place) {
    $('headline').textContent = t('pickPlace');
    $('picker').showModal();
    return;
  }
  $('place-name').textContent = place.name;
  document.body.classList.add('loading');
  try {
    const data = await getRain(place.lat, place.lon);
    store.set(CACHE_KEY, { place, data });
    render(data);
  } catch (e) {
    const last = store.get(CACHE_KEY);
    if (last && last.place.lat === place.lat && last.place.lon === place.lon) render(last.data, { stale: true });
    else renderError('fetchError');
  } finally {
    document.body.classList.remove('loading');
    timer = setTimeout(load, REFRESH_MS);
  }
}

function setPlace(p) {
  place = p;
  store.set(STORE_KEY, p);
  $('picker').close();
  load();
}

// ---------- picker ----------

let searchSeq = 0;
let debounce;
$('q').addEventListener('input', () => {
  clearTimeout(debounce);
  const q = $('q').value.trim();
  if (q.length < 2) { $('results').innerHTML = ''; return; }
  debounce = setTimeout(async () => {
    const seq = ++searchSeq;
    try {
      const list = (await searchPlaces(q)).filter((p) => p.country === 'FR').slice(0, 8);
      if (seq !== searchSeq) return;
      $('results').innerHTML = list.length
        ? list.map((p, i) => `<li><button type="button" data-i="${i}">${p.name}<small>${p.postCode ?? p.admin2 ?? ''} · ${p.admin ?? ''}</small></button></li>`).join('')
        : `<li class="empty">${t('noResults')}</li>`;
      $('results').onclick = (ev) => {
        const b = ev.target.closest('button[data-i]');
        if (!b) return;
        const p = list[b.dataset.i];
        setPlace({ name: p.name, lat: p.lat, lon: p.lon });
      };
    } catch { /* ignore */ }
  }, 250);
});

$('locate').addEventListener('click', () => {
  if (!navigator.geolocation) return;
  $('locate').textContent = t('locating');
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const lat = +coords.latitude.toFixed(4), lon = +coords.longitude.toFixed(4);
      let name = t('myLocationName');
      try { name = (await getRain(lat, lon)).position.name || name; } catch {}
      $('locate').textContent = t('myLocation');
      setPlace({ name, lat, lon });
    },
    () => { $('locate').textContent = t('locationDenied'); },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
});

// ---------- theme ----------

const THEME_KEY = 'raincast.theme';
const THEMES = ['auto', 'light', 'dark', 'eink'];
const THEME_UI = {
  auto: ['<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>'],
  light: ['<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'],
  dark: ['<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>'],
  eink: ['<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="2"/></svg>'],
};
const THEME_COLOR = { light: '#ffe14d', dark: '#1b1b1f', eink: '#ffffff' };

function applyTheme(th) {
  if (th === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = th;
  const [icon] = THEME_UI[th];
  const label = t('themes')[th];
  $('theme').innerHTML = icon;
  $('theme').setAttribute('aria-label', label);
  $('theme').title = label;
  const sys = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').content = THEME_COLOR[th === 'auto' ? sys : th];
}

let theme = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
if (!THEMES.includes(theme)) theme = 'auto';
applyTheme(theme);
$('theme').addEventListener('click', () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(theme));

// ---------- language ----------

function applyLang() {
  applyStatic();
  applyTheme(theme);
  if (place) $('place-name').textContent = place.name;
  if (lastRender?.data) render(lastRender.data, { stale: lastRender.stale });
  else if (lastRender?.error) renderError(lastRender.error);
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lang === getLang()) return;
  setLang(b.dataset.lang);
  applyLang();
}));
applyLang();

$('place').addEventListener('click', () => { $('q').value = ''; $('results').innerHTML = ''; $('picker').showModal(); $('q').focus(); });
$('refresh').addEventListener('click', load);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

load();
