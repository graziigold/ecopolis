import { useState } from 'react';
import EcoLogo from '../components/EcoLogo';
import { ArrowLeftIcon } from '../components/Icons';
import PasswordRules, { isPasswordValid, Req } from '../components/PasswordRules';

interface Props {
  onSubmit: (name: string, email: string, password: string) => Promise<string | null>;
  onBack: () => void;
}

/** Cria a conta do primeiro gestor. Depois disso, novos gestores só entram por convite. */
export default function PrimeiroGestor({ onSubmit, onBack }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = 'w-full h-12 px-4 rounded-xl border border-eco-200 bg-white text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().split(/\s+/).length < 2) return setError('Informe nome e sobrenome');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Informe um e-mail válido');
    if (!isPasswordValid(pw)) return setError('A senha não atende a todos os requisitos');
    if (pw !== confirm) return setError('As senhas não conferem');
    setBusy(true);
    const err = await onSubmit(name.trim(), email.trim().toLowerCase(), pw);
    if (err) {
      setBusy(false);
      setError(err);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-[#f4f8f4]">
      <div className="w-full max-w-sm lg:max-w-md lg:bg-white lg:rounded-3xl lg:border lg:border-eco-100 lg:p-10">
        <button onClick={onBack} className="flex items-center gap-2 text-eco-600 text-sm font-body mb-6 hover:text-eco-900">
          <ArrowLeftIcon size={16} /> Voltar ao login
        </button>
        <EcoLogo width={130} />
        <h1 className="font-display font-bold text-eco-900 text-xl mt-4">Configurar primeiro gestor</h1>
        <p className="text-eco-500 text-sm font-body mt-1 mb-6">
          Crie a conta de quem vai administrar o Ecópolis. Esta opção some assim que o primeiro gestor existir. Os próximos entram por convite.
        </p>
        <form noValidate onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="pg-name" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome completo<Req /></label>
            <input id="pg-name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={field} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="pg-email" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail institucional<Req /></label>
            <input id="pg-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} className={field} autoComplete="email" placeholder="nome@ecopolis.df.gov.br" />
          </div>
          <div>
            <label htmlFor="pg-pw" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Senha<Req /></label>
            <input id="pg-pw" type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} className={field} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="pg-confirm" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Confirmar senha<Req /></label>
            <input id="pg-confirm" type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} className={field} autoComplete="new-password" />
          </div>
          <PasswordRules password={pw} confirm={confirm} />
          {error && <p role="alert" className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={busy} className="w-full h-12 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
            {busy ? 'Criando…' : 'Criar conta de gestor'}
          </button>
        </form>
      </div>
    </div>
  );
}
