import { useState } from 'react';
import type { Screen, UserData } from '../types';
import { AppLayout } from '../components/Nav';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, HomeAddressIcon, PlusIcon, RecycleIcon } from '../components/Icons';
import { PICKUP_STATUS_LABEL, SLOTS, canCancelPickup, fmtDay } from '../data/catalog';
import type { Pickup, PickupStatus } from '../data/catalog';

interface Props {
  user: UserData;
  navigate: (s: Screen) => void;
  pickups: Pickup[];
  onCancel: (id: number) => Promise<boolean>;
}

const STATUS_STYLE: Record<PickupStatus, string> = {
  agendada: 'bg-drach-light text-drach',
  realizada: 'bg-eco-100 text-eco-700',
  nao_realizada: 'bg-red-50 text-red-600',
  cancelada: 'bg-eco-50 text-eco-500',
};

export default function MinhasColetas({ user, navigate, pickups, onCancel }: Props) {
  const [confirming, setConfirming] = useState<Pickup | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = pickups.filter((p) => p.citizenEmail === user.email);
  const upcoming = mine.filter((p) => p.status === 'agendada').sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  const past = mine.filter((p) => p.status !== 'agendada').sort((a, b) => (b.resolvedAt ?? b.at) - (a.resolvedAt ?? a.at));

  const Card = ({ p }: { p: Pickup }) => {
    const cancellable = canCancelPickup(p);
    return (
      <li className="bg-white rounded-2xl border border-eco-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-eco-100 text-eco-700 flex items-center justify-center flex-shrink-0">
              <RecycleIcon size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-body font-semibold text-eco-900 text-sm truncate">{p.type}</div>
              <div className="text-xs text-eco-500 font-body flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span className="inline-flex items-center gap-1 whitespace-nowrap"><CalendarIcon size={12} /> {fmtDay(p.date)}</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap"><ClockIcon size={12} /> {SLOTS[p.slot].label}</span>
              </div>
            </div>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>{PICKUP_STATUS_LABEL[p.status]}</span>
        </div>
        <div className="flex items-start gap-2 mt-3 text-xs text-eco-600 font-body">
          <HomeAddressIcon size={13} className="mt-0.5 flex-shrink-0 text-eco-400" />
          <span className="leading-snug">{p.address}</span>
        </div>
        {p.status === 'realizada' && (
          <p className="mt-3 text-xs font-body text-eco-700 bg-eco-50 rounded-lg px-3 py-2">
            {p.kg?.toLocaleString('pt-BR')} kg coletados · <strong>+{p.drachs} Ecopontos</strong>
          </p>
        )}
        {p.status === 'nao_realizada' && p.reason && (
          <p className="mt-3 text-xs font-body text-red-600 bg-red-50 rounded-lg px-3 py-2">Motivo: {p.reason}</p>
        )}
        {p.status === 'agendada' && (
          <div className="mt-3 pt-3 border-t border-eco-50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-eco-400 font-body">
              {cancellable ? 'Cancelamento permitido até o início do horário.' : 'O horário já começou e não é mais possível cancelar.'}
            </span>
            {cancellable && (
              <button
                onClick={() => setConfirming(p)}
                className="shrink-0 h-9 px-4 rounded-xl text-xs font-display font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <AppLayout screen="minhasColetas" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('coleta')} aria-label="Voltar" className="p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors">
            <ArrowLeftIcon size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-eco-900 text-2xl">Minhas coletas</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Acompanhe as coletas na sua porta</p>
          </div>
          <button
            onClick={() => navigate('coleta')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-eco-800 text-white text-xs font-display font-semibold hover:bg-eco-900 transition-colors flex-shrink-0"
          >
            <PlusIcon size={15} />
            <span className="hidden sm:inline">Agendar</span>
          </button>
        </div>

        {mine.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <div className="w-20 h-20 rounded-full bg-eco-100 text-eco-300 flex items-center justify-center mb-4">
              <CalendarIcon size={34} />
            </div>
            <h3 className="font-display font-bold text-eco-800 text-lg">Nenhuma coleta agendada</h3>
            <p className="text-eco-400 font-body text-sm mt-1 max-w-xs">Agende uma coleta e nossa equipe passa no seu endereço.</p>
            <button onClick={() => navigate('coleta')} className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-display font-semibold" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
              Agendar coleta
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">Próximas ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <p className="text-eco-400 text-sm font-body mb-6">Nenhuma coleta futura.</p>
            ) : (
              <ul className="space-y-3 mb-6">{upcoming.map((p) => <Card key={p.id} p={p} />)}</ul>
            )}
            {past.length > 0 && (
              <>
                <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">Anteriores</h2>
                <ul className="space-y-3">{past.map((p) => <Card key={p.id} p={p} />)}</ul>
              </>
            )}
          </>
        )}
        <div className="h-4" />
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-splash-in">
            <h2 id="cancel-title" className="font-display font-bold text-eco-900 text-lg mb-1">Cancelar coleta?</h2>
            <p className="text-eco-500 text-sm font-body mb-5">
              {confirming.type} · {fmtDay(confirming.date)}, {SLOTS[confirming.slot].label}. A coleta sai da agenda da equipe.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} className="flex-1 h-11 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50">
                Manter
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onCancel(confirming.id);
                  setBusy(false);
                  setConfirming(null);
                }}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-display font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? 'Cancelando…' : 'Cancelar coleta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
