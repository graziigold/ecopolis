import { useState } from 'react';
import type { Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { PlusIcon, SearchIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import { cnpjError, emailError, phoneError, squish, textError } from '../lib/validation';
import type { Partner, PartnerType, Reward } from '../data/catalog';

interface Props {
  navigate: (s: Screen) => void;
  partners: Partner[];
  rewards: Reward[];
  onChange: (p: Partner[]) => Promise<boolean>;
}

const TYPES: PartnerType[] = ['Empresa', 'Bazar', 'Feira', 'ONG'];
const EMPTY = { name: '', type: 'Empresa' as PartnerType, cnpj: '', contact: '', phone: '', email: '', cep: '', address: '', number: '' };

const maskCnpj = (v: string) =>
  v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
const maskCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

export default function GestaoParceiros({ navigate, partners, rewards, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [filter, setFilter] = useState<'Todos' | PartnerType>('Todos');

  const set = (k: keyof typeof EMPTY, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  async function lookupCep() {
    const d = form.cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) setErrors((e) => ({ ...e, cep: 'CEP não encontrado' }));
      else set('address', [j.logradouro, j.bairro, `${j.localidade}/${j.uf}`].filter(Boolean).join(', '));
    } catch {
      setErrors((e) => ({ ...e, cep: 'Não foi possível consultar o CEP' }));
    } finally {
      setCepLoading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const checks: [string, string | null][] = [
      ['name', textError(form.name, 'o nome', { min: 2, max: 120 })],
      // CNPJ conferido quando é novo ou foi alterado (há parceiros antigos cadastrados sem verificação).
      ['cnpj', editingId !== null && form.cnpj === partners.find((p) => p.id === editingId)?.cnpj ? null : cnpjError(form.cnpj)],
      ['contact', textError(form.contact, 'o responsável', { min: 3, max: 80 })],
      ['phone', phoneError(form.phone, false)],
      ['email', emailError(form.email)],
      ['address', form.address.trim() ? textError(form.address, 'o endereço', { max: 200 }) : 'Busque o CEP ou informe o endereço'],
      ['number', form.number.trim() && !/^(\d{1,6}[A-Za-z]?|S\/?N)$/i.test(form.number.trim()) ? 'Use só números (ou S/N)' : null],
    ];
    for (const [k, msg] of checks) if (msg) er[k] = msg;
    setErrors(er);
    if (Object.keys(er).length) return;
    const { number, ...rest } = form;
    const data = { ...rest, name: squish(rest.name), contact: squish(rest.contact), email: rest.email.trim().toLowerCase(), address: squish(number ? `${form.address}, nº ${number}` : form.address) };
    setSaving(true);
    const ok = await onChange(
      editingId === null
        ? [...partners, { ...data, id: Date.now(), active: true }]
        : partners.map((p) => (p.id === editingId ? { ...p, ...data } : p)),
    );
    setSaving(false);
    if (!ok) return;
    close();
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  }

  function openEdit(p: Partner) {
    setEditingId(p.id);
    setForm({ name: p.name, type: p.type, cnpj: p.cnpj, contact: p.contact, phone: p.phone, email: p.email, cep: p.cep, address: p.address, number: '' });
    setErrors({});
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  const input = (k: string) =>
    `w-full h-11 px-4 rounded-xl border bg-white text-sm font-body outline-none ${errors[k] ? 'border-red-400 ring-2 ring-red-100' : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100'}`;
  const F = ({ k, label, children, opt }: { k: string; label: string; children: React.ReactNode; opt?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">{label}{!opt && <Req />}</label>
      {children}
      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
    </div>
  );

  const list = filter === 'Todos' ? partners : partners.filter((p) => p.type === filter);

  return (
    <AppLayout screen="gestaoParceiros" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 lg:max-w-5xl lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display font-bold text-eco-900 text-2xl">Parceiros</h1>
            <p className="text-eco-500 text-sm font-body mt-0.5">Empresas, bazares, feiras e ONGs que oferecem recompensas.</p>
          </div>
          <button onClick={openNew} className="h-10 px-4 rounded-xl text-white text-sm font-display font-semibold flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
            <PlusIcon size={16} /> Novo parceiro
          </button>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(['Todos', ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium whitespace-nowrap border ${filter === t ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 bg-white text-eco-600 hover:border-eco-300'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {list.map((p) => {
            const count = rewards.filter((r) => r.partnerId === p.id).length;
            return (
              <div key={p.id} className={`bg-white rounded-2xl border border-eco-100 p-4 ${p.active ? '' : 'opacity-55'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-drach-light text-drach text-[10px] font-semibold uppercase tracking-wider mb-1.5">{p.type}</span>
                    <h3 className="font-body font-semibold text-eco-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-eco-500 font-body mt-0.5">CNPJ {p.cnpj}</p>
                  </div>
                  <button role="switch" aria-checked={p.active} aria-label={`Ativar ${p.name}`}
                    onClick={() => onChange(partners.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${p.active ? 'bg-eco-700' : 'bg-eco-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${p.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs font-body">
                  <dt className="text-eco-400">Responsável</dt><dd className="text-eco-700 truncate">{p.contact}</dd>
                  <dt className="text-eco-400">Telefone</dt><dd className="text-eco-700">{p.phone}</dd>
                  <dt className="text-eco-400">Endereço</dt><dd className="text-eco-700 truncate" title={p.address}>{p.address}</dd>
                </dl>
                <div className="mt-3 pt-3 border-t border-eco-50 flex items-center justify-between text-xs font-body">
                  <span className="text-eco-500">{count} recompensa(s) na loja</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(p)} className="font-semibold text-eco-700 hover:text-eco-900">Editar</button>
                    <button onClick={() => navigate('gestaoRecompensas')} className="font-semibold text-eco-700 hover:text-eco-900">Ver recompensas</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-eco-950/40 backdrop-blur-sm">
          <form noValidate onSubmit={save} className="bg-[#f4f8f4] w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-bold text-eco-900 text-xl">{editingId === null ? 'Novo parceiro' : 'Editar parceiro'}</h2>
              <button type="button" onClick={close} className="text-sm text-eco-500 hover:text-eco-800">Cancelar</button>
            </div>
            <p className="text-[11px] text-eco-500 font-body mb-4"><span className="text-red-500">*</span> Campos obrigatórios</p>

            <span className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Tipo<Req /></span>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`h-10 rounded-xl border text-sm font-display font-semibold ${form.type === t ? 'border-eco-800 bg-eco-800 text-white' : 'border-eco-200 bg-white text-eco-600'}`}>{t}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {F({ k: 'name', label: 'Nome / razão social', children: <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input('name')} /> })}
              {F({ k: 'cnpj', label: 'CNPJ', children: <input value={form.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" onChange={(e) => set('cnpj', maskCnpj(e.target.value))} className={input('cnpj')} /> })}
              {F({ k: 'contact', label: 'Responsável', children: <input value={form.contact} onChange={(e) => set('contact', e.target.value)} className={input('contact')} /> })}
              {F({ k: 'phone', label: 'Telefone', children: <input value={form.phone} inputMode="tel" placeholder="(61) 90000-0000" onChange={(e) => set('phone', maskPhone(e.target.value))} className={input('phone')} /> })}
              <div className="lg:col-span-2">
                {F({ k: 'email', label: 'E-mail', children: <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={input('email')} /> })}
              </div>
              {F({ k: 'cep', label: 'CEP', opt: true, children: (
                <div className="flex gap-2">
                  <input value={form.cep} inputMode="numeric" placeholder="72400-000" onChange={(e) => set('cep', maskCep(e.target.value))} onBlur={lookupCep} className={input('cep')} />
                  <button type="button" onClick={lookupCep} disabled={form.cep.replace(/\D/g, '').length !== 8 || cepLoading} aria-label="Buscar CEP"
                    className="h-11 w-11 shrink-0 rounded-xl border border-eco-200 bg-white text-eco-600 flex items-center justify-center disabled:opacity-40">
                    {cepLoading ? '…' : <SearchIcon size={16} />}
                  </button>
                </div>
              ) })}
              {F({ k: 'number', label: 'Número', opt: true, children: <input value={form.number} onChange={(e) => set('number', e.target.value)} className={input('number')} /> })}
              <div className="lg:col-span-2">
                {F({ k: 'address', label: 'Endereço', children: <input value={form.address} onChange={(e) => set('address', e.target.value)} className={input('address')} /> })}
              </div>
            </div>

            <button type="submit" className="mt-6 w-full h-12 rounded-xl text-white text-sm font-display font-semibold"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }} disabled={saving}>{saving ? 'Salvando…' : editingId === null ? 'Cadastrar parceiro' : 'Salvar alterações'}</button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
