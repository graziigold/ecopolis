import type { Screen, UserData } from '../types';
import { AppLayout } from '../components/Nav';
import { ChevronRightIcon, LogOutIcon, MapPinIcon, RecycleIcon, ShoppingBagIcon, StarIcon, UserIcon } from '../components/Icons';
import type { ManagerKpis, Material, Reward, Suggestion } from '../data/catalog';

interface Props {
  user: UserData;
  navigate: (s: Screen) => void;
  materials: Material[];
  rewards: Reward[];
  suggestions: Suggestion[];
  kpis: ManagerKpis | null;
  onLogout: () => void;
}


export default function Gestao({ user, navigate, materials, rewards, suggestions, kpis, onLogout }: Props) {
  const fmt = (n?: number) => (n === undefined ? '-' : n.toLocaleString('pt-BR'));
  const KPIS = [
    { label: 'Cidadãos cadastrados', value: fmt(kpis?.citizens), icon: UserIcon },
    { label: 'Kg coletados no mês', value: fmt(kpis?.kgMonth), icon: RecycleIcon },
    { label: 'Ecopontos emitidos no mês', value: fmt(kpis?.pointsMonth), icon: StarIcon },
    { label: 'Resgates no mês', value: fmt(kpis?.redemptionsMonth), icon: ShoppingBagIcon },
  ];
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pendente').length;
  const active = materials.filter((m) => m.active);
  const max = Math.max(...active.map((m) => m.rate), 1);
  const lowStock = rewards.filter((r) => r.active && r.stock <= 20);

  return (
    <AppLayout screen="gestao" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 lg:max-w-5xl lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-drach">Painel gerencial</span>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Olá, {user.name}</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Visão geral do programa no Gama.</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-body text-eco-600 hover:bg-eco-100">
            <LogOutIcon size={16} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {!!kpis?.inactiveAccounts && (
          <button
            onClick={() => navigate('gestaoContas')}
            className="w-full text-left flex items-center gap-3 rounded-2xl bg-white border border-eco-100 px-4 py-3.5 mb-3 hover:border-eco-300 transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-eco-50 text-eco-700 flex items-center justify-center flex-shrink-0"><UserIcon size={17} /></span>
            <span className="flex-1 text-sm font-body text-eco-800">
              <strong className="font-semibold">{kpis.inactiveAccounts} {kpis.inactiveAccounts === 1 ? 'conta inativa' : 'contas inativas'}</strong> há mais de 90 dias.
            </span>
            <ChevronRightIcon size={16} className="text-eco-400 flex-shrink-0" />
          </button>
        )}
        {pendingSuggestions > 0 && (
          <button
            onClick={() => navigate('gestaoSugestoes')}
            className="w-full text-left flex items-center gap-3 rounded-2xl bg-drach-light border border-drach/20 px-4 py-3.5 mb-5 hover:border-drach/40 transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-white text-drach flex items-center justify-center flex-shrink-0"><MapPinIcon size={17} /></span>
            <span className="flex-1 text-sm font-body text-eco-800">
              <strong className="font-semibold">{pendingSuggestions} {pendingSuggestions === 1 ? 'sugestão de ecolocalização aguarda' : 'sugestões de ecolocalização aguardam'}</strong> sua análise.
            </span>
            <ChevronRightIcon size={16} className="text-drach flex-shrink-0" />
          </button>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-2xl border border-eco-100 p-4">
                <div className="w-9 h-9 rounded-xl bg-eco-50 flex items-center justify-center mb-3">
                  <Icon size={17} className="text-eco-700" />
                </div>
                <div className="font-display font-bold text-eco-900 text-xl">{k.value}</div>
                <div className="text-eco-500 text-xs font-body mt-0.5">{k.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
          <section className="bg-white rounded-2xl border border-eco-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-eco-900">Tabela de valores atual</h2>
              <button onClick={() => navigate('gestaoResiduos')} className="text-xs font-semibold text-eco-600 hover:text-eco-900 flex items-center gap-1">
                Editar <ChevronRightIcon size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {active.map((m) => (
                <div key={m.key}>
                  <div className="flex justify-between text-sm font-body mb-1">
                    <span className="text-eco-700">{m.label}</span>
                    <span className="font-display font-semibold text-drach">{m.rate} EP/kg</span>
                  </div>
                  <div className="h-2 rounded-full bg-eco-50 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(m.rate / max) * 100}%`, background: 'linear-gradient(90deg, #3a9448, #1d5c2a)' }} />
                  </div>
                </div>
              ))}
              {materials.length > active.length && (
                <p className="text-xs text-eco-400 font-body pt-1">{materials.length - active.length} resíduo(s) desativado(s)</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-eco-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-eco-900">Estoque baixo</h2>
              <button onClick={() => navigate('gestaoRecompensas')} className="text-xs font-semibold text-eco-600 hover:text-eco-900 flex items-center gap-1">
                Gerenciar <ChevronRightIcon size={14} />
              </button>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-eco-500 font-body">Todas as recompensas estão com estoque saudável.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-body text-eco-700 truncate">{r.name}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-drach-light text-drach text-xs font-semibold">{r.stock} un.</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
