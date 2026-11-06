export const PASSWORD_RULES = [
  { id: 'len', label: 'Mínimo de 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula (A-Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'Uma letra minúscula (a-z)', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'num', label: 'Um número (0-9)', test: (pw: string) => /[0-9]/.test(pw) },
  { id: 'special', label: 'Um caractere especial (!@#$%...)', test: (pw: string) => /[^A-Za-z0-9\s]/.test(pw) },
];

export function isPasswordValid(pw: string) {
  return PASSWORD_RULES.every((r) => r.test(pw));
}

interface PasswordRulesProps {
  password: string;
  confirm?: string;
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs font-body">
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          ok ? 'bg-eco-700 scale-100' : 'bg-white border-[1.5px] border-eco-200'
        }`}
      >
        {ok && (
          <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`transition-colors ${ok ? 'text-eco-800 font-medium' : 'text-eco-500'}`}>{label}</span>
    </li>
  );
}

export default function PasswordRules({ password, confirm }: PasswordRulesProps) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const total = PASSWORD_RULES.length + (confirm !== undefined ? 1 : 0);
  const matchOk = confirm !== undefined && confirm.length > 0 && confirm === password;
  const done = passed + (matchOk ? 1 : 0);

  return (
    <div className="rounded-xl border border-eco-100 bg-white/70 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-eco-700 font-body">
          Requisitos da senha
        </span>
        <span className={`text-[11px] font-semibold font-body ${done === total ? 'text-eco-700' : 'text-eco-400'}`}>
          {done}/{total}
        </span>
      </div>
      <div className="h-1 rounded-full bg-eco-100 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-eco-600 transition-all duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {PASSWORD_RULES.map((r) => (
          <Rule key={r.id} ok={r.test(password)} label={r.label} />
        ))}
        {confirm !== undefined && <Rule ok={matchOk} label="As senhas coincidem" />}
      </ul>
    </div>
  );
}

export function Req() {
  return <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;
}
