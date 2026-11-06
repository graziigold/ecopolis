import { useState } from 'react';
import type { Screen } from '../types';
import { AppLayout } from '../components/Nav';
import { CheckCircleIcon, MailIcon } from '../components/Icons';
import { Req } from '../components/PasswordRules';
import type { StaffMember, StaffRole } from '../data/catalog';

interface Props {
  navigate: (s: Screen) => void;
  staff: StaffMember[];
  onInvite: (email: string, role: StaffRole) => Promise<StaffMember | string>;
  onResend: (id: number) => Promise<StaffMember | null>;
  onRevoke: (id: number) => Promise<boolean>;
}

const ROLE_INFO: Record<StaffRole, { label: string; desc: string }> = {
  gestor: { label: 'Gestor', desc: 'Valores, recompensas, parceiros, equipe e relatórios.' },
  operador: { label: 'Operador de ecolocalização', desc: 'Valida descartes e coletas. Não altera valores.' },
};

const inviteLink = (code?: string) => `${window.location.origin}${window.location.pathname}?convite=${code ?? ''}`;
const fmtInvited = (at?: number) => (at ? new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '');

export default function GestaoEquipe({ navigate, staff, onInvite, onResend, onRevoke }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('operador');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<StaffMember | null>(null);
  const [copied, setCopied] = useState<number | string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError('Informe um e-mail válido');
    setBusy(true);
    const r = await onInvite(v, role);
    setBusy(false);
    if (typeof r === 'string') return setError(r);
    setSent(r);
    setEmail('');
    setError('');
  }

  function copy(m: StaffMember, key: number | string = m.id) {
    navigator.clipboard?.writeText(inviteLink(m.code)).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

  const resend = async (m: StaffMember) => {
    const updated = await onResend(m.id);
    if (updated) setSent(updated);
  };

  return (
    <AppLayout screen="gestaoEquipe" navigate={navigate}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-6 lg:max-w-5xl lg:px-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-eco-900 text-2xl">Equipe</h1>
          <p className="text-eco-500 text-sm font-body mt-0.5">
            Acesso de gestão é só por convite. Ninguém vira gestor pelo cadastro público.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-start">
          <form noValidate onSubmit={invite} className="bg-white rounded-2xl border border-eco-100 p-5">
            <h2 className="font-display font-semibold text-eco-900 mb-4">Convidar membro</h2>
            <label className="block text-xs font-semibold text-eco-700 mb-1.5 font-body">E-mail institucional<Req /></label>
            <input type="email" value={email} required aria-required="true"
              onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="nome@ecopolis.df.gov.br"
              className={`w-full h-11 px-4 rounded-xl border text-sm font-body outline-none ${error ? 'border-red-400 ring-2 ring-red-100' : 'border-eco-200 focus:border-eco-600 focus:ring-2 focus:ring-eco-100'}`} />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <span className="block text-xs font-semibold text-eco-700 mt-4 mb-1.5 font-body">Perfil<Req /></span>
            <div className="space-y-2" role="radiogroup">
              {(Object.keys(ROLE_INFO) as StaffRole[]).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${role === r ? 'border-eco-500 bg-eco-50 ring-1 ring-eco-300' : 'border-eco-100 hover:border-eco-200'}`}>
                  <div className="text-sm font-semibold text-eco-800 font-body">{ROLE_INFO[r].label}</div>
                  <div className="text-xs text-eco-500 font-body">{ROLE_INFO[r].desc}</div>
                </button>
              ))}
            </div>

            <button type="submit" disabled={busy} className="mt-5 w-full h-11 rounded-xl text-white text-sm font-display font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>
              <MailIcon size={16} /> Enviar convite
            </button>
            <p className="text-[11px] text-eco-400 font-body mt-3 leading-relaxed">
              Depois de criar o convite, envie o link (ou o código) para a pessoa por e-mail ou WhatsApp. Vale por 7 dias; ao abrir, ela define nome e senha.
            </p>
          </form>

          <section className="bg-white rounded-2xl border border-eco-100 overflow-hidden">
            <h2 className="font-display font-semibold text-eco-900 px-5 pt-5 pb-3">Membros e convites</h2>
            <ul>
              {staff.map((m) => (
                <li key={m.id} className="px-5 py-3.5 border-t border-eco-50 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="w-9 h-9 rounded-xl bg-eco-100 text-eco-800 font-display font-bold text-xs flex items-center justify-center shrink-0">
                    {(m.name || m.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-eco-800 font-body truncate">{m.name || m.email}</div>
                    <div className="text-xs text-eco-500 font-body truncate">
                      {ROLE_INFO[m.role].label}{m.name ? ` · ${m.email}` : ''}{m.status === 'pendente' ? ` · convidado em ${fmtInvited(m.invitedAt)}` : ''}
                    </div>
                  </div>
                  {m.status === 'ativo' ? (
                    <span className="px-2 py-0.5 rounded-full bg-eco-100 text-eco-700 text-[11px] font-semibold">Ativo</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-drach-light text-drach text-[11px] font-semibold">Pendente</span>
                      <button onClick={() => copy(m)} className="text-xs font-semibold text-eco-600 hover:bg-eco-50 px-2 py-1 rounded-lg">
                        {copied === m.id ? 'Copiado!' : 'Copiar link'}
                      </button>
                      <button onClick={() => resend(m)} className="text-xs font-semibold text-eco-600 hover:bg-eco-50 px-2 py-1 rounded-lg">Novo código</button>
                      <button onClick={() => onRevoke(m.id)} className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg">Revogar</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {sent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-eco-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center animate-splash-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'linear-gradient(135deg, #3a9448, #1d5c2a)' }}>
              <CheckCircleIcon size={32} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-eco-900 text-xl mb-1">Convite criado</h2>
            <p className="text-eco-500 text-sm font-body mb-4">Envie o link abaixo para <strong className="text-eco-800">{sent.email}</strong> por e-mail ou WhatsApp.</p>
            <div className="rounded-xl bg-drach-light py-3 mb-5">
              <div className="text-[11px] uppercase tracking-wider text-drach/70 font-semibold">Código do convite</div>
              <div className="font-display font-bold text-drach text-2xl tracking-widest">{sent.code}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(sent, 'modal')} className="flex-1 py-3 rounded-xl border border-eco-200 text-eco-700 text-sm font-display font-semibold hover:bg-eco-50">
                {copied === 'modal' ? 'Link copiado!' : 'Copiar link'}
              </button>
              <button onClick={() => setSent(null)} className="flex-1 py-3 rounded-xl text-white text-sm font-display font-semibold"
                style={{ background: 'linear-gradient(135deg, #2d7a3a, #1d5c2a)' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
