import type { Screen } from '../types';
import EcoLogo, { LogoMark } from './EcoLogo';
import {
  HomeIcon,
  MapPinIcon,
  RecycleIcon,
  CalendarIcon,
  ShoppingBagIcon,
  TrophyIcon,
  UserIcon,
  ClockIcon,
  LayersIcon,
  SettingsIcon,
  PackageIcon,
  ClipboardIcon,
} from './Icons';

interface NavProps {
  screen: Screen;
  navigate: (s: Screen) => void;
}

const mobileItems = [
  { label: 'Home', icon: HomeIcon, screen: 'home' as Screen },
  { label: 'Ecolocalizações', icon: MapPinIcon, screen: 'ecopontos' as Screen },
  { label: 'Descarte', icon: RecycleIcon, screen: 'descarte' as Screen },
  { label: 'Loja', icon: ShoppingBagIcon, screen: 'loja' as Screen },
  { label: 'Perfil', icon: UserIcon, screen: 'perfil' as Screen },
];

const sidebarItems = [
  { label: 'Home', icon: HomeIcon, screen: 'home' as Screen },
  { label: 'Mapa de Ecolocalizações', icon: MapPinIcon, screen: 'ecopontos' as Screen },
  { label: 'Registrar Descarte', icon: RecycleIcon, screen: 'descarte' as Screen },
  { label: 'Agendar Coleta', icon: CalendarIcon, screen: 'coleta' as Screen },
  { label: 'Minhas Coletas', icon: ClipboardIcon, screen: 'minhasColetas' as Screen },
  { label: 'Loja de Recompensas', icon: ShoppingBagIcon, screen: 'loja' as Screen },
  { label: 'Ranking & Conquistas', icon: TrophyIcon, screen: 'ranking' as Screen },
  { label: 'Histórico', icon: ClockIcon, screen: 'historico' as Screen },
  { label: 'Perfil', icon: UserIcon, screen: 'perfil' as Screen },
];

const managerItems = [
  { label: 'Painel', icon: LayersIcon, screen: 'gestao' as Screen },
  { label: 'Resíduos e valores', icon: RecycleIcon, screen: 'gestaoResiduos' as Screen },
  { label: 'Recompensas', icon: ShoppingBagIcon, screen: 'gestaoRecompensas' as Screen },
  { label: 'Parceiros', icon: PackageIcon, screen: 'gestaoParceiros' as Screen },
  { label: 'Equipe', icon: UserIcon, screen: 'gestaoEquipe' as Screen },
  { label: 'Sugestões', icon: MapPinIcon, screen: 'gestaoSugestoes' as Screen },
];

const operatorItems = [
  { label: 'Receber entregas', icon: RecycleIcon, screen: 'operador' as Screen },
  { label: 'Coletas agendadas', icon: CalendarIcon, screen: 'operadorColetas' as Screen },
];

const isManager = (s: Screen) => s.startsWith('gestao');
// Sub-telas destacam o item de menu ao qual pertencem.
const PARENT: Partial<Record<Screen, Screen>> = { registrarEcoponto: 'ecopontos', notificacoes: 'home', editarPerfil: 'perfil' };
const isActiveItem = (item: Screen, screen: Screen) => item === screen || PARENT[screen] === item;
const isOperator = (s: Screen) => s.startsWith('operador');

export function BottomNav({ screen, navigate }: NavProps) {
  return (
    <nav className={`${isOperator(screen) ? 'hidden' : 'lg:hidden'} fixed bottom-0 left-0 right-0 bg-white border-t border-eco-100 h-16 flex items-center z-50`}>
      {(isManager(screen) ? managerItems.map((i) => ({ ...i, label: i.label.split(' ')[0] })) : mobileItems).map((item) => {
        const Icon = item.icon;
        const isActive = isActiveItem(item.screen, screen);

        return (
          <button
            key={item.label}
            onClick={() => navigate(item.screen)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
              isActive ? 'text-eco-800' : 'text-eco-400 hover:text-eco-600'
            }`}
          >
            <Icon size={21} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function SideNav({ screen, navigate }: NavProps) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-eco-100 z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <EcoLogo width={140} />
        {isOperator(screen) && (
          <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-eco-100 text-eco-700 text-[11px] font-semibold uppercase tracking-wider">
            <RecycleIcon size={12} />
            Operador de ecolocalização
          </span>
        )}
        {isManager(screen) && (
          <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-drach-light text-drach text-[11px] font-semibold uppercase tracking-wider">
            <SettingsIcon size={12} />
            Modo gestor
          </span>
        )}
      </div>

      <div className="mx-4 mb-3 h-px bg-eco-100" />

      {/* Active nav */}
      <div className="px-3 space-y-0.5 flex-1">
        {(isOperator(screen) ? operatorItems : isManager(screen) ? managerItems : sidebarItems).map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item.screen, screen);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-eco-800 text-white'
                  : 'text-eco-600 hover:bg-eco-50 hover:text-eco-900'
              }`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

/** Alternância entre as telas do operador (no celular não há barra de navegação). */
export function OperatorTabs({ screen, navigate, counts }: NavProps & { counts?: Partial<Record<Screen, number>> }) {
  return (
    <div role="tablist" aria-label="Área do operador" className="lg:hidden grid grid-cols-2 p-1 rounded-xl bg-eco-100/70 mb-5">
      {operatorItems.map((item) => {
        const active = item.screen === screen;
        const n = counts?.[item.screen];
        return (
          <button
            key={item.screen}
            role="tab"
            aria-selected={active}
            onClick={() => navigate(item.screen)}
            className={`h-10 rounded-lg text-sm font-display font-semibold transition-all ${active ? 'bg-white text-eco-900 shadow-sm' : 'text-eco-500 hover:text-eco-800'}`}
          >
            {item.label}
            {n ? <span className="ml-1.5 text-[11px] font-body text-eco-500">({n})</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function AppLayout({
  screen,
  navigate,
  children,
}: NavProps & { children: React.ReactNode }) {
  return (
    <div className="h-full flex">
      <SideNav screen={screen} navigate={navigate} />
      <main className={`flex-1 lg:ml-60 overflow-y-auto ${isOperator(screen) ? '' : 'pb-20'} lg:pb-0 h-full`}>
        {children}
      </main>
      <BottomNav screen={screen} navigate={navigate} />
    </div>
  );
}
