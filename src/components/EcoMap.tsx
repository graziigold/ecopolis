import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GAMA_CENTER } from '../data/catalog';
import type { EcoLocation } from '../data/catalog';
import { MAPBOX_TOKEN } from '../lib/mapbox';
import type { LatLng } from '../lib/mapbox';

interface Props {
  points: EcoLocation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  user?: LatLng | null;
}

const PIN_COLOR = { selected: '#0f3518', open: '#3a9448', closed: '#b07d30' };

function pinElement(label: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', label);
  el.style.cssText = 'width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer;transition:background .2s';
  return el;
}

/** Mapa real do Mapbox com os pontos de coleta. */
export default function EcoMap({ points, selectedId, onSelect, user }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef(new Map<number, { marker: mapboxgl.Marker; el: HTMLButtonElement; open: boolean }>());
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!container.current) return;
    // Em desenvolvimento o React monta o efeito duas vezes; limpa restos da instância anterior.
    container.current.replaceChildren();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [GAMA_CENTER.lng, GAMA_CENTER.lat],
      zoom: 13,
      // Enquadramento inicial na criação. Chamar fitBounds antes do carregamento,
      // junto com os marcadores, travava a página em telas largas.
      ...(points.length > 1 && {
        bounds: points.reduce((b, p) => b.extend([p.lng, p.lat]), new mapboxgl.LngLatBounds()),
        fitBoundsOptions: { padding: 40, maxZoom: 15 },
      }),
      attributionControl: true,
      cooperativeGestures: true,
      locale: { 'ScrollZoomBlocker.CtrlMessage': 'Use Ctrl + rolagem para dar zoom', 'ScrollZoomBlocker.CmdMessage': 'Use ⌘ + rolagem para dar zoom', 'TouchPanBlocker.Message': 'Use dois dedos para mover o mapa' },
    });
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    // Sem rede ou com token inválido o estilo não carrega: avisa em vez de exibir um quadro vazio.
    m.on('error', (e) => {
      const err = e.error as (Error & { status?: number; url?: string }) | undefined;
      console.warn('[mapa]', err?.message ?? e);
      // Só é fatal se o estilo não carregar ou o token for recusado; falhas de um bloco ou fonte são toleráveis.
      const fatal = err?.status === 401 || err?.status === 403 || /\/styles\//.test(err?.url ?? err?.message ?? '');
      if (fatal && !m.isStyleLoaded()) setFailed(true);
    });
    const timeout = window.setTimeout(() => { if (!m.isStyleLoaded()) setFailed(true); }, 15000);
    m.on('load', () => { window.clearTimeout(timeout); setFailed(false); });
    map.current = m;
    const ms = markers.current;
    return () => {
      window.clearTimeout(timeout);
      ms.clear();
      m.remove();
      map.current = null;
    };
    // Só na montagem: os pontos posteriores entram como marcadores, sem reenquadrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza marcadores com a lista de pontos.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<number>();
    for (const p of points) {
      seen.add(p.id);
      if (markers.current.has(p.id)) continue;
      const el = pinElement(p.name);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current(p.id);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
      markers.current.set(p.id, { marker, el, open: p.open });
    }
    for (const [id, entry] of markers.current) {
      if (!seen.has(id)) {
        entry.marker.remove();
        markers.current.delete(id);
      }
    }
  }, [points]);

  // Destaca o ponto selecionado e centraliza.
  useEffect(() => {
    for (const [id, { el, open }] of markers.current) {
      el.style.background = id === selectedId ? PIN_COLOR.selected : open ? PIN_COLOR.open : PIN_COLOR.closed;
      el.style.zIndex = id === selectedId ? '2' : '1';
    }
    const p = points.find((x) => x.id === selectedId);
    if (p && map.current) map.current.easeTo({ center: [p.lng, p.lat], duration: 500 });
  }, [selectedId, points]);

  useEffect(() => {
    const m = map.current;
    if (!m || !user) return;
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.setAttribute('aria-label', 'Sua localização');
      el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#2d7a3a;border:3px solid #fff;box-shadow:0 0 0 6px rgba(45,122,58,.25)';
      userMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(m);
    } else userMarker.current.setLngLat([user.lng, user.lat]);
  }, [user]);

  return (
    <>
      {/* O CSS do Mapbox força position: relative no container; o invólucro absoluto garante a altura. */}
      <div className="absolute inset-0">
        <div ref={container} className="h-full w-full" />
      </div>
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-eco-50/95 p-6 text-center text-sm font-body text-eco-600">
          Não foi possível carregar o mapa agora. Verifique sua conexão e tente novamente.
        </div>
      )}
    </>
  );
}
