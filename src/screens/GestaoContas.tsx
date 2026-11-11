import { useEffect, useState } from 'react';
import type { Role, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { initials } from '../components/Avatar';
import { ArrowLeftIcon } from '../components/Icons';

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
  lastActivityAt: number;
  drachs: number;
  descartes: number;
  me: boolean;
}

interface Props {
  navigate: (s: Screen) => void;
  onLoad: () => Promise<{ accounts: Account[]; inactiveDays: number } | null>;
  onDelete: (id: string) => Promise<boolean>;
}

const ROLE_LABEL: Record<Role, string> = { cidadao: 'Cidadão', operador: 'Operador', gestor: 'Gestor' };
const DAY = 86400_000;
const PERIODS = [
  { days: 0, label: 'Todas' },
  { days: 30, label: 'Sem uso há 30+ dias' },
  { days: 90, label: '90+ dias' },
  { days: 180, label: '180+ dias' },
];

const daysSince = (at: number) => Math.floor((Date.now() - at) / DAY);
const fmtDays = (n: number) => (n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`);

export default function GestaoContas({ navigate, onLoad, onDelete }: Props) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [inactiveDays, setInactiveDays] = useState(90);
  const [period, setPeriod] = useState(0);
  const [role, setRole] = useState<'todos' | 'cidadao' | 'equipe'>('todos');
  const [confirm, setConfirm] = useState<Account | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function load() {
    const r = await onLoad();
    if (!r) return setLoadError(true);
    setLoadError(false);
    setAccounts(r.accounts);
    setInactiveDays(r.inactiveDays);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minDays = PERIODS[period].days;
  const list = (accounts ?? []).filter(
    (a) =>
      daysSince(a.lastActivityAt) >= minDays &&
      (role === 'todos' || (role === 'cidadao' ? a.role === 'cidadao' : a.role !== 'cidadao')),
  );
  const inactiveCount = (accounts ?? []).filter((a) => daysSince(a.lastActivityAt) >= inactiveDays).length;
  const managers = (accounts ?? []).filter((a) => a.role === 'gestor').length;

  function ask(a: Account) {
    setUnderstood(false);
    setConfirm(a);
  }

  async function remove() {
    if (!confirm || !understood) return;
    setBusy(true);
    const ok = await onDelete(confirm.id);
    setBusy(false);
    if (!ok) return;
    setAccounts((l) => (l ?? []).filter((a) => a.id !== confirm.id));
    setConfirm(null);
  }

  const chip = (on: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm font-body font-medium whitespace-nowrap border transition-all ${on ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 bg-white text-eco-600 hover:border-eco-300'}`;

  return (
    <AppLayout screen="gestaoContas" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 lg:max-w-5xl lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('gestaoEquipe')} aria-label="Voltar para Equipe" className="lg:hidden p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50">
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Contas</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              Contas sem uso há mais de {inactiveDays} dias são consideradas inativas e podem ser excluídas.
            </p>
          </div>
        </div>

        {accounts && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-2xl border border-eco-100 p-4">
              <div className="font-display font-bold text-eco-900 text-2xl">{accounts.length}</div>
              <div className="text-eco-500 text-xs font-body">Contas</div>
            </div>
            <div className="bg-white rounded-2xl border border-eco-100 p-4">
              <div className="font-display font-bold text-eco-900 text-2xl">{accounts.filter((a) => a.role === 'cidadao').length}</div>
              <div className="text-eco-500 text-xs font-body">Cidadãos</div>
            </div>
            <div className={`rounded-2xl border p-4 ${inactiveCount ? 'bg-drach-light border-drach/20' : 'bg-white border-eco-100'}`}>
              <div className={`font-display font-bold text-2xl ${inactiveCount ? 'text-drach' : 'text-eco-900'}`}>{inactiveCount}</div>
              <div className="text-eco-500 text-xs font-body">Inativas</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-4 px-4" role="group" aria-label="Tempo sem uso">
          {PERIODS.map((p, i) => (
            <button key={p.days} onClick={() => setPeriod(i)} aria-pressed={period === i} className={chip(period === i)}>{p.label}</button>
          ))}
        </div>
        <div className="flex gap-2 mb-5" role="group" aria-label="Perfil">
          {([['todos', 'Todos'], ['cidadao', 'Cidadãos'], ['equipe', 'Equipe']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRole(v)} aria-pressed={role === v} className={chip(role === v)}>{l}</button>
          ))}
        </div>

        {loadError ? (
          <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-sm font-body text-eco-600">
            Não foi possível carregar as contas.{' '}
            <button onClick={load} className="font-semibold underline">Tentar de novo</button>
          </div>
        ) : !accounts ? (
          <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-sm font-body text-eco-500">Carregando contas…</div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-sm font-body text-eco-500">Nenhuma conta neste filtro.</div>
        ) : (
          <ul className="bg-white rounded-2xl border border-eco-100 divide-y divide-eco-50">
            {list.map((a) => {
              const days = daysSince(a.lastActivityAt);
              const inactive = days >= inactiveDays;
              const lastManager = a.role === 'gestor' && managers <= 1;
              const blocked = a.me || lastManager;
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-xs bg-gradient-to-br from-eco-400 to-eco-700 shrink-0">
                    {initials(a.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body font-semibold text-eco-900 text-sm truncate">{a.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-eco-50 text-eco-600">{ROLE_LABEL[a.role]}</span>
                      {a.me && <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-eco-100 text-eco-700">Você</span>}
                      {inactive && <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-drach-light text-drach">Inativa</span>}
                    </div>
                    <div className="text-xs text-eco-500 font-body truncate">{a.email}</div>
                    <div className="text-[11px] text-eco-400 font-body">
                      Última atividade {fmtDays(days)}
                      {a.role === 'cidadao' && ` · ${a.drachs.toLocaleString('pt-BR')} Ecopontos · ${a.descartes} descarte(s)`}
                    </div>
                  </div>
                  <button
                    onClick={() => ask(a)}
                    disabled={blocked}
                    title={a.me ? 'Você não pode excluir a própria conta' : lastManager ? 'É o único gestor' : 'Excluir conta'}
                    className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-display font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    Excluir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-splash-in">
            <h2 id="del-title" className="font-display font-bold text-eco-900 text-lg mb-1">Excluir a conta de {confirm.name.split(' ')[0]}?</h2>
            <p className="text-eco-500 text-sm font-body mb-3">
              {confirm.email} · última atividade {fmtDays(daysSince(confirm.lastActivityAt))}.
            </p>
            <ul className="text-sm font-body text-eco-700 space-y-1.5 mb-4 list-disc pl-5">
              <li>O acesso é removido e os dados pessoais são apagados.</li>
              {confirm.role === 'cidadao' && <li>O saldo de {confirm.drachs.toLocaleString('pt-BR')} Ecopontos é perdido.</li>}
              <li>O histórico de entregas e coletas continua nos relatórios, sem identificação.</li>
              <li>Entregas pendentes são recusadas e coletas agendadas, canceladas.</li>
            </ul>
            <label className="flex items-start gap-2 text-sm font-body text-eco-800 mb-5 cursor-pointer">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-600" />
              Entendo que esta ação não pode ser desfeita.
            </label>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 h-11 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50">Cancelar</button>
              <button onClick={remove} disabled={!understood || busy} className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-display font-semibold hover:bg-red-700 disabled:opacity-40">
                {busy ? 'Excluindo…' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
