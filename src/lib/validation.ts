// Regras de validação dos campos digitados (o servidor repete as mesmas regras).

const letters = (v: string) => v.replace(/[^\p{L}]/gu, '');
export const squish = (v: string) => v.trim().replace(/\s+/g, ' ');

/** Nome de pessoa: só letras (com acentos), espaço, hífen e apóstrofo; nome e sobrenome. */
export function personNameError(raw: string): string | null {
  const v = squish(raw);
  if (!v) return 'Informe o nome completo';
  if (v.length > 80) return 'Nome muito longo (máximo 80 caracteres)';
  if (/\d/.test(v)) return 'O nome não pode ter números';
  if (!/^\p{L}[\p{L}'’\- ]*$/u.test(v)) return 'Use apenas letras no nome';
  const parts = v.split(' ').filter((p) => letters(p).length > 0);
  if (parts.length < 2) return 'Informe nome e sobrenome';
  if (letters(parts[0]).length < 2 || !parts.slice(1).some((p) => letters(p).length >= 2)) return 'Informe nome e sobrenome completos';
  if (/(\p{L})\1{2,}/u.test(v.toLowerCase())) return 'Confira o nome digitado';
  return null;
}

/** Texto livre que precisa ter palavras (não só números ou símbolos). */
export function textError(raw: string, label: string, { min = 2, max = 120, optional = false } = {}): string | null {
  const v = squish(raw);
  if (!v) return optional ? null : `Informe ${label}`;
  if (v.length > max) return `${cap(label)} muito longo (máximo ${max} caracteres)`;
  if (letters(v).length < min) return `${cap(label)} precisa ter palavras, não só números ou símbolos`;
  if (/[<>{}]/.test(v)) return `${cap(label)} tem caracteres inválidos`;
  return null;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function emailError(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return 'Informe o e-mail';
  if (v.length > 120 || !/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v)) return 'E-mail inválido';
  return null;
}

/** Telefone brasileiro: DDD válido; celular com 9 na frente. Vazio é aceito quando opcional. */
export function phoneError(raw: string, optional = true): string | null {
  const d = raw.replace(/\D/g, '');
  if (!d) return optional ? null : 'Informe o telefone';
  if (d.length !== 10 && d.length !== 11) return 'Telefone inválido';
  if (Number(d.slice(0, 2)) < 11 || d[2] === '0') return 'DDD ou número inválido';
  if (d.length === 11 && d[2] !== '9') return 'Celular deve começar com 9';
  if (/^(\d)\1+$/.test(d.slice(2))) return 'Telefone inválido';
  return null;
}

/** CNPJ com dígitos verificadores. */
export function cnpjError(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return 'CNPJ inválido';
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, wi, i) => acc + Number(d[i]) * wi, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]) ? null : 'CNPJ inválido (confira os números)';
}

/** Número do endereço: até 6 dígitos (com letra opcional, ex.: 12A) ou "S/N". */
export function addressNumberError(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  if (!v) return 'Informe o número';
  if (v === 'S/N' || v === 'SN') return null;
  return /^\d{1,6}[A-Z]?$/.test(v) ? null : 'Use só números (ou S/N)';
}
