import { useState } from 'react';
import { authMessage, supabase } from '../lib/supabase';
import EcoLogo from '../components/EcoLogo';
import {
  ArrowLeftIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
} from '../components/Icons';
import PasswordRules, { isPasswordValid, Req } from '../components/PasswordRules';

interface RecuperarSenhaProps {
  /** true quando a pessoa voltou pelo link do e-mail */
  recovering: boolean;
  onBack: () => void;
  onDone: () => void;
}

type Step = 'email' | 'enviado' | 'senha' | 'sucesso';

export default function RecuperarSenha({ recovering, onBack, onDone }: RecuperarSenhaProps) {
  const [step, setStep] = useState<Step>(recovering ? 'senha' : 'email');
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendLink() {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    return err ? authMessage(err.message) : null;
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido');
      return;
    }
    setError('');
    setLoading(true);
    const err = await sendLink();
    setLoading(false);
    if (err) return setError(err);
    setStep('enviado');
  }

  async function resend() {
    setLoading(true);
    const err = await sendLink();
    setLoading(false);
    if (err) return setError(err);
    setResent(true);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError('A senha não atende a todos os requisitos');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(authMessage(err.message));
    setStep('sucesso');
  }

  const inputBase =
    'w-full h-12 pl-11 pr-4 rounded-xl border border-eco-200 text-sm font-body bg-white outline-none transition-all focus:border-eco-600 focus:ring-2 focus:ring-eco-100 hover:border-eco-300';

  const primaryBtn =
    'w-full h-12 rounded-xl font-display font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]';
  const primaryStyle = { background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#f4f8f4]">
      <div className="w-full max-w-sm">
        {step !== 'sucesso' && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-eco-600 text-sm font-body mb-6 hover:text-eco-900 transition-colors"
          >
            <ArrowLeftIcon size={16} />
            Voltar ao login
          </button>
        )}

        {/* EMAIL */}
        {step === 'email' && (
          <>
            <div className="mb-7">
              <EcoLogo width={130} />
              <h1 className="font-display font-bold text-eco-900 text-xl mt-4">Recuperar senha</h1>
              <p className="text-eco-500 text-sm font-body mt-0.5">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>
            </div>
            <form noValidate onSubmit={submitEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail<Req /></label>
                <div className="relative">
                  <MailIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-eco-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="seu@email.com"
                    className={inputBase}
                    autoComplete="email"
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className={primaryBtn} style={primaryStyle}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        )}

        {/* LINK ENVIADO */}
        {step === 'enviado' && (
          <>
            <div className="mb-7">
              <div className="w-14 h-14 rounded-2xl bg-eco-100 flex items-center justify-center mb-5">
                <MailIcon size={24} className="text-eco-700" />
              </div>
              <h1 className="font-display font-bold text-eco-900 text-2xl">Verifique seu e-mail</h1>
              <p className="text-eco-500 text-sm font-body mt-1">
                Se existir uma conta com <span className="font-semibold text-eco-800">{email}</span>, enviamos um link para criar uma nova senha. Abra o link neste aparelho.
              </p>
            </div>
            <p className="text-eco-400 text-xs font-body mb-5">Não chegou? Confira a caixa de spam ou aguarde alguns minutos.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <button type="button" onClick={resend} disabled={loading || resent} className={`${primaryBtn} !bg-none border-2 border-eco-700 text-eco-800`} style={{ background: 'transparent' }}>
              {resent ? 'Link reenviado' : loading ? 'Enviando...' : 'Reenviar link'}
            </button>
          </>
        )}

        {/* NOVA SENHA */}
        {step === 'senha' && (
          <>
            <div className="mb-7">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#e8f5e9' }}>
                <LockIcon size={24} className="text-eco-700" />
              </div>
              <h1 className="font-display font-bold text-eco-900 text-xl">Crie uma nova senha</h1>
              <p className="text-eco-500 text-sm font-body mt-0.5">Escolha uma senha forte para sua conta.</p>
            </div>
            <form noValidate onSubmit={submitPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nova senha<Req /></label>
                <div className="relative">
                  <LockIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-eco-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Crie uma senha segura"
                    className={`${inputBase} pr-11`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-400 hover:text-eco-700 transition-colors">
                    {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Confirmar senha<Req /></label>
                <div className="relative">
                  <LockIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-eco-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                    placeholder="Repita a senha"
                    className={`${inputBase} pr-11`}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <PasswordRules password={password} confirm={confirm} />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" disabled={loading} className={primaryBtn} style={primaryStyle}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}

        {/* SUCESSO */}
        {step === 'sucesso' && (
          <div className="flex flex-col items-center text-center">
            <div className="animate-splash-in">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #3a9448, #1d5c2a)' }}
              >
                <CheckCircleIcon size={48} className="text-white" />
              </div>
            </div>
            <h1 className="font-display font-bold text-eco-900 text-2xl mb-2">Senha redefinida!</h1>
            <p className="text-eco-500 font-body text-sm max-w-xs leading-relaxed mb-8">
              Sua senha foi atualizada com sucesso. Já pode acessar sua conta no Ecópolis.
            </p>
            <button onClick={onDone} className={primaryBtn} style={primaryStyle}>
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
