import { Suspense, lazy, useState } from 'react';
import type { UserData, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import type { EcoLocation } from '../data/catalog';
import { distanceKm, fmtDistance, hasMapbox, routeUrl } from '../lib/mapbox';
import type { LatLng } from '../lib/mapbox';

const EcoMap = lazy(() => import('../components/EcoMap'));
import {
  ArrowLeftIcon,
  SearchIcon,
  MapPinIcon,
  NavigationIcon,
  ClockIcon,
  RecycleIcon,
  PlusIcon,
} from '../components/Icons';

interface EcopontosProps {
  user: UserData;
  navigate: (s: Screen) => void;
  locations: EcoLocation[];
}

export default function Ecopontos({ navigate, locations: POINTS }: EcopontosProps) {
  const [selectedId, setSelectedId] = useState<number | null>(POINTS[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [me, setMe] = useState<LatLng | null>(null);
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'denied'>('idle');

  function locate() {
    if (!navigator.geolocation) return setGeoState('denied');
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('idle');
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const q = query.toLowerCase();
  const filtered = POINTS.filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
    .map((p) => ({ ...p, km: me ? distanceKm(me, p) : undefined }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));

  return (
    <AppLayout screen="ecopontos" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('home')}
            className="lg:hidden p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-eco-900 text-2xl">Ecolocalizações</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              Pontos de coleta no Gama, DF
            </p>
          </div>
          <button
            onClick={() => navigate('registrarEcoponto')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-eco-800 text-white text-xs font-display font-semibold hover:bg-eco-900 transition-colors flex-shrink-0"
          >
            <PlusIcon size={15} />
            <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <SearchIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-eco-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por setor ou endereço"
            className="w-full bg-white border border-eco-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-body text-eco-800 placeholder:text-eco-300 focus:outline-none focus:border-eco-400 focus:ring-2 focus:ring-eco-100 transition-all"
          />
        </div>

        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden border border-eco-100 mb-5 h-56 lg:h-72">
          {hasMapbox ? (
            <Suspense fallback={<div className="absolute inset-0 bg-eco-50 animate-pulse" />}>
              <EcoMap points={POINTS} selectedId={selectedId} onSelect={setSelectedId} user={me} />
            </Suspense>
          ) : (<>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #d3ecd6 60%, #c8e6ca 100%)' }}
          />
          {/* Faux roads */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-0 right-0 top-1/3 h-1.5 bg-white/70 rounded-full" />
            <div className="absolute left-0 right-0 top-2/3 h-1 bg-white/50 rounded-full" />
            <div className="absolute top-0 bottom-0 left-[30%] w-1.5 bg-white/70 rounded-full" />
            <div className="absolute top-0 bottom-0 left-[70%] w-1 bg-white/50 rounded-full" />
          </div>
          {/* You marker */}
          <div className="absolute" style={{ left: '48%', top: '48%' }}>
            <span className="block w-3.5 h-3.5 rounded-full bg-eco-600 ring-4 ring-eco-600/25 animate-pulse-soft" />
          </div>
          {/* Point markers */}
          {POINTS.map((p) => (
            <button
              key={p.id}
              aria-label={p.name}
              onClick={() => setSelectedId(p.id)}
              className="absolute -translate-x-1/2 -translate-y-full transition-transform"
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-100%) scale(${selectedId === p.id ? 1.15 : 1})` }}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full rounded-bl-none rotate-45 shadow-md ${
                  selectedId === p.id ? 'bg-eco-800' : p.open ? 'bg-eco-500' : 'bg-drach'
                }`}
              >
                <MapPinIcon size={14} className="text-white -rotate-45" />
              </div>
            </button>
          ))}
        </>)}
        </div>

        {/* List */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display font-semibold text-eco-800 text-xs uppercase tracking-wider">
            {filtered.length} {filtered.length === 1 ? 'ponto encontrado' : 'pontos encontrados'}
          </h2>
          <button
            onClick={locate}
            disabled={geoState === 'loading'}
            className="flex items-center gap-1.5 text-xs font-body font-semibold text-eco-600 hover:text-eco-900 disabled:opacity-50"
          >
            <NavigationIcon size={13} />
            {geoState === 'loading' ? 'Localizando…' : me ? 'Atualizar localização' : 'Perto de mim'}
          </button>
        </div>
        {geoState === 'denied' && (
          <p className="text-xs font-body text-drach bg-drach-light rounded-xl px-3 py-2 mb-3">
            Não foi possível obter sua localização. Verifique a permissão do navegador.
          </p>
        )}
        <div className="space-y-3">
          {filtered.map((p) => {
            const active = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left bg-white rounded-2xl border p-4 transition-all cursor-pointer ${
                  active ? 'border-eco-300 ring-1 ring-eco-300' : 'border-eco-100 hover:border-eco-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: p.open ? '#e8f5e9' : '#fdf6eb' }}
                  >
                    <RecycleIcon size={18} style={{ color: p.open ? '#2d7a3a' : '#b07d30' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-body font-semibold text-eco-800 text-sm truncate">{p.name}</h3>
                      {p.km !== undefined && (
                        <span className="text-eco-500 text-xs font-body font-semibold flex-shrink-0 flex items-center gap-1">
                          <NavigationIcon size={12} />
                          {fmtDistance(p.km)}
                        </span>
                      )}
                    </div>
                    <p className="text-eco-400 text-xs font-body mt-0.5 truncate">{p.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[11px] font-semibold font-body px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: p.open ? '#e8f5e9' : '#f5f5f5',
                          color: p.open ? '#2d7a3a' : '#6b8070',
                        }}
                      >
                        <ClockIcon size={10} />
                        {p.hours}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.materials.map((m) => (
                        <span
                          key={m}
                          className="text-[10px] font-body text-eco-600 bg-eco-50 border border-eco-100 rounded-full px-2 py-0.5"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {active && (
                  <div className="mt-3 pt-3 border-t border-eco-50 flex gap-2">
                    <a
                      href={routeUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-eco-800 text-white text-xs font-display font-semibold hover:bg-eco-900 transition-colors"
                    >
                      <NavigationIcon size={13} />
                      Traçar rota
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('descarte'); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-eco-200 text-eco-700 text-xs font-display font-semibold hover:bg-eco-50 transition-colors"
                    >
                      <RecycleIcon size={13} />
                      Registrar aqui
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
