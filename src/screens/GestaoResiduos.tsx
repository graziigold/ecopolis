import { useState } from 'react';
import type { Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { CheckCircleIcon, PlusIcon, RecycleIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import type { Material } from '../data/catalog';

interface Props {
  navigate: (s: Screen) => void;
  materials: Material[];
  onSave: (m: Material[]) => Promise<boolean>;
}

export default function GestaoResiduos({ navigate, materials, onSave }: Props) {
  const [draft, setDraft] = useState<Material[]>(materials);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [addError, setAddError] = useState('');

  const dirty = JSON.stringify(draft.map(({ icon, ...r }) => r)) !== JSON.stringify(materials.map(({ icon, ...r }) => r));
  const invalid = draft.some((m) => !Number.isFinite(m.rate) || m.rate <= 0);

  function update(key: string, patch: Partial<Material>) {
    setSaved(false);
    setDraft((d) => d.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function add() {
    const rate = Number(newRate);
    if (!newName.trim()) return setAddError('Informe o nome do resíduo');
    if (!rate || rate <= 0) return setAddError('Informe um valor maior que zero');
    if (draft.some((m) => m.label.toLowerCase() === newName.trim().toLowerCase())) return setAddError('Esse resíduo já existe');
    setDraft((d) => [
      ...d,
      { key: `${newName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, label: newName.trim(), rate, active: true, icon: RecycleIcon, color: '#2d7a3a', bg: '#e8f5e9' },
    ]);
    setNewName(''); setNewRate(''); setAddError(''); setSaved(false);
  }

  return (
    <AppLayout screen="gestaoResiduos" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 lg:max-w-4xl lg:px-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Resíduos e valores</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">
            Defina quantos Ecopontos o cidadão recebe por quilo de cada material.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden mb-6">
          <div className="hidden lg:grid grid-cols-[1fr_200px_120px_100px] gap-4 px-5 py-3 border-b border-eco-100 text-[11px] font-semibold uppercase tracking-wider text-eco-400">
            <span>Material</span><span>Ecopontos por kg</span><span>Exemplo (5 kg)</span><span className="text-right">Ativo</span>
          </div>
          {draft.map((m) => {
            const Icon = m.icon;
            const bad = !m.rate || m.rate <= 0;
            return (
              <div key={m.key} className={`grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_200px_120px_100px] gap-x-4 gap-y-3 items-center px-4 lg:px-5 py-4 border-b border-eco-50 last:border-0 ${m.active ? '' : 'opacity-55'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                    <Icon size={19} style={{ color: m.color }} />
                  </div>
                  <span className="font-body font-semibold text-eco-800 text-sm truncate">{m.label}</span>
                </div>

                <div className="col-span-2 lg:col-span-1 row-start-2 lg:row-start-auto flex items-center gap-2">
                  <button type="button" aria-label={`Diminuir ${m.label}`} onClick={() => update(m.key, { rate: Math.max(1, m.rate - 5) })}
                    className="w-9 h-10 rounded-lg border border-eco-200 text-eco-600 hover:bg-eco-50 font-display font-semibold">−</button>
                  <div className="relative flex-1">
                    <input type="number" min={1} inputMode="numeric" value={Number.isNaN(m.rate) ? '' : m.rate}
                      aria-label={`Ecopontos por kg de ${m.label}`}
                      onChange={(e) => update(m.key, { rate: e.target.value === '' ? NaN : Number(e.target.value) })}
                      className={`w-full h-10 pl-3 pr-14 rounded-lg border text-sm font-display font-semibold text-drach outline-none ${bad ? 'border-red-400 ring-2 ring-red-100' : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100'}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-eco-400 font-body">EP/kg</span>
                  </div>
                  <button type="button" aria-label={`Aumentar ${m.label}`} onClick={() => update(m.key, { rate: (m.rate || 0) + 5 })}
                    className="w-9 h-10 rounded-lg border border-eco-200 text-eco-600 hover:bg-eco-50 font-display font-semibold">+</button>
                </div>

                <span className="hidden lg:block text-sm font-body text-eco-500">
                  {bad ? '-' : `${(m.rate * 5).toLocaleString('pt-BR')} Ecopontos`}
                </span>

                <div className="flex justify-end row-start-1 col-start-2 lg:row-start-auto lg:col-start-auto">
                  <button type="button" role="switch" aria-checked={m.active} aria-label={`Ativar ${m.label}`}
                    onClick={() => update(m.key, { active: !m.active })}
                    className={`w-11 h-6 rounded-full relative transition-colors ${m.active ? 'bg-eco-700' : 'bg-eco-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${m.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="font-display font-semibold text-eco-800 text-xs mb-3 uppercase tracking-wider">Adicionar resíduo</h2>
        <div className="bg-white rounded-2xl border border-eco-100 p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome<Req /></label>
              <input value={newName} onChange={(e) => { setNewName(e.target.value); setAddError(''); }} placeholder="Ex.: Óleo de cozinha"
                className="w-full h-11 px-4 rounded-xl border border-eco-200 text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Ecopontos por kg<Req /></label>
              <input type="number" min={1} value={newRate} onChange={(e) => { setNewRate(e.target.value); setAddError(''); }} placeholder="0"
                className="w-full h-11 px-4 rounded-xl border border-eco-200 text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100" />
            </div>
            <button type="button" onClick={add}
              className="h-11 px-5 rounded-xl border-2 border-eco-700 text-eco-800 font-display font-semibold text-sm flex items-center justify-center gap-2 hover:bg-eco-50">
              <PlusIcon size={16} /> Adicionar
            </button>
          </div>
          {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 bg-white/95 backdrop-blur border-t border-eco-100 px-4 py-3 z-40">
        <div className="max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-3 lg:px-4">
          <span className="text-xs font-body text-eco-500 flex items-center gap-1.5">
            {saved ? (<><CheckCircleIcon size={14} className="text-eco-600" /> Valores publicados para os cidadãos</>)
              : invalid ? <span className="text-red-500">Corrija os valores inválidos</span>
              : dirty ? 'Alterações não salvas' : 'Nenhuma alteração'}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!dirty} onClick={() => { setDraft(materials); setSaved(false); }}
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
