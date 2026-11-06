import { GAMA_CENTER } from '../data/catalog';

/** Token público do Mapbox (pk.…). Sem ele, o app usa o mapa ilustrado. */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() || '';
export const hasMapbox = MAPBOX_TOKEN.startsWith('pk.');

export interface LatLng {
  lat: number;
  lng: number;
}

/** Recorte aproximado do Gama/DF (oeste, sul, leste, norte). */
const GAMA_BBOX = '-48.13,-16.09,-47.98,-15.96';
// Tipos precisos o bastante para posicionar um ponto; "region"/"place" são vagos demais.
const PRECISE = new Set(['address', 'street', 'block', 'secondary_address', 'neighborhood', 'postcode']);

/**
 * Converte um endereço em coordenadas (Mapbox Geocoding v6) dentro do Gama/DF.
 * O endereçamento do DF (quadras, conjuntos) é impreciso nos geocodificadores,
 * então o resultado é um ponto de partida que o gestor confirma no mapa.
 */
export async function geocode(address: string): Promise<LatLng | null> {
  if (!hasMapbox || !address.trim()) return null;
  const q = address.replace(/\s*[\u2014/]\s*/g, ', ');
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', q);
  url.searchParams.set('country', 'br');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('limit', '5');
  url.searchParams.set('bbox', GAMA_BBOX);
  url.searchParams.set('proximity', `${GAMA_CENTER.lng},${GAMA_CENTER.lat}`);
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Descarta resultados fora do DF (ex.: Novo Gama/GO, vizinho ao Gama).
    const f = (data.features ?? []).find(
      (x: { properties?: { feature_type?: string; context?: { region?: { region_code?: string } } } }) =>
        PRECISE.has(x.properties?.feature_type ?? '') && x.properties?.context?.region?.region_code === 'DF',
    );
    const coords = f?.geometry?.coordinates;
    return Array.isArray(coords) ? { lng: coords[0], lat: coords[1] } : null;
  } catch {
    return null;
  }
}

/** Distância em km entre dois pontos (fórmula de Haversine). */
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtDistance = (km: number) =>
  km < 1 ? `${Math.round((km * 1000) / 10) * 10} m` : `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

/** Rota até o destino; usa coordenadas quando disponíveis. */
export const routeUrl = (p: { lat?: number; lng?: number; address: string }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    p.lat !== undefined && p.lng !== undefined ? `${p.lat},${p.lng}` : p.address,
  )}`;
