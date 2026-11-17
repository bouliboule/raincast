const STRINGS = {
  fr: {
    locale: 'fr-FR',
    choosePlace: 'Choisir un lieu',
    changePlace: 'Changer de lieu',
    refresh: 'Actualiser',
    close: 'Fermer',
    loading: 'Chargement…',
    searchPlaceholder: 'Rechercher une ville…',
    myLocation: '📍 Ma position',
    locating: '📍 Localisation…',
    locationDenied: '📍 Position refusée',
    myLocationName: 'Ma position',
    noResults: 'Aucun résultat en France',
    legendDry: 'Sec', legendLight: 'Faible', legendModerate: 'Modérée', legendHeavy: 'Forte',
    levels: { 1: 'Temps sec', 2: 'Pluie faible', 3: 'Pluie modérée', 4: 'Pluie forte' },
    noRain: 'Pas de pluie prévue dans l’heure',
    rainAllHour: 'Pluie pendant toute l’heure',
    rainUntil: (t) => `Pluie jusqu’à ${t}`,
    rainFrom: (t) => `Pluie à partir de ${t}`,
    unavailable: 'Prévision de pluie dans l’heure non disponible ici',
    pickPlace: 'Choisissez un lieu',
    fetchError: 'Impossible de récupérer la prévision',
    updatedAt: (t) => `mis à jour à ${t}`,
    offline: 'hors ligne',
    dataCredit: 'Données :',
    notAffiliated: 'Projet personnel, non affilié à Météo-France',
    themes: { auto: 'Thème : automatique', light: 'Thème : clair', dark: 'Thème : sombre', eink: 'Thème : e-ink' },
  },
  en: {
    locale: 'en-GB',
    choosePlace: 'Choose a place',
    changePlace: 'Change place',
    refresh: 'Refresh',
    close: 'Close',
    loading: 'Loading…',
    searchPlaceholder: 'Search for a town…',
    myLocation: '📍 My location',
    locating: '📍 Locating…',
    locationDenied: '📍 Location denied',
    myLocationName: 'My location',
    noResults: 'No results in France',
    legendDry: 'Dry', legendLight: 'Light', legendModerate: 'Moderate', legendHeavy: 'Heavy',
    levels: { 1: 'Dry', 2: 'Light rain', 3: 'Moderate rain', 4: 'Heavy rain' },
    noRain: 'No rain expected in the next hour',
    rainAllHour: 'Rain for the whole hour',
    rainUntil: (t) => `Rain until ${t}`,
    rainFrom: (t) => `Rain from ${t}`,
    unavailable: 'Rain-in-the-next-hour forecast not available here',
    pickPlace: 'Choose a place',
    fetchError: 'Couldn’t fetch the forecast',
    updatedAt: (t) => `updated at ${t}`,
    offline: 'offline',
    dataCredit: 'Data:',
    notAffiliated: 'Personal project, not affiliated with Météo-France',
    themes: { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark', eink: 'Theme: e-ink' },
  },
};

export const LANGS = ['fr', 'en'];
const KEY = 'raincast.lang';

let lang = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
if (!LANGS.includes(lang)) lang = 'fr';

export const getLang = () => lang;
export const t = (key) => STRINGS[lang][key];

export function setLang(l) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch {}
  applyStatic();
}

/** Translate static markup: data-i18n (text), data-i18n-aria, data-i18n-placeholder. */
export function applyStatic() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of document.querySelectorAll('[data-lang]')) el.setAttribute('aria-pressed', String(el.dataset.lang === lang));
}
