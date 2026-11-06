import { useEffect, useState } from 'react';
import EcoLogo, { LogoMark } from '../components/EcoLogo';
import { EyeIcon, EyeOffIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import type { Role } from '../types';
import { api } from '../lib/supabase';

interface LoginProps {
  onLogin: (email: string, password: string, role: Role) => Promise<string | null>;
  onSetup: () => void;
  onCadastro: () => void;
  onRecuperar: () => void;
  onConvite: () => void;
}

type FieldState = 'idle' | 'focused' | 'error';

export default function Login({ onLogin, onCadastro, onRecuperar, onConvite, onSetup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailState, setEmailState] = useState<FieldState>('idle');
  const [passwordState, setPasswordState] = useState<FieldState>('idle');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('Campo obrigatório');
  const [role, setRole] = useState<Role>('cidadao');
  const [needsSetup, setNeedsSetup] = useState(false);

  // Enquanto não existir gestor, oferece a configuração do primeiro acesso.
  useEffect(() => {
    if (role !== 'gestor') return;
    api<{ needsSetup: boolean }>('/setup/status').then((r) => setNeedsSetup(r.needsSetup)).catch(() => {});
  }, [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailMsg('Campo obrigatório'); setEmailState('error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailMsg('E-mail inválido'); setEmailState('error'); return; }
    if (!password) { setPasswordState('error'); return; }
    setLoading(true);
    setErrorMsg('');
    const err = await onLogin(email, password, role);
    if (err) {
      setLoading(false);
      setPasswordState('error');
      setErrorMsg(err);
    }
  }

  const inputClass = (state: FieldState) =>
    `w-full h-12 px-4 rounded-xl border text-sm font-body outline-none transition-all bg-white ${
      state === 'error'
        ? 'border-red-400 ring-2 ring-red-100'
        : state === 'focused'
        ? 'border-eco-600 ring-2 ring-eco-100'
        : 'border-eco-200 hover:border-eco-300'
    }`;

  return (
    <div className="h-full flex">
      {/* Painel visual (só no desktop) */}
      <div className="hidden lg:flex flex-col w-5/12 xl:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1759850344200-e4b29ddcc974?w=900&h=1200&fit=crop&auto=format"
          alt="Edifício com jardins verticais"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(10,36,16,0.72) 0%, rgba(29,92,42,0.55) 100%)' }} />

        <div className="relative p-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 inline-block">
            <LogoMark size={48} />
          </div>
        </div>

        <div className="relative mt-auto p-10">
          <p className="text-white/90 text-2xl font-display font-semibold leading-snug mb-3">
            Cada descarte<br />correto transforma<br />o Gama.
          </p>
          <p className="text-white/50 text-sm font-body">
            Registre suas ações e acumule Ecopontos.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f4f8f4] overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <EcoLogo width={160} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="font-display font-bold text-eco-900 text-2xl">Bem-vindo ao Ecópolis</h2>
            <p className="text-eco-500 text-sm font-body mt-1">
              Acompanhe suas ações sustentáveis.
            </p>
          </div>

          <div role="radiogroup" aria-label="Tipo de acesso" className="grid grid-cols-3 p-1 rounded-xl bg-eco-100/70 mb-5">
            {([
              { v: 'cidadao', l: 'Cidadão' },
              { v: 'operador', l: 'Ecolocalização' },
              { v: 'gestor', l: 'Gestor' },
            ] as { v: Role; l: string }[]).map((o) => (
              <button key={o.v} type="button" role="radio" aria-checked={role === o.v} onClick={() => setRole(o.v)}
                className={`h-9 px-1 rounded-lg text-xs sm:text-sm font-display truncate font-semibold transition-all ${role === o.v ? 'bg-white text-eco-900 shadow-sm' : 'text-eco-500 hover:text-eco-800'}`}>
                {o.l}
              </button>
            ))}
          </div>
          {role !== 'cidadao' && (
            <p className="text-xs font-body text-drach bg-drach-light rounded-xl px-3 py-2 -mt-2 mb-5">
              Acesso restrito à equipe, liberado por convite.{' '}
              <button type="button" onClick={onConvite} className="font-semibold underline">Recebi um convite</button>
            </p>
          )}
          {role === 'gestor' && needsSetup && (
            <p className="text-xs font-body text-eco-700 bg-eco-50 border border-eco-100 rounded-xl px-3 py-2 -mt-3 mb-5">
              Nenhum gestor configurado ainda.{' '}
              <button type="button" onClick={onSetup} className="font-semibold underline">Configurar primeiro acesso</button>
            </p>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail<Req /></label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailState('idle'); }}
                onFocus={() => setEmailState('focused')}
                onBlur={() => emailState !== 'error' && setEmailState('idle')}
                placeholder="seu@email.com"
                className={inputClass(emailState)}
                autoComplete="email"
              />
              {emailState === 'error' && <p className="text-red-500 text-xs mt-1">{emailMsg}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-eco-700 font-body">Senha<Req /></label>
                <button type="button" onClick={onRecuperar} className="text-eco-500 text-xs font-body hover:text-eco-800 transition-colors">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordState('idle'); setErrorMsg(''); }}
                  onFocus={() => passwordState !== 'error' && setPasswordState('focused')}
                  onBlur={() => passwordState !== 'error' && setPasswordState('idle')}
                  placeholder="••••••••"
                  className={`${inputClass(passwordState)} pr-11`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-400 hover:text-eco-700 transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {(passwordState === 'error' || errorMsg) && (
                <p className="text-red-500 text-xs mt-1">{errorMsg || 'Campo obrigatório'}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-display font-semibold text-sm text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
              style={{ background: loading ? '#3a9448' : 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                  Entrando...
                </>
              ) : role === 'gestor' ? 'Entrar como gestor' : role === 'operador' ? 'Entrar na ecolocalização' : 'Entrar'}
            </button>
          </form>

          {role === 'cidadao' && (<>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-eco-200" />
            <span className="text-eco-400 text-xs font-body">ou</span>
            <div className="flex-1 h-px bg-eco-200" />
          </div>

          <div className="text-center">
            <p className="text-eco-500 text-sm font-body mb-3">Ainda não tenho uma conta</p>
            <button
              onClick={onCadastro}
              className="w-full h-12 rounded-xl border-2 border-eco-700 text-eco-800 font-display font-semibold text-sm transition-all hover:bg-eco-50 active:scale-[0.98]"
            >
              Criar conta
            </button>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
