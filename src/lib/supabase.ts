import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/** Cliente do Supabase no navegador: só autenticação (a sessão fica salva no aparelho). */
export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-fb0f2ffe`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Chama o servidor do Ecópolis com a sessão atual (ou a chave pública, nas rotas abertas). */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? publicAnonKey;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined && { 'Content-Type': 'application/json' }) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet e tente novamente.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? json.message ?? `Erro ${res.status} no servidor.`);
  return json as T;
}

/** Traduz as mensagens mais comuns do Supabase Auth. */
export function authMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
  if (/rate limit|too many/i.test(message)) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (/should be different/i.test(message)) return 'A nova senha deve ser diferente da anterior.';
  if (/fetch|network/i.test(message)) return 'Sem conexão. Verifique sua internet e tente novamente.';
  return message;
}
