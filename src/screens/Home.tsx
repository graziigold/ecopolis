import { levelProgress as progressOf } from '../types';
import type { UserData, Screen } from '../types';
import type { Delivery, Material, Pickup, Redemption, Ranking } from '../data/catalog';
import { fmtDay, fmtWhen, SLOTS } from '../data/catalog';
import { buildActivities, TONE_STYLE } from '../data/activity';
import { AppLayout } from '../components/Nav';
import Avatar from '../components/Avatar';
import {
  BellIcon,
  MapPinIcon,
  RecycleIcon,
  CalendarIcon,
  LeafIcon,
  ChevronRightIcon,
  TrophyIcon,
  ShoppingBagIcon,
} from '../components/Icons';

interface HomeProps {
  user: UserData;
  navigate: (s: Screen) => void;
  hasUnread: boolean;
  onOpenNotifications: () => void;
  deliveries: Delivery[];
  pickups: Pickup[];
  redemptions: Redemption[];
  materials: Material[];
  ranking: Ranking | null;
}

const QUICK_ACTIONS: { label: string; icon: typeof MapPinIcon; screen: Screen }[] = [
  { label: 'Encontrar Ecolocalização', icon: MapPinIcon, screen: 'ecopontos' },
  { label: 'Registrar Descarte', icon: RecycleIcon, screen: 'descarte' },
  { label: 'Agendar Coleta', icon: CalendarIcon, screen: 'coleta' },
];

export default function Home({ user, navigate, hasUnread, onOpenNotifications, deliveries, pickups, redemptions, materials, ranking }: HomeProps) {
  // Pendentes primeiro (o cidadão precisa do código), depois as mais recentes.
  const mine = deliveries
    .filter((d) => d.citizenEmail === user.email)
    .sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente') || (b.resolvedAt ?? b.at) - (a.resolvedAt ?? a.at))
    .slice(0, 4);
  const recent = buildActivities(user.email, deliveries, pickups, redemptions, materials).slice(0, 4);
  const nextPickup = pickups
    .filter((p) => p.citizenEmail === user.email && p.status === 'agendada')
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)[0];
  const label = (k?: string) => materials.find((m) => m.key === k)?.label ?? k;
  const levelProgress = progressOf(user);
  const position = ranking?.geral.position;

  return (
    <AppLayout screen="home" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">
              Olá, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              Vamos tornar o Gama mais sustentável hoje?
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-full bg-white border border-eco-200 text-eco-600 hover:bg-eco-50 transition-colors"
            >
              <BellIcon size={19} />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-eco-500 rounded-full" />
              )}
            </button>
            <button onClick={() => navigate('perfil')} aria-label="Abrir perfil" className="rounded-full hover:opacity-90 transition-opacity">
              <Avatar user={user} className="w-10 h-10 rounded-full text-white bg-gradient-to-br from-eco-500 to-eco-800" textClassName="text-sm" />
            </button>
          </div>
        </div>

        {/* Ecoponto Card */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'linear-gradient(135deg, #267035 0%, #1d5c2a 55%, #0f3518 100%)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-white/55 text-xs font-body font-medium uppercase tracking-widest mb-1.5">
                Saldo sustentável
              </div>
              <div className="font-display font-bold text-white" style={{ fontSize: 38, lineHeight: 1 }}>
                {user.drachs.toLocaleString('pt-BR')}
              </div>
              <div className="text-eco-300 text-base font-semibold mt-0.5">Ecopontos</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <LeafIcon size={20} className="text-eco-300" />
            </div>
          </div>

          {/* Level */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/80 text-xs font-body font-medium bg-white/10 rounded-full px-2.5 py-1">
              {user.level}
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs font-body mb-1">
              <span className="text-white/45">{user.nextLevelAt === null ? 'Nível máximo' : `Próximo nível: ${user.nextLevelAt.toLocaleString('pt-BR')} pontos ganhos`}</span>
              <span className="text-white/65">{Math.round(levelProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/12 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${levelProgress}%`, background: 'linear-gradient(90deg, #86c88a, #4caf50)' }}
              />
            </div>
          </div>
        </div>

        {/* Deliveries */}
        {mine.length > 0 && (
          <section className="bg-white rounded-2xl border border-eco-100 p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-eco-900 text-sm">Minhas entregas</h2>
              <span className="text-[11px] text-eco-400 font-body">Mostre o código na ecolocalização</span>
            </div>
            <ul className="divide-y divide-eco-50">
              {mine.map((d) => (
                <li key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-body font-semibold text-eco-800 truncate">
                      {label(d.materialKey)} · {d.declaredKg} kg declarados
                    </div>
                    <div className={`text-xs font-body ${d.status === 'recusada' ? 'text-red-500' : d.status === 'ajustada' ? 'text-drach' : 'text-eco-400'}`}>
                      {d.status === 'pendente' && `Aguardando conferência · ${fmtWhen(d.at)}`}
                      {d.status === 'confirmada' && `Confirmada: ${d.realKg} kg · +${d.drachs} Ecopontos`}
                      {d.status === 'ajustada' && `Ajustada: ${d.reason} · +${d.drachs} Ecopontos`}
                      {d.status === 'recusada' && `Recusada: ${d.reason}`}
                    </div>
                  </div>
                  {d.status === 'pendente' ? (
                    <span className="shrink-0 font-display font-bold text-eco-900 text-lg tracking-[0.25em] bg-eco-50 border border-eco-200 rounded-lg px-2.5 py-1">{d.code}</span>
                  ) : (
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${d.status === 'confirmada' ? 'bg-eco-100 text-eco-700' : d.status === 'ajustada' ? 'bg-drach-light text-drach' : 'bg-red-50 text-red-600'}`}>{d.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {nextPickup && (
          <button
            onClick={() => navigate('minhasColetas')}
            className="w-full text-left bg-white rounded-2xl border border-eco-100 p-4 mb-5 flex items-center gap-3 hover:border-eco-300 transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-drach-light text-drach">
              <CalendarIcon size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-eco-400 font-body">Próxima coleta</div>
              <div className="font-body font-semibold text-eco-800 text-sm truncate">
                {fmtDay(nextPickup.date)} · {SLOTS[nextPickup.slot].label}
              </div>
              <div className="text-eco-400 text-xs font-body truncate">{nextPickup.type}</div>
            </div>
            <ChevronRightIcon size={16} className="text-eco-300 flex-shrink-0" />
          </button>
        )}

        {/* Quick Actions */}
        <div className="mb-5">
          <h2 className="font-display font-semibold text-eco-800 text-sm mb-3 uppercase tracking-wider text-xs">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.screen)}
                  className="relative bg-white rounded-2xl px-3 py-4 border border-eco-100 flex flex-col items-center gap-2 text-center hover:border-eco-300 hover:bg-eco-50/50 transition-all"
                >
                  <Icon size={22} className="text-eco-700" />
                  <span className="text-eco-700 text-xs font-semibold font-body leading-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts: Loja + Ranking */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => navigate('loja')}
            className="text-left rounded-2xl p-4 border border-eco-100 flex items-center gap-3 hover:border-eco-300 transition-all"
            style={{ background: 'linear-gradient(135deg, #fdf6eb, #f6e9cf)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(176,125,48,0.15)' }}>
              <ShoppingBagIcon size={19} style={{ color: '#b07d30' }} />
            </div>
            <div className="min-w-0">
              <div className="font-body font-semibold text-eco-800 text-sm leading-tight">Loja</div>
              <div className="text-drach text-xs font-body truncate">Trocar Ecopontos</div>
            </div>
          </button>
          <button
            onClick={() => navigate('ranking')}
            className="text-left rounded-2xl p-4 border border-eco-100 bg-white flex items-center gap-3 hover:border-eco-300 transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-eco-100">
              <TrophyIcon size={19} className="text-eco-700" />
            </div>
            <div className="min-w-0">
              <div className="font-body font-semibold text-eco-800 text-sm leading-tight">Ranking</div>
              <div className="text-eco-400 text-xs font-body truncate">{position ? `Você é ${position}º no Gama` : 'Veja sua posição'}</div>
            </div>
          </button>
        </div>

        {/* Impact */}
        <div className="mb-5">
          <h2 className="font-display font-semibold text-eco-800 text-sm mb-3 uppercase tracking-wider text-xs">
            Seu impacto
          </h2>
          <div className="bg-white rounded-2xl border border-eco-100 p-4">
            <div className="grid grid-cols-3 divide-x divide-eco-100">
              <div className="text-center pr-4">
                <div className="font-display font-bold text-eco-900 text-2xl">{user.drachs.toLocaleString('pt-BR')}</div>
                <div className="text-eco-400 text-xs font-body mt-0.5">Ecopontos</div>
              </div>
              <div className="text-center px-4">
                <div className="font-display font-bold text-eco-900 text-2xl">{user.descartes}</div>
                <div className="text-eco-400 text-xs font-body mt-0.5">Descartes</div>
              </div>
              <div className="text-center pl-4">
                <div className="font-display font-bold text-eco-900 text-2xl">{user.materiais}</div>
                <div className="text-eco-400 text-xs font-body mt-0.5">Materiais</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-eco-800 text-sm uppercase tracking-wider text-xs">
              Atividades recentes
            </h2>
            <button
              onClick={() => navigate('historico')}
              className="flex items-center gap-1 text-eco-600 text-xs font-semibold font-body hover:text-eco-900 transition-colors"
            >
              Ver histórico
              <ChevronRightIcon size={13} />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-eco-100 px-4 py-6 text-center text-eco-400 text-sm font-body">
              Suas ações aparecem aqui. Que tal registrar o primeiro descarte?
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden">
              {recent.map((a, i) => {
                const Icon = a.icon;
                const tone = TONE_STYLE[a.tone];
                return (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < recent.length - 1 ? 'border-b border-eco-50' : ''}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tone.bg, color: tone.color }}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-semibold text-eco-800 text-sm truncate">{a.title}</div>
                      <div className="text-eco-400 text-xs font-body truncate">{fmtWhen(a.at)} · {a.status}</div>
                    </div>
                    {a.amount !== undefined && (
                      <div className={`text-xs font-bold font-body flex-shrink-0 ${a.amount >= 0 ? 'text-eco-600' : 'text-drach'}`}>
                        {a.amount >= 0 ? '+' : '−'}{Math.abs(a.amount).toLocaleString('pt-BR')} Ecopontos
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
