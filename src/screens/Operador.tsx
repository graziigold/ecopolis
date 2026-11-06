import { useRef, useState } from 'react';
import type { Screen, UserData } from '../types';
import { AppLayout, OperatorTabs } from '../components/Nav';
import { CheckCircleIcon, LogOutIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import { deliveryEcopontos, fmtWhen } from '../data/catalog';
import type { Delivery, Material } from '../data/catalog';

interface Props {
  user: UserData;
  navigate: (s: Screen) => void;
  deliveries: Delivery[];
  materials: Material[];
  onLookup: (code: string) => Promise<Delivery | string>;
  onResolve: (id: number, body: { action: 'confirmar' | 'recusar'; realMaterialKey?: string; realKg?: number; reason?: string }) => Promise<Delivery | null>;
  onLogout: () => void;
}

const TOLERANCE = 0.1; // até 10% de diferença no peso conta como "confirmada"
const REASONS = ['Material contaminado ou sujo', 'Material diferente do declarado', 'Material não aceito nesta ecolocalização', 'Cidadão não compareceu com o material'];

const STATUS_STYLE: Record<string, string> = {
  confirmada: 'bg-eco-100 text-eco-700',
  ajustada: 'bg-drach-light text-drach',
  recusada: 'bg-red-50 text-red-600',
};

export default function Operador({ user, navigate, deliveries, materials, onLookup, onResolve, onLogout }: Props) {
  const ECOPONTO = user.location ?? 'Ecolocalização';
  const [busy, setBusy] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const [current, setCurrent] = useState<Delivery | null>(null);
  const [realKey, setRealKey] = useState('');
  const [realKg, setRealKg] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<Delivery | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const label = (k?: string) => materials.find((m) => m.key === k)?.label ?? k;
  const pending = deliveries.filter((d) => d.status === 'pendente');
  const resolved = deliveries.filter((d) => d.status !== 'pendente').sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = clean.slice(0, 4).split('');
      setDigits([0, 1, 2, 3].map((j) => next[j] ?? ''));
      refs.current[Math.min(next.length, 3)]?.focus();
      setCodeError('');
      return;
    }
    const d = [...digits];
    d[i] = clean;
    setDigits(d);
    setCodeError('');
    if (clean && i < 3) refs.current[i + 1]?.focus();
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 4) return setCodeError('Digite os 4 números');
    setBusy(true);
    const d = await onLookup(code);
    setBusy(false);
    if (typeof d === 'string') return setCodeError(d);
    setCurrent({ ...d, code });
    setRealKey(d.materialKey);
    setRealKg(String(d.declaredKg));
    setRejecting(false);
    setReason('');
  }

  function reset() {
    setCurrent(null);
    setDigits(['', '', '', '']);
    setTimeout(() => refs.current[0]?.focus(), 0);
  }

  const kg = Number(realKg.replace(',', '.'));
  const kgValid = kg > 0 && kg < 1000;
  const sameMaterial = current ? realKey === current.materialKey : true;
  const withinTolerance = current ? Math.abs(kg - current.declaredKg) / current.declaredKg <= TOLERANCE : true;
  const isAdjusted = !sameMaterial || !withinTolerance;
  const estimated = current ? deliveryEcopontos(materials, current.materialKey, current.declaredKg) : 0;
  const final = kgValid ? deliveryEcopontos(materials, realKey, kg) : 0;

  async function confirm() {
    if (!current || !kgValid || busy) return;
    setBusy(true);
    const d = await onResolve(current.id, { action: 'confirmar', realMaterialKey: realKey, realKg: kg });
    setBusy(false);
    if (!d) return;
    setResult(d);
    reset();
  }

  async function reject() {
    if (!current || !reason || busy) return;
    setBusy(true);
    const d = await onResolve(current.id, { action: 'recusar', reason });
    setBusy(false);
    if (!d) return;
    setResult(d);
    reset();
  }

  return (
    <AppLayout screen="operador" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 lg:max-w-5xl lg:px-8">
        <OperatorTabs screen="operador" navigate={navigate} />
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-eco-500">{ECOPONTO}</span>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Receber entrega</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Peça o código ao cidadão e confira o material na balança.</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-body text-eco-600 hover:bg-eco-100">
            <LogOutIcon size={16} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">
          <div>
            {!current ? (
              <form noValidate onSubmit={lookup} className="bg-white rounded-2xl border border-eco-100 p-6 text-center">
                <label className="block text-xs font-semibold text-eco-700 mb-4 font-body uppercase tracking-wider">Código da entrega<Req /></label>
                <div className="flex justify-center gap-3 mb-3">
                  {digits.map((d, i) => (
                    <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" maxLength={4} autoFocus={i === 0}
                      aria-label={`Dígito ${i + 1}`} aria-required="true"
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }}
                      className={`w-14 h-16 lg:w-16 lg:h-20 rounded-2xl border-2 text-center font-display font-bold text-3xl text-eco-900 outline-none transition-all ${codeError ? 'border-red-400' : 'border-eco-200 focus:border-eco-600 focus:ring-4 focus:ring-eco-100'}`} />
                  ))}
                </div>
                {codeError ? <p className="text-red-500 text-xs mb-3">{codeError}</p> : <p className="text-eco-400 text-xs font-body mb-3">O código aparece no app do cidadão.</p>}
                <button type="submit" className="w-full max-w-xs h-12 rounded-xl text-white text-sm font-display font-semibold"
                  style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }} disabled={busy}>{busy ? 'Buscando…' : 'Buscar entrega'}</button>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-eco-100 p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-eco-100 text-eco-800 font-display font-bold flex items-center justify-center">{current.citizenName.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="font-body font-semibold text-eco-900">{current.citizenName}</div>
                      <div className="text-xs text-eco-500 font-body">Código {current.code} · {fmtWhen(current.at)}</div>
                    </div>
                  </div>
                  <button onClick={reset} className="text-sm text-eco-500 hover:text-eco-800">Cancelar</button>
                </div>

                <div className="rounded-xl bg-eco-50 px-4 py-3 mb-5 flex justify-between text-sm font-body">
                  <span className="text-eco-500">Declarado</span>
                  <span className="text-eco-800 font-semibold">{label(current.materialKey)} · {current.declaredKg} kg · ~{estimated} Ecopontos</span>
                </div>

                {!rejecting ? (
                  <>
                    <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Material recebido<Req /></span>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {materials.filter((m) => m.active).map((m) => (
                        <button key={m.key} type="button" onClick={() => setRealKey(m.key)}
                          className={`h-10 rounded-xl border text-sm font-body font-semibold ${realKey === m.key ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 text-eco-600 hover:border-eco-300'}`}>{m.label}</button>
                      ))}
                    </div>

                    <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Peso real na balança<Req /></label>
                    <div className="relative mb-2">
                      <input value={realKg} inputMode="decimal" onChange={(e) => setRealKg(e.target.value)} aria-required="true"
                        className={`w-full h-14 pl-4 pr-12 rounded-xl border text-2xl font-display font-bold text-eco-900 outline-none ${kgValid ? 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100' : 'border-red-400 ring-2 ring-red-100'}`} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-eco-400 font-body">kg</span>
                    </div>

                    <div className={`rounded-xl px-4 py-3 mb-5 text-sm font-body ${isAdjusted ? 'bg-drach-light text-drach' : 'bg-eco-50 text-eco-700'}`}>
                      {!kgValid ? 'Informe um peso válido.' : isAdjusted
                        ? <>Diferente do declarado: o cidadão recebe <strong>{final} Ecopontos</strong> em vez de ~{estimated} e será avisado do ajuste.</>
                        : <>Confere com o declarado. O cidadão recebe <strong>{final} Ecopontos</strong>.</>}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                      <button onClick={() => setRejecting(true)} className="h-12 px-5 rounded-xl text-sm font-display font-semibold text-red-600 hover:bg-red-50">Recusar entrega</button>
                      <button disabled={!kgValid || busy} onClick={confirm} className="flex-1 h-12 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
                        {isAdjusted ? 'Confirmar com ajuste' : 'Confirmar recebimento'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="block text-xs font-semibold text-eco-700 mb-2 font-body">Motivo da recusa<Req /></span>
                    <div className="space-y-2 mb-5">
                      {REASONS.map((r) => (
                        <button key={r} onClick={() => setReason(r)}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-body ${reason === r ? 'border-red-400 bg-red-50 text-red-700' : 'border-eco-100 text-eco-700 hover:border-eco-200'}`}>{r}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setRejecting(false)} className="h-12 px-5 rounded-xl text-sm font-display font-semibold text-eco-600 hover:bg-eco-50">Voltar</button>
                      <button disabled={!reason || busy} onClick={reject} className="flex-1 h-12 rounded-xl bg-red-600 text-white text-sm font-display font-semibold disabled:opacity-40">Recusar entrega</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="bg-white rounded-2xl border border-eco-100 p-5">
              <h2 className="font-display font-semibold text-eco-900 mb-1">Aguardando entrega</h2>
              <p className="text-xs text-eco-400 font-body mb-3">O código fica só com o cidadão.</p>
              <ul className="space-y-2.5">
                {pending.length === 0 && <li className="text-sm text-eco-500 font-body">Nenhuma entrega pendente.</li>}
                {pending.map((d) => (
                  <li key={d.id} className="flex justify-between text-sm font-body">
                    <span className="text-eco-700">{d.citizenName}</span>
                    <span className="text-eco-500">{label(d.materialKey)} · {d.declaredKg} kg</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-2xl border border-eco-100 p-5">
              <h2 className="font-display font-semibold text-eco-900 mb-3">Validadas recentemente</h2>
              <ul className="space-y-3">
                {resolved.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm font-body">
                    <div className="min-w-0">
                      <div className="text-eco-700 truncate">{d.citizenName} · {label(d.realMaterialKey ?? d.materialKey)}</div>
                      <div className="text-xs text-eco-400">{d.realKg ? `${d.realKg} kg reais / ${d.declaredKg} kg declarados` : d.reason}</div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-xs w-full text-center animate-splash-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${result.status === 'recusada' ? 'bg-red-500' : ''}`}
              style={result.status === 'recusada' ? undefined : { background: 'linear-gradient(135deg, #3a9448, #1d5c2a)' }}>
              <CheckCircleIcon size={32} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-eco-900 text-xl mb-1">
              {result.status === 'recusada' ? 'Entrega recusada' : result.status === 'ajustada' ? 'Confirmada com ajuste' : 'Entrega confirmada'}
            </h2>
            <p className="text-eco-500 text-sm font-body mb-5">
              {result.status === 'recusada' ? `${result.citizenName} será avisado(a) do motivo.` : `${result.drachs} Ecopontos creditados para ${result.citizenName}.`}
            </p>
            <button onClick={() => setResult(null)} className="w-full py-3 rounded-xl text-white text-sm font-display font-semibold"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>Próxima entrega</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
