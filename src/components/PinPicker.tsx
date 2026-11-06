import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../lib/mapbox';
import type { LatLng } from '../lib/mapbox';

interface Props {
  value: LatLng;
  onChange: (v: LatLng) => void;
}

/** Mapa com pino arrastável para o gestor confirmar a posição exata do ponto. */
export default function PinPicker({ value, onChange }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [failed, setFailed] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!container.current) return;
    // Em desenvolvimento o React monta o efeito duas vezes; limpa restos da instância anterior.
    container.current.replaceChildren();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [value.lng, value.lat],
      zoom: 16,
      cooperativeGestures: true,
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
    const mk = new mapboxgl.Marker({ color: '#1d5c2a', draggable: true }).setLngLat([value.lng, value.lat]).addTo(m);
    mk.on('dragend', () => {
      const p = mk.getLngLat();
      onChangeRef.current({ lat: p.lat, lng: p.lng });
    });
    m.on('click', (e) => {
      mk.setLngLat(e.lngLat);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    map.current = m;
    marker.current = mk;
    return () => {
      window.clearTimeout(timeout);
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reposiciona quando o endereço é localizado novamente.
  useEffect(() => {
    const cur = marker.current?.getLngLat();
    if (!cur || (Math.abs(cur.lat - value.lat) < 1e-7 && Math.abs(cur.lng - value.lng) < 1e-7)) return;
    marker.current?.setLngLat([value.lng, value.lat]);
    map.current?.easeTo({ center: [value.lng, value.lat], duration: 400 });
  }, [value]);

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
