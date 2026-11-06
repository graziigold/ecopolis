export type Screen =
  | 'splash'
  | 'login'
  | 'cadastro'
  | 'home'
  | 'perfil'
  | 'editarPerfil'
  | 'historico'
  | 'ecopontos'
  | 'descarte'
  | 'coleta'
  | 'minhasColetas'
  | 'loja'
  | 'ranking'
  | 'notificacoes'
  | 'recuperar'
  | 'registrarEcoponto'
  | 'gestao'
  | 'gestaoResiduos'
  | 'gestaoRecompensas'
  | 'gestaoParceiros'
  | 'gestaoEquipe'
  | 'gestaoSugestoes'
  | 'aceitarConvite'
  | 'primeiroGestor'
  | 'operador'
  | 'operadorColetas';

export type Role = 'cidadao' | 'gestor' | 'operador';

export interface UserData {
  id: string;
  role: Role;
  name: string;
  email: string;
  drachs: number; // saldo atual de Ecopontos
  earned: number; // total já ganho (define o nível)
  level: string;
  levelNum: number;
  levelFloor: number;
  nextLevelAt: number | null;
  descartes: number;
  materiais: number;
  photo?: string; // link assinado do Storage
  phone?: string;
  sector?: string;
  location?: string; // ecolocalização do operador
}

/** Progresso (0–100) até o próximo nível. */
export const levelProgress = (u: UserData) =>
  u.nextLevelAt === null ? 100 : Math.min(100, Math.max(0, ((u.earned - u.levelFloor) / (u.nextLevelAt - u.levelFloor)) * 100));
