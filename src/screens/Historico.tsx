import { useState } from 'react';
import type { UserData, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { LeafIcon, ClockIcon, ClipboardIcon, ChevronRightIcon } from '../components/Icons';
import { fmtWhen } from '../data/catalog';
import type { Delivery, Material, Pickup, Redemption } from '../data/catalog';
import { buildActivities, TONE_STYLE } from '../data/activity';
import type { ActivityKind } from '../data/activity';

interface HistoricoProps {
  user: UserData;
  navigate: (s: Screen) => void;
  deliveries: Delivery[];
  pickups: Pickup[];
  redemptions: Redemption[];
  materials: Material[];
}

const FILTERS: { label: string; kind?: ActivityKind }[] = [
  { label: 'Todos' },
  { label: 'Descartes', kind: 'descarte' },
  { label: 'Coletas', kind: 'coleta' },
  { label: 'Recompensas', kind: 'recompensa' },
];

export default function Historico({ user, navigate, deliveries, pickups, redemptions, materials }: HistoricoProps) {
  const [filter, setFilter] = useState(0);
  const all = buildActivities(user.email, deliveries, pickups, redemptions, materials);
  const kind = FILTERS[filter].kind;
  const list = kind ? all.filter((a) => a.kind === kind) : all;

  return (
    <AppLayout screen="historico" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Histórico</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Suas ações sustentáveis</p>
          </div>
          <button
            onClick={() => navigate('minhasColetas')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-eco-200 bg-white text-eco-700 text-xs font-display font-semibold hover:bg-eco-50 transition-colors flex-shrink-0"
          >
            <ClipboardIcon size={15} />
            Minhas coletas
          </button>
        </div>

        {/* Summary bar */}
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #1d5c2a, #0f3518)' }}>
          <div className="flex-1 text-center">
            <div className="font-display font-bold text-white text-lg">{user.drachs.toLocaleString('pt-BR')}</div>
            <div className="text-white/60 text-[11px] font-body">Ecopontos</div>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="flex-1 text-center">
            <div className="font-display font-bold text-white text-lg">{user.descartes}</div>
            <div className="text-white/60 text-[11px] font-body">Descartes</div>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="flex-1 text-center">
            <div className="font-display font-bold text-white text-lg">{user.materiais}</div>
            <div className="text-white/60 text-[11px] font-body">Materiais</div>
          </div>
        </div>

        {all.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4" role="tablist" aria-label="Filtrar atividades">
              {FILTERS.map((f, i) => (
                <button
                  key={f.label}
                  role="tab"
                  aria-selected={filter === i}
                  onClick={() => setFilter(i)}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium whitespace-nowrap border transition-all ${
                    filter === i ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 bg-white text-eco-600 hover:border-eco-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <p className="text-center text-eco-400 text-sm font-body py-12">Nenhuma atividade nesta categoria.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-eco-100" />
                <div className="space-y-1">
                  {list.map((a) => {
                    const Icon = a.icon;
                    const tone = TONE_STYLE[a.tone];
                    return (
                      <div key={a.id} className="flex gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                          style={{ backgroundColor: tone.bg, color: tone.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0 bg-white rounded-2xl px-4 py-3 border border-eco-100 mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-body font-semibold text-eco-800 text-sm">{a.title}</div>
                              <div className="text-eco-400 text-xs font-body break-words">{a.sub}</div>
                            </div>
                            {a.amount !== undefined && (
                              <div className={`font-body font-bold text-sm flex-shrink-0 ${a.amount >= 0 ? 'text-eco-600' : 'text-drach'}`}>
                                {a.amount >= 0 ? '+' : '−'}
                                {Math.abs(a.amount).toLocaleString('pt-BR')} Ecopontos
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-eco-400">
                              <ClockIcon size={11} />
                              <span className="text-[11px] font-body">{fmtWhen(a.at)}</span>
                            </div>
                            <span
                              className="text-[10px] font-semibold font-body px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: tone.bg, color: tone.color }}
                            >
                              {a.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-eco-100">
              <LeafIcon size={36} className="text-eco-300" />
            </div>
            <h3 className="font-display font-bold text-eco-800 text-xl mb-2">Histórico vazio</h3>
            <p className="text-eco-400 font-body text-sm max-w-xs leading-relaxed">
              Você ainda não realizou nenhuma ação sustentável. Comece agora e acumule seus primeiros Ecopontos!
            </p>
            <button
              onClick={() => navigate('descarte')}
              className="mt-6 flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-display font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}
            >
              Registrar primeiro descarte
              <ChevronRightIcon size={15} />
            </button>
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
