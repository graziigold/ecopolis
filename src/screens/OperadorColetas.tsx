import { useRef, useState } from 'react';
import type { Screen, UserData } from '../types';
import { AppLayout, OperatorTabs } from '../components/Nav';
import { CheckCircleIcon, ClockIcon, HomeAddressIcon, LogOutIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import { SLOTS, deliveryEcopontos, fmtDay, PICKUP_STATUS_LABEL } from '../data/catalog';
import type { Material, Pickup } from '../data/catalog';

interface Props {
  user: UserData;
  navigate: (s: Screen) => void;
  pickups: Pickup[];
  materials: Material[];
  onResolve: (id: number, body: { action: 'realizada' | 'nao_realizada'; materialKey?: string; kg?: number; reason?: string }) => Promise<Pickup | null>;
  onLogout: () => void;
}

const FAIL_REASONS = [
  'Ninguém no endereço no horário agendado',
  'Endereço não localizado',
  'Material não corresponde ao tipo agendado',
  'Acesso ao local impedido',
];

export default function OperadorColetas({ navigate, pickups, materials, onResolve, onLogout }: Props) {
  const active = materials.filter((m) => m.active);
  const scheduled = pickups.filter((p) => p.status === 'agendada').sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  const recent = pickups
    .filter((p) => p.status === 'realizada' || p.status === 'nao_realizada')
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
    .slice(0, 5);
  const days = [...new Set(scheduled.map((p) => p.date))];

  const [current, setCurrent] = useState<Pickup | null>(null);
  const [materialKey, setMaterialKey] = useState('');
  const [kgText, setKgText] = useState('');
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<Pickup | null>(null);
  const formRef = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);

  function open(p: Pickup) {
    setCurrent(p);
    setMaterialKey(active[0]?.key ?? '');
    setKgText('');
    setFailing(false);
    setReason('');
    // No celular o formulário fica abaixo da lista.
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const kg = Number(kgText.replace(',', '.'));
  const kgValid = kg > 0 && kg < 1000;
  const credit = kgValid && materialKey ? deliveryEcopontos(materials, materialKey, kg) : 0;
  const label = (k?: string) => materials.find((m) => m.key === k)?.label ?? k;

  async function done() {
    if (!current || !kgValid || !materialKey || busy) return;
    setBusy(true);
    const p = await onResolve(current.id, { action: 'realizada', materialKey, kg });
    setBusy(false);
    if (!p) return;
    setResult(p);
    setCurrent(null);
  }

  async function fail() {
    if (!current || !reason || busy) return;
    setBusy(true);
    const p = await onResolve(current.id, { action: 'nao_realizada', reason });
    setBusy(false);
    if (!p) return;
    setResult(p);
    setCurrent(null);
  }

  return (
    <AppLayout screen="operadorColetas" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 lg:max-w-5xl lg:px-8">
        <OperatorTabs screen="operadorColetas" navigate={navigate} counts={{ operadorColetas: scheduled.length }} />
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-eco-500">Coleta domiciliar</span>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Coletas agendadas</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Registre o material e o peso ao concluir cada coleta.</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-body text-eco-600 hover:bg-eco-100">
            <LogOutIcon size={16} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">
          <div className="space-y-5">
            {days.length === 0 && (
              <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-eco-500 text-sm font-body">Nenhuma coleta agendada no momento.</div>
            )}
            {days.map((day) => (
              <section key={day}>
                <h2 className="font-display font-semibold text-eco-800 text-xs mb-2 uppercase tracking-wider">{fmtDay(day)}</h2>
                <ul className="space-y-2">
                  {scheduled.filter((p) => p.date === day).map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => open(p)}
                        className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${current?.id === p.id ? 'border-eco-600 ring-1 ring-eco-300' : 'border-eco-100 hover:border-eco-200'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-body font-semibold text-eco-900 text-sm">{p.type}</span>
                          <span className="text-xs font-body text-eco-500 flex items-center gap-1 flex-shrink-0"><ClockIcon size={12} /> {SLOTS[p.slot].label}</span>
                        </div>
                        <div className="text-xs text-eco-600 font-body flex items-start gap-1.5 mt-1.5">
                          <HomeAddressIcon size={12} className="mt-0.5 flex-shrink-0 text-eco-400" /> {p.address}
                        </div>
                        <div className="text-[11px] text-eco-400 font-body mt-1">Cidadão: {p.citizenName}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            {current ? (
              <section ref={formRef} className="bg-white rounded-2xl border border-eco-100 p-5 scroll-mt-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="font-display font-semibold text-eco-900">{current.citizenName}</h2>
                    <p className="text-xs text-eco-500 font-body">{current.type} · {fmtDay(current.date)}, {SLOTS[current.slot].label}</p>
                  </div>
                  <button onClick={() => setCurrent(null)} className="text-sm text-eco-500 hover:text-eco-800 flex-shrink-0">Fechar</button>
                </div>
                {!failing ? (
                  <>
                    <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Material coletado<Req /></span>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {active.map((m) => (
                        <button key={m.key} type="button" onClick={() => setMaterialKey(m.key)}
                          className={`h-10 rounded-xl border text-xs font-body font-semibold ${materialKey === m.key ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 text-eco-600 hover:border-eco-300'}`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Peso medido<Req /></label>
                    <div className="relative mb-3">
                      <input value={kgText} inputMode="decimal" onChange={(e) => setKgText(e.target.value)} placeholder="0,0" aria-required="true"
                        className="w-full h-12 pl-4 pr-12 rounded-xl border border-eco-200 text-xl font-display font-bold text-eco-900 outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-eco-400 font-body">kg</span>
                    </div>
                    <div className="rounded-xl bg-eco-50 px-4 py-3 mb-4 text-sm font-body text-eco-700">
                      {kgValid ? <>O cidadão recebe <strong>{credit} Ecopontos</strong>.</> : 'Informe o peso para calcular os Ecopontos.'}
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                      <button onClick={() => setFailing(true)} className="h-11 px-4 rounded-xl text-sm font-display font-semibold text-red-600 hover:bg-red-50">Não realizada</button>
                      <button disabled={!kgValid || !materialKey || busy} onClick={done} className="flex-1 h-11 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
                        Marcar como realizada
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Motivo<Req /></span>
                    <div className="space-y-2 mb-4">
                      {FAIL_REASONS.map((r) => (
                        <button key={r} onClick={() => setReason(r)}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-body ${reason === r ? 'border-red-400 bg-red-50 text-red-700' : 'border-eco-100 text-eco-700 hover:border-eco-200'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setFailing(false)} className="h-11 px-4 rounded-xl text-sm font-display font-semibold text-eco-600 hover:bg-eco-50">Voltar</button>
                      <button disabled={!reason || busy} onClick={fail} className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-display font-semibold disabled:opacity-40">Confirmar não realizada</button>
                    </div>
                  </>
                )}
              </section>
            ) : (
              <section className="hidden lg:block bg-white rounded-2xl border border-eco-100 p-6 text-center text-sm text-eco-500 font-body">
                Selecione uma coleta para registrar o resultado.
              </section>
            )}
            <section className="bg-white rounded-2xl border border-eco-100 p-5">
              <h2 className="font-display font-semibold text-eco-900 mb-3">Concluídas recentemente</h2>
              {recent.length === 0 ? (
                <p className="text-sm text-eco-500 font-body">Nenhuma coleta concluída ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {recent.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-sm font-body">
                      <div className="min-w-0">
                        <div className="text-eco-700 truncate">{p.citizenName} · {p.status === 'realizada' ? label(p.materialKey) : p.type}</div>
                        <div className="text-xs text-eco-400 truncate">{p.status === 'realizada' ? `${p.kg?.toLocaleString('pt-BR')} kg · +${p.drachs} Ecopontos` : p.reason}</div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.status === 'realizada' ? 'bg-eco-100 text-eco-700' : 'bg-red-50 text-red-600'}`}>
                        {PICKUP_STATUS_LABEL[p.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-7 max-w-xs w-full text-center animate-splash-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${result.status === 'nao_realizada' ? 'bg-red-500' : ''}`}
              style={result.status === 'nao_realizada' ? undefined : { background: 'linear-gradient(135deg, #3a9448, #1d5c2a)' }}>
              <CheckCircleIcon size={32} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-eco-900 text-xl mb-1">{result.status === 'realizada' ? 'Coleta realizada' : 'Coleta não realizada'}</h2>
            <p className="text-eco-500 text-sm font-body mb-5">
              {result.status === 'realizada' ? `${result.drachs} Ecopontos creditados para ${result.citizenName}.` : `${result.citizenName} será avisado(a) do motivo.`}
            </p>
            <button onClick={() => setResult(null)} className="w-full py-3 rounded-xl text-white text-sm font-display font-semibold" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
              Próxima coleta
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
