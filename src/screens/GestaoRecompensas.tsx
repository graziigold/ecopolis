import { useState } from 'react';
import type { Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { CheckCircleIcon, GiftIcon, PlusIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import type { Partner, Reward } from '../data/catalog';

interface Props {
  navigate: (s: Screen) => void;
  rewards: Reward[];
  partners: Partner[];
  onSave: (r: Reward[]) => Promise<boolean>;
}

const strip = (l: Reward[]) => JSON.stringify(l.map(({ icon, ...r }) => r));

export default function GestaoRecompensas({ navigate, rewards, partners, onSave }: Props) {
  const [nr, setNr] = useState({ name: '', partnerId: '', cat: 'Cupons', cost: '', stock: '' });
  const [nrError, setNrError] = useState('');
  const activePartners = partners.filter((p) => p.active);

  function addReward() {
    if (!nr.name.trim() || !nr.partnerId || !(Number(nr.cost) > 0) || !(Number(nr.stock) >= 0) || nr.stock === '')
      return setNrError('Preencha nome, parceiro, custo e estoque');
    setDraft((d) => [...d, { id: Date.now(), name: nr.name.trim(), partnerId: Number(nr.partnerId), cat: nr.cat, cost: Number(nr.cost), stock: Number(nr.stock), active: true, icon: GiftIcon, tint: '#fdf6eb', color: '#b07d30' }]);
    setNr({ name: '', partnerId: '', cat: 'Cupons', cost: '', stock: '' });
    setNrError('');
    setSaved(false);
  }
  const nrInput = 'w-full h-11 px-3 rounded-xl border border-eco-200 bg-white text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100';
  const [draft, setDraft] = useState<Reward[]>(rewards);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = strip(draft) !== strip(rewards);
  const invalid = draft.some((r) => !(r.cost > 0) || !(r.stock >= 0));

  function update(id: number, patch: Partial<Reward>) {
    setSaved(false);
    setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const num = (v: string) => (v === '' ? NaN : Number(v));
  const input = (bad: boolean) =>
    `w-full h-10 px-3 rounded-lg border text-sm font-display font-semibold outline-none ${bad ? 'border-red-400 ring-2 ring-red-100' : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100'}`;

  return (
    <AppLayout screen="gestaoRecompensas" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 lg:max-w-4xl lg:px-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Recompensas</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">Defina o custo em Ecopontos, o estoque e o que aparece na loja.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {draft.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className={`bg-white rounded-2xl border border-eco-100 p-4 ${r.active ? '' : 'opacity-55'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: r.tint }}>
                    <Icon size={20} style={{ color: r.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-body font-semibold text-eco-400 uppercase tracking-wider">{r.cat}</span>
                    <h3 className="font-body font-semibold text-eco-800 text-sm leading-snug">{r.name}</h3>
                    <p className="text-xs text-eco-500 font-body mt-0.5">{partners.find((p) => p.id === r.partnerId)?.name ?? 'Sem parceiro'}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={r.active} aria-label={`Exibir ${r.name} na loja`}
                    onClick={() => update(r.id, { active: !r.active })}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${r.active ? 'bg-eco-700' : 'bg-eco-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${r.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[11px] font-semibold text-eco-600 mb-1 font-body">Custo (Ecopontos)</span>
                    <input type="number" min={1} value={Number.isNaN(r.cost) ? '' : r.cost}
                      onChange={(e) => update(r.id, { cost: num(e.target.value) })} className={`${input(!(r.cost > 0))} text-drach`} />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-semibold text-eco-600 mb-1 font-body">Estoque</span>
                    <input type="number" min={0} value={Number.isNaN(r.stock) ? '' : r.stock}
                      onChange={(e) => update(r.id, { stock: num(e.target.value) })} className={`${input(!(r.stock >= 0))} text-eco-800`} />
                  </label>
                </div>
                {r.stock === 0 && <p className="text-[11px] text-drach mt-2 font-body">Sem estoque: não aparece na loja.</p>}
              </div>
            );
          })}
        </div>

        <h2 className="font-display font-semibold text-eco-800 text-xs mt-7 mb-3 uppercase tracking-wider">Nova recompensa</h2>
        <div className="bg-white rounded-2xl border border-eco-100 p-4 lg:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <label className="col-span-2">
              <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome<Req /></span>
              <input value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} placeholder="Ex.: Peça de roupa no bazar" className={nrInput} />
            </label>
            <label className="col-span-2">
              <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Parceiro<Req /></span>
              <select value={nr.partnerId} onChange={(e) => setNr({ ...nr, partnerId: e.target.value })} className={nrInput}>
                <option value="">Selecione…</option>
                {activePartners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
              </select>
            </label>
            <label>
              <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Custo<Req /></span>
              <input type="number" min={1} value={nr.cost} onChange={(e) => setNr({ ...nr, cost: e.target.value })} placeholder="Ecopontos" className={nrInput} />
            </label>
            <label>
              <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Estoque<Req /></span>
              <input type="number" min={0} value={nr.stock} onChange={(e) => setNr({ ...nr, stock: e.target.value })} className={nrInput} />
            </label>
            <label className="col-span-2 lg:col-span-2">
              <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Categoria<Req /></span>
              <select value={nr.cat} onChange={(e) => setNr({ ...nr, cat: e.target.value })} className={nrInput}>
                {['Cupons', 'Serviços', 'Doações'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="col-span-2 lg:col-span-4 flex items-end justify-between gap-3">
              <span className="text-xs font-body text-eco-400">
                {activePartners.length === 0 ? 'Cadastre um parceiro antes.' : nrError ? <span className="text-red-500">{nrError}</span> : 'Entra na loja ao salvar.'}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigate('gestaoParceiros')} className="h-11 px-4 rounded-xl text-sm font-display font-semibold text-eco-600 hover:bg-eco-50">Parceiros</button>
                <button type="button" onClick={addReward}
                  className="h-11 px-5 rounded-xl border-2 border-eco-700 text-eco-800 font-display font-semibold text-sm flex items-center gap-2 hover:bg-eco-50">
                  <PlusIcon size={16} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 bg-white/95 backdrop-blur border-t border-eco-100 px-4 py-3 z-40">
        <div className="max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-3 lg:px-4">
          <span className="text-xs font-body text-eco-500 flex items-center gap-1.5">
            {saved ? (<><CheckCircleIcon size={14} className="text-eco-600" /> Loja atualizada</>)
              : invalid ? <span className="text-red-500">Corrija os valores inválidos</span>
              : dirty ? 'Alterações não salvas' : 'Nenhuma alteração'}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!dirty} onClick={() => { setDraft(rewards); setSaved(false); }}
              className="h-10 px-4 rounded-xl text-sm font-display font-semibold text-eco-600 hover:bg-eco-50 disabled:opacity-40">Descartar</button>
            <button type="button" disabled={!dirty || invalid || saving} onClick={async () => { setSaving(true); const ok = await onSave(draft); setSaving(false); setSaved(ok); }}
              className="h-10 px-5 rounded-xl text-sm font-display font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>Salvar alterações</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
