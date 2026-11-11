import { Suspense, lazy, useEffect, useState } from 'react';
import type { Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { CheckCircleIcon, MapPinIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import { squish, textError } from '../lib/validation';
import { GAMA_CENTER, LOCATION_MATERIALS, fmtWhen } from '../data/catalog';
import { geocode, hasMapbox } from '../lib/mapbox';
import type { LatLng } from '../lib/mapbox';

const PinPicker = lazy(() => import('../components/PinPicker'));
import type { EcoLocation, Suggestion } from '../data/catalog';

interface Props {
  navigate: (s: Screen) => void;
  suggestions: Suggestion[];
  locations: EcoLocation[];
  onApprove: (s: Suggestion, edits: { address: string; materials: string[]; hours: string; coords: LatLng }) => Promise<boolean>;
  onReject: (s: Suggestion, reason: string) => Promise<boolean>;
}

const REJECT_REASONS = [
  'Ponto já cadastrado no mapa',
  'Endereço não localizado ou incompleto',
  'Local não funciona como ponto de coleta',
  'Informações insuficientes para validar',
];

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

export default function GestaoSugestoes({ navigate, suggestions, locations, onApprove, onReject }: Props) {
  const pending = suggestions.filter((s) => s.status === 'pendente').sort((a, b) => a.at - b.at);
  const decided = suggestions.filter((s) => s.status !== 'pendente').slice(0, 6);
  const [selectedId, setSelectedId] = useState<number | null>(pending[0]?.id ?? null);
  const selected = pending.find((s) => s.id === selectedId) ?? null;

  const [address, setAddress] = useState(selected?.address ?? '');
  const [materials, setMaterials] = useState<string[]>(selected?.materials ?? []);
  const [hours, setHours] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<LatLng>(GAMA_CENTER);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'found' | 'approx'>('idle');

  async function locate(addr: string) {
    if (!hasMapbox) return;
    setGeoStatus('loading');
    const r = await geocode(addr);
    setCoords(r ?? GAMA_CENTER);
    setGeoStatus(r ? 'found' : 'approx');
  }

  // Localiza o endereço da sugestão selecionada.
  useEffect(() => {
    if (selected) locate(selected.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  function select(s: Suggestion) {
    setSelectedId(s.id);
    setAddress(s.address);
    setMaterials(s.materials);
    setHours('');
    setRejecting(false);
    setReason('');
    setOther('');
    setError('');
  }

  const duplicate = selected
    ? locations.find((l) => norm(l.name) === norm(selected.name) || norm(l.address) === norm(address))
    : undefined;

  async function approve() {
    if (!selected) return;
    const addrErr = textError(address, 'o endereço', { max: 200 });
    if (addrErr) return setError(addrErr);
    if (materials.length === 0) return setError('Selecione ao menos um material');
    if (!hours.trim()) return setError('Informe o horário de atendimento');
    if (!/\d/.test(hours) && textError(hours, 'o horário', { min: 4, max: 80 })) return setError('Informe o horário de atendimento (ex.: Seg a sáb, 8h às 18h)');
    if (hours.length > 80) return setError('Horário muito longo (máximo 80 caracteres)');
    // Sem Mapbox, posiciona perto do centro do Gama (o gestor pode ajustar depois, com o mapa ativo).
    const pos = hasMapbox ? coords : { lat: GAMA_CENTER.lat + (Math.random() - 0.5) * 0.02, lng: GAMA_CENTER.lng + (Math.random() - 0.5) * 0.02 };
    setBusy(true);
    const ok = await onApprove(selected, { address: address.trim(), materials, hours: hours.trim(), coords: pos });
    setBusy(false);
    if (!ok) return;
    setDone(`${selected.name} foi publicada no mapa e ${selected.citizenName} foi notificado(a).`);
    advance(selected.id);
  }

  async function reject() {
    if (!selected) return;
    const r = reason === 'Outro' ? squish(other) : reason;
    if (!r) return setError('Informe o motivo da rejeição');
    if (reason === 'Outro') { const e = textError(other, 'o motivo', { min: 5, max: 300 }); if (e) return setError(e); }
    setBusy(true);
    const ok = await onReject(selected, r);
    setBusy(false);
    if (!ok) return;
    setDone(`Sugestão rejeitada. ${selected.citizenName} recebeu a justificativa.`);
    advance(selected.id);
  }

  function advance(currentId: number) {
    const next = pending.find((s) => s.id !== currentId);
    if (next) select(next);
    else setSelectedId(null);
  }

  const field = 'w-full h-11 px-3 rounded-xl border border-eco-200 bg-white text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100';

  return (
    <AppLayout screen="gestaoSugestoes" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 lg:max-w-5xl lg:px-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Sugestões de ecolocalização</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">Nenhum ponto sugerido aparece no mapa antes da sua aprovação.</p>
        </div>

        {done && (
          <div className="flex items-center gap-2 rounded-xl bg-eco-50 border border-eco-100 px-4 py-3 mb-5 text-sm font-body text-eco-700" role="status">
            <CheckCircleIcon size={16} className="text-eco-600 flex-shrink-0" />
            <span className="flex-1">{done}</span>
            <button onClick={() => setDone(null)} className="text-xs text-eco-500 hover:text-eco-800">Fechar</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-start">
          <section className="bg-white rounded-2xl border border-eco-100 p-4">
            <h2 className="font-display font-semibold text-eco-900 mb-3">Pendentes ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-eco-500 font-body py-4">Nenhuma sugestão aguardando análise.</p>
            ) : (
              <ul className="space-y-2">
                {pending.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => select(s)}
                      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-all ${selected?.id === s.id ? 'border-eco-600 bg-eco-50 ring-1 ring-eco-300' : 'border-eco-100 hover:border-eco-200'}`}
                    >
                      <div className="font-body font-semibold text-eco-900 text-sm">{s.name}</div>
                      <div className="text-xs text-eco-500 font-body truncate">{s.address}</div>
                      <div className="text-[11px] text-eco-400 font-body mt-1">Enviada por {s.citizenName} · {fmtWhen(s.at)}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {decided.length > 0 && (
              <>
                <h3 className="font-display font-semibold text-eco-800 text-xs uppercase tracking-wider mt-6 mb-2">Analisadas recentemente</h3>
                <ul className="space-y-2">
                  {decided.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm font-body">
                      <span className="text-eco-700 truncate">{s.name}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.status === 'aprovada' ? 'bg-eco-100 text-eco-700' : 'bg-red-50 text-red-600'}`}>
                        {s.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {selected ? (
            <section className="bg-white rounded-2xl border border-eco-100 p-5 lg:p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-eco-100 text-eco-700 flex items-center justify-center flex-shrink-0"><MapPinIcon size={18} /></span>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-eco-900 text-lg leading-tight">{selected.name}</h2>
                  <p className="text-xs text-eco-500 font-body">Sugerida por {selected.citizenName} ({selected.citizenEmail})</p>
                </div>
              </div>

              {selected.obs && (
                <p className="text-sm font-body text-eco-700 bg-eco-50 rounded-xl px-4 py-3 mb-4">
                  <span className="block text-[11px] uppercase tracking-wider text-eco-400 font-semibold mb-0.5">Observações do cidadão</span>
                  {selected.obs}
                </p>
              )}

              {duplicate && (
                <p className="text-sm font-body text-drach bg-drach-light rounded-xl px-4 py-3 mb-4">
                  Possível duplicidade com <strong>{duplicate.name}</strong>, já cadastrada no mapa.
                </p>
              )}

              {!rejecting ? (
                <>
                  <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Endereço<Req /></label>
                  <div className="flex gap-2 mb-4">
                    <input value={address} onChange={(e) => { setAddress(e.target.value); setError(''); }} className={field} />
                    {hasMapbox && (
                      <button type="button" onClick={() => locate(address)} disabled={geoStatus === 'loading'}
                        className="shrink-0 h-11 px-4 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50 disabled:opacity-50">
                        {geoStatus === 'loading' ? '…' : 'Localizar'}
                      </button>
                    )}
                  </div>

                  {hasMapbox && (
                    <>
                      <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Posição no mapa<Req /></span>
                      <div className="relative h-56 rounded-xl overflow-hidden border border-eco-100 mb-1.5">
                        <Suspense fallback={<div className="absolute inset-0 bg-eco-50 animate-pulse" />}>
                          <PinPicker value={coords} onChange={(c) => { setCoords(c); setGeoStatus('found'); }} />
                        </Suspense>
                      </div>
                      <p className={`text-[11px] font-body mb-4 ${geoStatus === 'approx' ? 'text-drach' : 'text-eco-400'}`}>
                        {geoStatus === 'approx'
                          ? 'Endereço não localizado com precisão. Arraste o pino ou toque no mapa no local exato.'
                          : 'Confira o pino. Arraste-o ou toque no mapa para ajustar a posição.'}
                      </p>
                    </>
                  )}

                  <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Materiais aceitos<Req /></span>
                  <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Materiais aceitos">
                    {LOCATION_MATERIALS.map((m) => {
                      const on = materials.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={on}
                          onClick={() => { setMaterials((ms) => (on ? ms.filter((x) => x !== m) : [...ms, m])); setError(''); }}
                          className={`px-3.5 py-1.5 rounded-full text-sm font-body font-medium border transition-all ${on ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 text-eco-600 hover:border-eco-300'}`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Horário de atendimento<Req /></label>
                  <input value={hours} onChange={(e) => { setHours(e.target.value); setError(''); }} placeholder="Ex.: Seg a sáb, 8h às 18h" className={field} />
                  <p className="text-[11px] text-eco-400 font-body mt-1 mb-4">O cidadão não informa o horário, que aparece no mapa.</p>

                  {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={() => { setRejecting(true); setError(''); if (duplicate) setReason(REJECT_REASONS[0]); }} className="h-12 px-5 rounded-xl text-sm font-display font-semibold text-red-600 hover:bg-red-50">
                      Rejeitar
                    </button>
                    <button onClick={approve} disabled={busy} className="disabled:opacity-60 flex-1 h-12 rounded-xl text-white text-sm font-display font-semibold" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
                      Aprovar e publicar no mapa
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Motivo da rejeição<Req /></span>
                  <div className="space-y-2 mb-3">
                    {[...REJECT_REASONS, 'Outro'].map((r) => (
                      <button
                        key={r}
                        onClick={() => { setReason(r); setError(''); }}
                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-body ${reason === r ? 'border-red-400 bg-red-50 text-red-700' : 'border-eco-100 text-eco-700 hover:border-eco-200'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {reason === 'Outro' && (
                    <textarea value={other} onChange={(e) => { setOther(e.target.value); setError(''); }} rows={2} placeholder="Explique o motivo ao cidadão" className="w-full px-3 py-2.5 rounded-xl border border-eco-200 text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100 resize-none mb-3" />
                  )}
                  {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setRejecting(false); setError(''); }} className="h-12 px-5 rounded-xl text-sm font-display font-semibold text-eco-600 hover:bg-eco-50">Voltar</button>
                    <button onClick={reject} disabled={busy} className="disabled:opacity-60 flex-1 h-12 rounded-xl bg-red-600 text-white text-sm font-display font-semibold hover:bg-red-700">Rejeitar sugestão</button>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-eco-500 text-sm font-body">
              {pending.length === 0 ? 'Tudo analisado. Novas sugestões aparecem aqui.' : 'Selecione uma sugestão para analisar.'}
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
