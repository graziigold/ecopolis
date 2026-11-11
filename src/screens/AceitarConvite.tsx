import { useEffect, useState } from 'react';
import EcoLogo from '../components/EcoLogo';
import { ArrowLeftIcon } from '../components/Icons';
import PasswordRules, { isPasswordValid, Req } from '../components/PasswordRules';
import { api } from '../lib/supabase';
import { personNameError, squish } from '../lib/validation';

interface Props {
  initialCode?: string;
  onAccept: (code: string, name: string, password: string) => Promise<string | null>;
  onBack: () => void;
}

interface Invite {
  email: string;
  role: 'gestor' | 'operador';
}

export default function AceitarConvite({ initialCode = '', onAccept, onBack }: Props) {
  const [code, setCode] = useState(initialCode);
  const [member, setMember] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const field = 'w-full h-12 px-4 rounded-xl border border-eco-200 bg-white text-sm font-body outline-none focus:border-eco-600 focus:ring-2 focus:ring-eco-100';

  async function validate(value: string) {
    setBusy(true);
    setError('');
    try {
      setMember(await api<Invite>('/invite/check', { body: { code: value.trim().toUpperCase() } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível validar o código.');
    } finally {
      setBusy(false);
    }
  }

  // Link de convite já traz o código.
  useEffect(() => {
    if (initialCode) validate(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setError('Digite o código do convite');
    validate(code);
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    const nameErr = personNameError(name);
    if (nameErr) return setError(nameErr);
    if (!isPasswordValid(pw)) return setError('A senha não atende a todos os requisitos');
    if (pw !== confirm) return setError('As senhas não conferem');
    setBusy(true);
    const err = await onAccept(code.trim().toUpperCase(), squish(name), pw);
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
        <h1 className="font-display font-bold text-eco-900 text-xl mt-4">Aceitar convite da equipe</h1>

        {!member ? (
          <form noValidate onSubmit={check} className="mt-6">
            <p className="text-eco-500 text-sm font-body mb-4">Digite o código que o gestor enviou para você.</p>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Código do convite<Req /></label>
            <input value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} placeholder="ECO-XXXX" required aria-required="true"
              className={`${field} uppercase tracking-widest font-display font-semibold`} />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <button type="submit" className="mt-5 w-full h-12 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }} disabled={busy}>{busy ? 'Validando…' : 'Validar código'}</button>
          </form>
        ) : (
          <form noValidate onSubmit={finish} className="mt-6 space-y-4">
            <div className="rounded-xl bg-drach-light px-4 py-3 text-sm font-body text-eco-700">
              Convite para <strong>{member.email}</strong> como <strong>{member.role === 'gestor' ? 'Gestor' : 'Operador de ecolocalização'}</strong>.
            </div>
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome completo<Req /></label>
              <input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={field} autoComplete="name" required aria-required="true" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Senha<Req /></label>
              <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} className={field} autoComplete="new-password" required aria-required="true" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Confirmar senha<Req /></label>
              <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} className={field} autoComplete="new-password" required aria-required="true" />
            </div>
            <PasswordRules password={pw} confirm={confirm} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full h-12 rounded-xl text-white text-sm font-display font-semibold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }} disabled={busy}>{busy ? 'Ativando…' : 'Ativar acesso'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
