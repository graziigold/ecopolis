import { useState } from 'react';
import type { UserData, Screen } from '../types';
import { AppLayout } from '../components/Nav';
import {
  LeafIcon,
  GiftIcon,
  ShoppingBagIcon,
  StarIcon,
  CheckCircleIcon,
  PackageIcon,
} from '../components/Icons';
import type { Partner, Reward } from '../data/catalog';

interface LojaProps {
  user: UserData;
  navigate: (s: Screen) => void;
  onRedeem: (r: Reward) => Promise<boolean>;
  rewards: Reward[];
  partners: Partner[];
}

const CATEGORIES = ['Todos', 'Cupons', 'Serviços', 'Doações'];

export default function Loja({ user, navigate, onRedeem, rewards, partners }: LojaProps) {
  const partnerOf = (r: Reward) => partners.find((p) => p.id === r.partnerId);
  const REWARDS = rewards.filter((r) => r.active && r.stock > 0 && (!r.partnerId || partnerOf(r)?.active));
  const [cat, setCat] = useState('Todos');
  const [redeemed, setRedeemed] = useState<Reward | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const list = cat === 'Todos' ? REWARDS : REWARDS.filter((r) => r.cat === cat);

  return (
    <AppLayout screen="loja" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-3xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Loja de recompensas</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">Troque seus Ecopontos por benefícios reais</p>
        </div>

        {/* Balance */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #b07d30, #8a6120)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <StarIcon size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-body font-medium uppercase tracking-wider">Saldo disponível</div>
              <div className="font-display font-bold text-white text-2xl leading-tight">
                {user.drachs.toLocaleString('pt-BR')} <span className="text-sm font-semibold">Ecopontos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium whitespace-nowrap border transition-all ${
                cat === c
                  ? 'border-eco-800 bg-eco-800 text-white'
                  : 'border-eco-200 bg-white text-eco-600 hover:border-eco-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {list.map((r) => {
            const Icon = r.icon;
            const affordable = user.drachs >= r.cost;
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-eco-100 p-4 flex flex-col"
              >
                <div
                  className="w-full aspect-square rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: r.tint }}
                >
                  <Icon size={38} style={{ color: r.color }} />
                </div>
                <span className="text-[10px] font-body font-semibold text-eco-400 uppercase tracking-wider mb-1">
                  {r.cat}
                </span>
                <h3 className="font-body font-semibold text-eco-800 text-sm leading-snug">{r.name}</h3>
                <p className="text-[11px] text-eco-400 font-body mt-0.5 flex-1">{partnerOf(r)?.name}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-bold text-drach text-sm">{r.cost} Ecopontos</span>
                  {r.stock <= 5 && <span className="text-[10px] text-drach font-body font-semibold">Últimas {r.stock}</span>}
                </div>
                <button
                  disabled={!affordable || busyId !== null}
                  onClick={async () => {
                    setBusyId(r.id);
                    const ok = await onRedeem(r);
                    setBusyId(null);
                    if (ok) setRedeemed(r);
                  }}
                  className={`mt-2 w-full py-2 rounded-xl text-xs font-display font-semibold transition-colors ${
                    affordable
                      ? 'bg-eco-800 text-white hover:bg-eco-900'
                      : 'bg-eco-50 text-eco-300 cursor-not-allowed'
                  }`}
                >
                  {busyId === r.id ? 'Resgatando…' : affordable ? 'Resgatar' : 'Saldo insuficiente'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="h-4" />
      </div>

      {/* Redeem confirmation */}
      {redeemed !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-xs w-full text-center animate-splash-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto"
              style={{ background: 'linear-gradient(135deg, #3a9448, #1d5c2a)' }}
            >
              <CheckCircleIcon size={40} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-eco-900 text-xl mb-2">Recompensa resgatada!</h2>
            <p className="text-eco-500 font-body text-sm leading-relaxed mb-6">
              {redeemed.name}. Confira os detalhes no seu histórico.
            </p>
            <button
              onClick={() => setRedeemed(null)}
              className="w-full py-3 rounded-xl text-white text-sm font-display font-semibold"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}
            >
              Ótimo!
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
