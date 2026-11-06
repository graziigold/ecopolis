import { levelProgress as progressOf } from '../types';
import type { UserData, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import Avatar from '../components/Avatar';
import {
  ClockIcon,
  ChevronRightIcon,
  LeafIcon,
  LogOutIcon,
  StarIcon,
  RecycleIcon,
  PackageIcon,
  BellIcon,
  ClipboardIcon,
  MapPinIcon,
  CameraIcon,
  UserIcon,
} from '../components/Icons';

interface PerfilProps {
  user: UserData;
  navigate: (s: Screen) => void;
  onLogout: () => void;
}

const LEVEL_COLORS: Record<number, { from: string; to: string; badge: string }> = {
  1: { from: '#6b8070', to: '#4a5c50', badge: '#e8f0ea' },
  2: { from: '#3a9448', to: '#267035', badge: '#e8f5e9' },
  3: { from: '#2d7a3a', to: '#1d5c2a', badge: '#c8e6ca' },
  4: { from: '#1d5c2a', to: '#0f3518', badge: '#a5d6a7' },
};

export default function Perfil({ user, navigate, onLogout }: PerfilProps) {
  const colors = LEVEL_COLORS[Math.min(user.levelNum, 4)] || LEVEL_COLORS[3];
  const levelProgress = progressOf(user);

  const configItems: { label: string; icon: typeof StarIcon; screen: Screen }[] = [
    { label: 'Editar perfil', icon: UserIcon, screen: 'editarPerfil' },
    { label: 'Minhas notificações', icon: BellIcon, screen: 'notificacoes' },
    { label: 'Minhas coletas', icon: ClipboardIcon, screen: 'minhasColetas' },
    { label: 'Sugerir ecolocalização', icon: MapPinIcon, screen: 'registrarEcoponto' },
  ];

  return (
    <AppLayout screen="perfil" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">

        {/* Profile header card */}
        <div
          className="rounded-2xl p-6 mb-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
        >
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-white/10" />
          <div className="absolute -right-2 top-4 w-16 h-16 rounded-full border border-white/8" />

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <button onClick={() => navigate('editarPerfil')} aria-label="Alterar foto do perfil" className="relative flex-shrink-0 group">
              <Avatar user={user} className="w-16 h-16 rounded-2xl text-white bg-white/20 ring-2 ring-white/30" textClassName="text-2xl" />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-eco-800 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                <CameraIcon size={13} />
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-white/70 text-xs font-body font-medium tracking-wide mb-0.5">
                Olá, bem-vindo de volta!
              </div>
              <h1 className="font-display font-bold text-white text-xl leading-tight truncate">{user.name}</h1>
              <p className="text-white/60 text-xs font-body truncate">{user.email}</p>
              {user.sector && <p className="text-white/60 text-xs font-body truncate">{user.sector}, Gama (DF)</p>}
            </div>
            <button
              onClick={() => navigate('editarPerfil')}
              className="self-start flex-shrink-0 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-display font-semibold transition-colors"
            >
              Editar
            </button>
          </div>

          {/* Level badge */}
          <div className="relative mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
              <LeafIcon size={13} className="text-eco-200" />
              <span className="text-white/90 text-xs font-body font-semibold">{user.level}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <span className="text-white/70 text-xs font-body">Nível {user.levelNum}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="relative mt-3">
            <div className="flex justify-between text-xs font-body mb-1">
              <span className="text-white/50">{user.nextLevelAt === null ? 'Nível máximo' : `Próximo nível: ${user.nextLevelAt.toLocaleString('pt-BR')} pontos ganhos`}</span>
              <span className="text-white/70">{Math.round(levelProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${levelProgress}%`, background: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mb-5">
          <p className="font-display font-semibold text-eco-800 text-base">
            Olá, {user.name.split(' ')[0]}!
          </p>
          <p className="text-eco-500 text-sm font-body">Seu impacto está crescendo.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Ecopontos card */}
          <div className="bg-white rounded-2xl p-4 border border-eco-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fdf6eb' }}>
                <StarIcon size={16} style={{ color: '#b07d30' }} />
              </div>
              <span className="text-eco-500 text-xs font-body font-medium">Ecopontos</span>
            </div>
            <div className="font-display font-bold text-eco-900 text-2xl">{user.drachs.toLocaleString('pt-BR')}</div>
            <div className="text-eco-400 text-xs font-body mt-0.5">saldo sustentável</div>
          </div>

          {/* Descartes card */}
          <div className="bg-white rounded-2xl p-4 border border-eco-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-eco-100">
                <RecycleIcon size={16} className="text-eco-700" />
              </div>
              <span className="text-eco-500 text-xs font-body font-medium">Descartes</span>
            </div>
            <div className="font-display font-bold text-eco-900 text-2xl">{user.descartes}</div>
            <div className="text-eco-400 text-xs font-body mt-0.5">realizados</div>
          </div>

          {/* Materiais */}
          <div className="bg-white rounded-2xl p-4 border border-eco-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-eco-100">
                <PackageIcon size={16} className="text-eco-600" />
              </div>
              <span className="text-eco-500 text-xs font-body font-medium">Materiais</span>
            </div>
            <div className="font-display font-bold text-eco-900 text-2xl">{user.materiais}</div>
            <div className="text-eco-400 text-xs font-body mt-0.5">reciclados</div>
          </div>

          {/* Nível */}
          <div className="bg-white rounded-2xl p-4 border border-eco-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-eco-100">
                <LeafIcon size={16} className="text-eco-700" />
              </div>
              <span className="text-eco-500 text-xs font-body font-medium">Nível</span>
            </div>
            <div className="font-display font-bold text-eco-900 text-base leading-tight">{user.level}</div>
            <div className="text-eco-400 text-xs font-body mt-0.5">nível {user.levelNum} de 5</div>
          </div>
        </div>

        {/* Histórico shortcut */}
        <button
          onClick={() => navigate('historico')}
          className="w-full bg-white rounded-2xl p-4 border border-eco-100 flex items-center gap-3 mb-5 hover:bg-eco-50 transition-colors active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-eco-100">
            <ClockIcon size={20} className="text-eco-700" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-body font-semibold text-eco-800 text-sm">Histórico de atividades</div>
            <div className="text-eco-400 text-xs font-body">Ver todas as suas ações sustentáveis</div>
          </div>
          <ChevronRightIcon size={18} className="text-eco-300" />
        </button>

        {/* Config section */}
        <h2 className="font-display font-semibold text-eco-700 text-sm mb-2 px-1 tracking-wide uppercase text-xs">
          Atalhos
        </h2>
        <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden mb-4">
          {configItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-eco-50 transition-colors active:bg-eco-100 ${
                  i < configItems.length - 1 ? 'border-b border-eco-50' : ''
                }`}
              >
                <Icon size={18} className="text-eco-500 flex-shrink-0" />
                <span className="flex-1 text-left font-body text-eco-700 text-sm">{item.label}</span>
                <ChevronRightIcon size={16} className="text-eco-300" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-sm font-body font-medium hover:text-red-700 transition-colors"
        >
          <LogOutIcon size={16} />
          Sair da conta
        </button>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
