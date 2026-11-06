import type { UserData, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import {
  ArrowLeftIcon,
  RecycleIcon,
  StarIcon,
  TrophyIcon,
  CalendarIcon,
  GiftIcon,
  BellIcon,
  CheckCircleIcon,
  MapPinIcon,
} from '../components/Icons';
import { fmtWhen } from '../data/catalog';
import type { AppNotification, NotificationKind } from '../data/catalog';

interface NotificacoesProps {
  user: UserData;
  navigate: (s: Screen) => void;
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
  onReadAll: () => void;
}

const KIND_ICON: Record<NotificationKind, typeof RecycleIcon> = {
  descarte: RecycleIcon,
  coleta: CalendarIcon,
  ranking: TrophyIcon,
  loja: GiftIcon,
  sugestao: MapPinIcon,
  bonus: StarIcon,
};

const TONE = {
  ok: { color: '#2d7a3a', bg: '#e8f5e9' },
  warn: { color: '#b07d30', bg: '#fdf6eb' },
  bad: { color: '#dc2626', bg: '#fef2f2' },
};

export default function Notificacoes({ navigate, items: raw, onOpen, onReadAll }: NotificacoesProps) {
  const items = [...raw].sort((a, b) => b.at - a.at);
  const unreadCount = items.filter((n) => n.unread).length;
  const open = onOpen;
  const markAll = onReadAll;

  return (
    <AppLayout screen="notificacoes" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('home')}
            className="p-2 -ml-2 rounded-full text-eco-600 hover:bg-eco-50 transition-colors"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-eco-900 text-2xl">Notificações</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">
              {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              className="text-eco-600 text-xs font-body font-semibold hover:text-eco-900 transition-colors"
            >
              Marcar todas
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-eco-100">
              <BellIcon size={34} className="text-eco-300" />
            </div>
            <h3 className="font-display font-bold text-eco-800 text-lg">Sem notificações</h3>
            <p className="text-eco-400 font-body text-sm mt-1">Você está em dia com o Gama.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => {
              const Icon = KIND_ICON[n.kind];
              const tone = TONE[n.tone ?? (n.kind === 'ranking' || n.kind === 'bonus' ? 'warn' : 'ok')];
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                    n.unread
                      ? 'bg-white border-eco-200 hover:border-eco-300'
                      : 'bg-eco-50/40 border-eco-100 hover:bg-eco-50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: tone.bg, color: tone.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-body text-sm truncate ${n.unread ? 'font-bold text-eco-900' : 'font-semibold text-eco-700'}`}>
                        {n.title}
                      </h3>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-eco-500 flex-shrink-0" />}
                    </div>
                    <p className="text-eco-500 text-xs font-body leading-relaxed mt-0.5">{n.body}</p>
                    <span className="text-eco-400 text-[11px] font-body mt-1 block">{fmtWhen(n.at)}</span>
                  </div>
                </button>
              );
            })}

            {unreadCount === 0 && (
              <div className="flex items-center justify-center gap-2 text-eco-400 text-xs font-body pt-4">
                <CheckCircleIcon size={14} />
                Você leu todas as notificações
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
