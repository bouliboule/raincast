// Weather icons (original line art), drawn with currentColor so they follow every theme.
const S = (body) => `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const CLOUD = (y = 0) => `<path d="M9 ${23 + y}h14a5 5 0 0 0 .6-9.96A7 7 0 0 0 10 14.2 4.5 4.5 0 0 0 9 ${23 + y}z" fill="var(--card)"/>`;
const SUN_RAYS = (cx, cy, r) => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
  const rad = (a * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
  return `<path d="M${(cx + c * (r + 2.5)).toFixed(1)} ${(cy + s * (r + 2.5)).toFixed(1)}L${(cx + c * (r + 5)).toFixed(1)} ${(cy + s * (r + 5)).toFixed(1)}"/>`;
}).join('');
const SUN = (cx = 16, cy = 16, r = 6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--sun, #ffe14d)"/>${SUN_RAYS(cx, cy, r)}`;
const MOON = (cx = 16, cy = 16, r = 8) => `<path d="M${cx + r * 0.6} ${cy - r}A${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.45}A${r * 0.85} ${r * 0.85} 0 0 1 ${cx + r * 0.6} ${cy - r}z" fill="var(--card)"/>`;

const DROPS = (n) => [10.5, 16, 21.5].slice(0, n).map((x) => `<path d="M${x} 26l-1.5 3.5"/>`).join('');

export function weatherIcon(group, isDay) {
  const sky = isDay ? SUN(11, 11, 4.5) : MOON(11, 11, 5.5);
  switch (group) {
    case 'clear': return S(isDay ? SUN() : MOON());
    case 'mostlyClear':
    case 'partly': return S(sky + CLOUD(1));
    case 'overcast': return S(CLOUD(-1));
    case 'fog': return S('<path d="M6 11h20M4 16h24M6 21h20M9 26h14"/>');
    case 'drizzle': return S(CLOUD(-3) + '<path d="M11 25v1M16 27v1M21 25v1"/>');
    case 'rain': return S(CLOUD(-3) + DROPS(3));
    case 'showers': return S((isDay ? SUN(9, 8, 3.5) : MOON(9, 8, 4)) + CLOUD(-3) + DROPS(2));
    case 'snow': return S(CLOUD(-3) + '<path d="M11 25.5h.01M16 28h.01M21 25.5h.01M13.5 29.5h.01M18.5 29.5h.01" stroke-width="3"/>');
    case 'thunder': return S(CLOUD(-3) + '<path d="M17 21l-3.5 5h4l-2.5 5" stroke-width="2.4"/>');
    default: return S(CLOUD());
  }
}
