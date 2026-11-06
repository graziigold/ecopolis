import { useState } from 'react';
import type { UserData, Screen } from '../types';
import type { Ranking as RankingData, RankingEntry } from '../data/catalog';
import { AppLayout } from '../components/Nav';
import Avatar, { initials } from '../components/Avatar';
import { TrophyIcon, MedalIcon, LeafIcon, RecycleIcon, StarIcon, CheckCircleIcon } from '../components/Icons';

interface RankingProps {
  user: UserData;
  navigate: (s: Screen) => void;
  ranking: RankingData | null;
}

const PERIODS: { key: keyof RankingData; label: string; hint: string }[] = [
  { key: 'semana', label: 'Semana', hint: 'Ecopontos ganhos nos últimos 7 dias' },
  { key: 'mes', label: 'Mês', hint: 'Ecopontos ganhos nos últimos 30 dias' },
  { key: 'geral', label: 'Geral', hint: 'Total de Ecopontos já ganhos' },
];

const PODIUM_COLORS = ['#b07d30', '#9ca3af', '#c08a52'];

export default function Ranking({ user, navigate, ranking }: RankingProps) {
  const [period, setPeriod] = useState(2);
  const data = ranking?.[PERIODS[period].key];
  const top = data?.top ?? [];
  const podium = top.slice(0, 3);
  const rest = top.slice(3);
  const meInTop = top.some((p) => p.me);
  const geral = ranking?.geral;

  const achievements = [
    { name: 'Primeiro descarte', icon: RecycleIcon, done: user.descartes >= 1 },
    { name: 'Guardião Verde', icon: LeafIcon, done: user.levelNum >= 3 },
    { name: '1.000 Ecopontos', icon: StarIcon, done: user.earned >= 1000 },
    { name: '10 descartes', icon: RecycleIcon, done: user.descartes >= 10 },
    { name: 'Top 10 do Gama', icon: TrophyIcon, done: !!geral?.position && geral.position <= 10 && geral.myPoints > 0 },
    { name: 'Mestre da reciclagem', icon: MedalIcon, done: user.descartes >= 50 },
  ];

  const Row = ({ p, pos, highlight }: { p: RankingEntry; pos: number; highlight?: boolean }) => (
    <div className={`flex items-center gap-3 px-4 py-3 ${highlight ? 'bg-drach-light' : ''}`}>
      <span className={`w-6 text-center font-display font-bold text-sm ${highlight ? 'text-drach' : 'text-eco-400'}`}>{pos}</span>
      {p.me ? (
        <Avatar user={user} className="w-9 h-9 rounded-full text-white bg-gradient-to-br from-drach to-[#8a6120]" textClassName="text-xs" />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-xs bg-gradient-to-br from-eco-300 to-eco-500">
          {initials(p.name)}
        </div>
      )}
      <span className="flex-1 font-body font-semibold text-eco-800 text-sm truncate">{p.me ? `${p.name} (você)` : p.name}</span>
      <span className={`font-display font-bold text-sm ${highlight ? 'text-drach' : 'text-eco-600'}`}>{p.points.toLocaleString('pt-BR')}</span>
    </div>
  );

  return (
    <AppLayout screen="ranking" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-3xl">
        <div className="mb-5">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Ranking &amp; conquistas</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">Ranking sustentável do Gama, DF</p>
        </div>

        <div className="inline-flex bg-white border border-eco-100 rounded-full p-1 mb-2" role="tablist" aria-label="Período do ranking">
          {PERIODS.map((p, i) => (
            <button key={p.key} role="tab" aria-selected={period === i} onClick={() => setPeriod(i)}
              className={`px-5 py-1.5 rounded-full text-sm font-body font-semibold transition-all ${period === i ? 'bg-eco-800 text-white' : 'text-eco-500 hover:text-eco-800'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-eco-400 text-xs font-body mb-5">{PERIODS[period].hint}</p>

        {!ranking ? (
          <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center text-eco-500 text-sm font-body mb-6">Carregando ranking…</div>
        ) : top.length === 0 || top.every((p) => p.points === 0) ? (
          <div className="bg-white rounded-2xl border border-eco-100 p-8 text-center mb-6">
            <TrophyIcon size={30} className="text-eco-300 mx-auto mb-2" />
            <p className="font-display font-semibold text-eco-800">Ninguém pontuou neste período ainda</p>
            <p className="text-eco-500 text-sm font-body mt-1">Registre um descarte e seja o primeiro do Gama!</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #267035 0%, #1d5c2a 55%, #0f3518 100%)' }}>
              <div className="flex items-end justify-center gap-3">
                {[1, 0, 2].filter((i) => podium[i]).map((idx) => {
                  const p = podium[idx];
                  const isGold = idx === 0;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 max-w-[110px]">
                      <div className="relative mb-2">
                        {p.me ? (
                          <Avatar user={user} className={`rounded-full text-white bg-gradient-to-br from-eco-500 to-eco-800 ${isGold ? 'w-16 h-16' : 'w-12 h-12'}`} textClassName={isGold ? 'text-lg' : 'text-sm'} />
                        ) : (
                          <div className={`rounded-full flex items-center justify-center text-white font-display font-bold bg-gradient-to-br from-eco-500 to-eco-800 ${isGold ? 'w-16 h-16 text-lg' : 'w-12 h-12 text-sm'}`}
                            style={{ border: `2px solid ${PODIUM_COLORS[idx]}` }}>
                            {initials(p.name)}
                          </div>
                        )}
                        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: PODIUM_COLORS[idx] }}>
                          {idx + 1}
                        </span>
                      </div>
                      <span className="text-white text-xs font-body font-semibold truncate max-w-full">{p.me ? 'Você' : p.name}</span>
                      <span className="text-eco-300 text-[11px] font-body mb-2">{p.points.toLocaleString('pt-BR')}</span>
                      <div className={`w-full ${isGold ? 'h-24' : idx === 1 ? 'h-18' : 'h-16'} rounded-t-xl`}
                        style={{ background: `linear-gradient(180deg, ${PODIUM_COLORS[idx]}55, ${PODIUM_COLORS[idx]}10)` }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {rest.length > 0 && (
              <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden mb-3 divide-y divide-eco-50">
                {rest.map((p, i) => <Row key={i} p={p} pos={i + 4} highlight={p.me} />)}
              </div>
            )}
          </>
        )}

        {ranking && data && !meInTop && (
          <div className="rounded-2xl overflow-hidden mb-6 border border-drach/20">
            <Row p={{ name: user.name.split(' ')[0], points: data.myPoints, me: true }} pos={data.position ?? data.total} highlight />
          </div>
        )}
        {(meInTop || !ranking) && <div className="mb-6" />}

        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">Suas conquistas</h2>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.name} className={`rounded-2xl p-3.5 border flex flex-col items-center gap-2 text-center ${a.done ? 'bg-white border-eco-100' : 'bg-eco-50/40 border-dashed border-eco-200'}`}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${a.done ? 'text-drach' : 'text-[#c8d6cb]'}`}
                    style={{ background: a.done ? 'linear-gradient(135deg, #fdf6eb, #f6e9cf)' : '#eef4ef' }}>
                    <Icon size={22} />
                  </div>
                  {a.done && (
                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full">
                      <CheckCircleIcon size={16} className="text-eco-500" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-body font-semibold leading-tight ${a.done ? 'text-eco-700' : 'text-eco-300'}`}>{a.name}</span>
              </div>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
