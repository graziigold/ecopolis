import { useState } from 'react';
import { authMessage, supabase } from '../lib/supabase';
import EcoLogo from '../components/EcoLogo';
import {
  ArrowLeftIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/Icons';
import PasswordRules, { isPasswordValid, Req } from '../components/PasswordRules';
import { emailError } from '../lib/validation';

interface RecuperarSenhaProps {
  /** true quando a pessoa voltou pelo link do e-mail */
  recovering: boolean;
  onBack: () => void;
  /** Senha trocada: a pessoa já está conectada e segue para o app. */
  onDone: () => void;
}

type Step = 'email' | 'enviado' | 'senha';

// Atalho para abrir a caixa de entrada nos provedores mais comuns.
const INBOX: [RegExp, string, string][] = [
  [/@(gmail|googlemail)\.com$/, 'https://mail.google.com/mail/u/0/#inbox', 'Gmail'],
  [/@(outlook|hotmail|live|msn)\.[a-z.]+$/, 'https://outlook.live.com/mail/0/inbox', 'Outlook'],
  [/@(yahoo|ymail)\.[a-z.]+$/, 'https://mail.yahoo.com/', 'Yahoo'],
  [/@(icloud|me|mac)\.com$/, 'https://www.icloud.com/mail', 'iCloud'],
];

export default function RecuperarSenha({ recovering, onBack, onDone }: RecuperarSenhaProps) {
  const [step, setStep] = useState<Step>(recovering ? 'senha' : 'email');
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inbox = INBOX.find(([re]) => re.test(email.trim().toLowerCase()));

  async function sendLink() {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    return err ? authMessage(err.message) : null;
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const err0 = emailError(email);
    if (err0) return setError(err0);
    setError('');
    setLoading(true);
    const err = await sendLink();
    setLoading(false);
    if (err) return setError(err);
    setResent(false);
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
    if (!isPasswordValid(password)) return setError('A senha ainda não atende a todos os requisitos.');
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(authMessage(err.message));
    onDone();
  }

  const inputBase =
    'w-full h-12 pl-11 pr-4 rounded-xl border border-eco-200 text-sm font-body bg-white outline-none transition-all focus:border-eco-600 focus:ring-2 focus:ring-eco-100 hover:border-eco-300';

  const primaryBtn =
    'w-full h-12 rounded-xl font-display font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]';
  const primaryStyle = { background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#f4f8f4]">
      <div className="w-full max-w-sm">
        {step !== 'senha' && (
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
                Digite o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.
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
            <div className="mb-6">
              <div className="w-14 h-14 rounded-2xl bg-eco-100 flex items-center justify-center mb-5">
                <MailIcon size={24} className="text-eco-700" />
              </div>
              <h1 className="font-display font-bold text-eco-900 text-2xl">Confira seu e-mail</h1>
              <p className="text-eco-500 text-sm font-body mt-1">
                Enviamos um link para <span className="font-semibold text-eco-800">{email.trim().toLowerCase()}</span>. Toque nele e crie a nova senha. Você entra no app logo em seguida.
              </p>
            </div>
            {inbox && (
              <a href={inbox[1]} target="_blank" rel="noreferrer" className={`${primaryBtn} mb-3`} style={primaryStyle}>
                Abrir o {inbox[2]}
              </a>
            )}
            <p className="text-eco-400 text-xs font-body mb-4">Não chegou em alguns minutos? Veja a pasta de spam.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={resend} disabled={loading || resent}
                className="flex-1 h-11 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50 disabled:opacity-60">
                {resent ? 'Link reenviado' : loading ? 'Enviando...' : 'Reenviar'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }}
                className="flex-1 h-11 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50">
                Corrigir e-mail
              </button>
            </div>
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
              <p className="text-eco-500 text-sm font-body mt-0.5">Depois de salvar, você já entra na sua conta.</p>
            </div>
            <form noValidate onSubmit={submitPassword} className="space-y-4">
              <div>
                <label htmlFor="nova-senha" className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nova senha<Req /></label>
                <div className="relative">
                  <LockIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-eco-400" />
                  <input
                    id="nova-senha"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Crie uma senha segura"
                    className={`${inputBase} pr-11`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-400 hover:text-eco-700 transition-colors">
                    {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
              <PasswordRules password={password} />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" disabled={loading || !isPasswordValid(password)} className={primaryBtn} style={primaryStyle}>
                {loading ? 'Salvando...' : 'Salvar e entrar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
