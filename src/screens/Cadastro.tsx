import { useState } from 'react';
import EcoLogo, { LogoMark } from '../components/EcoLogo';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import { emailError, personNameError, squish } from '../lib/validation';
import PasswordRules, { isPasswordValid, Req } from '../components/PasswordRules';

interface CadastroProps {
  onSubmit: (name: string, email: string, password: string) => Promise<string | null>;
  onBack: () => void;
}

export default function Cadastro({ onSubmit, onBack }: CadastroProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const nameErr = personNameError(name);
    if (nameErr) e.name = nameErr;
    const mailErr = emailError(email);
    if (mailErr) e.email = mailErr;
    if (!password) e.password = 'Senha é obrigatória';
    else if (!isPasswordValid(password)) e.password = 'A senha não atende a todos os requisitos';
    if (!confirm) e.confirm = 'Confirme sua senha';
    else if (password !== confirm) e.confirm = 'As senhas não conferem';
    if (!acceptTerms) e.terms = 'Aceite os termos para continuar';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const err = await onSubmit(squish(name), email.trim().toLowerCase(), password);
    if (err) {
      setLoading(false);
      setErrors(/e-mail/i.test(err) ? { email: err } : { form: err });
    }
  }

  const field = (key: string) =>
    `w-full h-12 px-4 rounded-xl border text-sm font-body outline-none transition-all bg-white ${
      errors[key]
        ? 'border-red-400 ring-2 ring-red-100'
        : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100 hover:border-eco-300'
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
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(10,36,16,0.78) 0%, rgba(29,92,42,0.55) 100%)' }} />

        <div className="relative p-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 inline-block">
            <LogoMark size={48} />
          </div>
        </div>

        <div className="relative mt-auto p-10">
          <p className="text-white/90 text-2xl font-display font-semibold leading-snug mb-6">
            Faça parte da<br />comunidade que<br />cuida do Gama.
          </p>
          <ul className="space-y-3">
            {[
              'Encontre ecolocalizações perto de você',
              'Agende coletas de recicláveis',
              'Ganhe Ecopontos a cada descarte correto',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-white/75 text-sm font-body">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#b07d30' }}>
                  <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                    <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 overflow-y-auto bg-[#f4f8f4]">
      <div className="min-h-full flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-sm lg:max-w-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-eco-600 text-sm font-body mb-6 hover:text-eco-900 transition-colors"
        >
          <ArrowLeftIcon size={16} />
          Voltar ao login
        </button>

        <div className="mb-7">
          <div className="lg:hidden mb-4"><EcoLogo width={130} /></div>
          <h1 className="font-display font-bold text-eco-900 text-xl lg:text-3xl">
            Crie sua conta
          </h1>
          <p className="text-eco-500 text-sm lg:text-base font-body mt-0.5 lg:mt-1">Comece sua jornada sustentável.</p>
        </div>

        <p className="text-[11px] text-eco-500 font-body mb-3"><span className="text-red-500">*</span> Campos obrigatórios</p>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Nome completo<Req /></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Seu nome"
              className={field('name')}
              autoComplete="name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail<Req /></label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              placeholder="seu@email.com"
              className={field('email')}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Senha<Req /></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                placeholder="Crie uma senha segura"
                className={`${field('password')} pr-11`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-400 hover:text-eco-700 transition-colors">
                {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">Confirmar senha<Req /></label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
                placeholder="Repita a senha"
                className={`${field('confirm')} pr-11`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-400 hover:text-eco-700 transition-colors">
                {showConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
          </div>

          </div>

          <PasswordRules password={password} confirm={confirm} />

          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input type="checkbox" checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); setErrors((p) => ({ ...p, terms: '' })); }}
                className="sr-only" />
              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${acceptTerms ? 'bg-eco-800 border-eco-800' : 'border-eco-300 bg-white'}`}>
                {acceptTerms && (
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs font-body text-eco-600 leading-relaxed">
              Li e aceito os{' '}
              <span className="text-eco-800 font-semibold underline decoration-eco-300 cursor-pointer">Termos de Uso</span>
              {' '}e a{' '}
              <span className="text-eco-800 font-semibold underline decoration-eco-300 cursor-pointer">Política de Privacidade</span><Req />
            </span>
          </label>
          {errors.form && <p role="alert" className="text-red-500 text-sm font-body bg-red-50 rounded-xl px-3 py-2">{errors.form}</p>}
          {errors.terms && <p className="text-red-500 text-xs -mt-2 ml-8">{errors.terms}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-display font-semibold text-sm text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                </svg>
                Criando conta...
              </>
            ) : 'Criar minha conta'}
          </button>
        </form>
      </div>
      </div>
      </div>
    </div>
  );
}
