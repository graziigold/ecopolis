import { RecycleIcon, PackageIcon, LeafIcon, LayersIcon, ShoppingBagIcon, GiftIcon } from '../components/Icons';
import type { Screen } from '../types';

// ---------- Datas ----------
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const pad = (n: number) => String(n).padStart(2, '0');

/** "Hoje, 14:32", "Ontem, 10:15" ou "12 ago, 11:00". */
export function fmtWhen(at: number) {
  const d = new Date(at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (at >= today.getTime()) return `Hoje, ${time}`;
  if (at >= today.getTime() - DAY) return `Ontem, ${time}`;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}, ${time}`;
}

export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const weekday = (iso: string) => WEEKDAYS[parseDay(iso).getDay()];
/** "Qua, 10 de setembro" */
export const fmtDay = (iso: string) => {
  const d = parseDay(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
};

/** Próximos dias de coleta (segunda a sábado), a partir de amanhã. */
export function nextCollectionDays(n = 6, from = new Date()) {
  const out: string[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(isoDay(d));
  }
  return out;
}

export const SLOTS = [
  { label: '08h às 10h', start: 8 },
  { label: '10h às 12h', start: 10 },
  { label: '14h às 16h', start: 14 },
  { label: '16h às 18h', start: 16 },
];

export const COLLECTION_TYPES = ['Recicláveis secos', 'Eletrônicos', 'Volumosos', 'Óleo de cozinha'];

export interface Material {
  key: string;
  label: string;
  rate: number; // Ecopontos por kg
  active: boolean;
  icon: typeof RecycleIcon;
  color: string;
  bg: string;
}

export interface Reward {
  id: number;
  name: string;
  cat: string;
  cost: number;
  stock: number;
  active: boolean;
  partnerId?: number;
  icon: typeof RecycleIcon;
  tint: string;
  color: string;
}

// Aparência (ícone e cores) fica no app; o servidor guarda só os dados.
const MATERIAL_STYLE: Record<string, Pick<Material, 'icon' | 'color' | 'bg'>> = {
  plastico: { icon: RecycleIcon, color: '#2d7a3a', bg: '#e8f5e9' },
  papel: { icon: PackageIcon, color: '#267035', bg: '#f1faf2' },
  vidro: { icon: LayersIcon, color: '#1d5c2a', bg: '#c8e6ca' },
  metal: { icon: LayersIcon, color: '#2d7a3a', bg: '#e8f5e9' },
  eletronico: { icon: RecycleIcon, color: '#b07d30', bg: '#fdf6eb' },
  organico: { icon: LeafIcon, color: '#3a9448', bg: '#f1faf2' },
};
const REWARD_STYLE: Record<string, Pick<Reward, 'icon' | 'tint' | 'color'>> = {
  Cupons: { icon: ShoppingBagIcon, tint: '#e8f5e9', color: '#2d7a3a' },
  Serviços: { icon: GiftIcon, tint: '#fdf6eb', color: '#b07d30' },
  Doações: { icon: LeafIcon, tint: '#f1faf2', color: '#267035' },
};

export type RawMaterial = Omit<Material, 'icon' | 'color' | 'bg'>;
export type RawReward = Omit<Reward, 'icon' | 'tint' | 'color'>;

export const decorateMaterial = (m: RawMaterial): Material => ({
  ...m,
  ...(MATERIAL_STYLE[m.key] ?? { icon: RecycleIcon, color: '#2d7a3a', bg: '#e8f5e9' }),
});
export const decorateReward = (r: RawReward): Reward => ({ ...r, ...(REWARD_STYLE[r.cat] ?? REWARD_STYLE.Cupons) });
export const stripMaterial = ({ icon: _i, color: _c, bg: _b, ...m }: Material): RawMaterial => m;
export const stripReward = ({ icon: _i, tint: _t, color: _c, ...r }: Reward): RawReward => r;

export type PartnerType = 'Empresa' | 'Bazar' | 'Feira' | 'ONG';

export interface Partner {
  id: number;
  name: string;
  type: PartnerType;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  active: boolean;
}

export type StaffRole = 'gestor' | 'operador';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  status: 'ativo' | 'pendente';
  code?: string;
  invitedAt?: number;
}

export type DeliveryStatus = 'pendente' | 'confirmada' | 'ajustada' | 'recusada';

export interface Delivery {
  id: number;
  code?: string; // só o cidadão recebe o código
  citizenName: string;
  citizenEmail: string;
  materialKey: string;
  declaredKg: number;
  status: DeliveryStatus;
  at: number;
  resolvedAt?: number;
  realMaterialKey?: string;
  realKg?: number;
  drachs?: number;
  reason?: string;
  ecoponto?: string;
  operator?: string;
}

export const deliveryEcopontos = (materials: Material[], key: string, kg: number) =>
  Math.round((materials.find((m) => m.key === key)?.rate ?? 0) * kg);

// ---------- Ecolocalizações ----------
export interface EcoLocation {
  id: number;
  name: string;
  address: string;
  open: boolean;
  hours: string;
  materials: string[];
  lat: number;
  lng: number;
  x: number; // posição no mapa ilustrado (sem token do Mapbox)
  y: number;
}

/** Centro aproximado do Gama/DF. */
export const GAMA_CENTER = { lat: -16.0185, lng: -48.0610 };

export const LOCATION_MATERIALS = ['Plástico', 'Papel', 'Vidro', 'Metal', 'Eletrônicos', 'Pilhas', 'Óleo', 'Orgânico'];

export type SuggestionStatus = 'pendente' | 'aprovada' | 'rejeitada';

export interface Suggestion {
  id: number;
  name: string;
  address: string;
  materials: string[];
  obs?: string;
  citizenName: string;
  citizenEmail: string;
  at: number;
  status: SuggestionStatus;
  reason?: string;
}

// ---------- Coletas domiciliares ----------
export type PickupStatus = 'agendada' | 'realizada' | 'nao_realizada' | 'cancelada';

export interface Pickup {
  id: number;
  citizenName: string;
  citizenEmail: string;
  type: string;
  date: string; // AAAA-MM-DD
  slot: number;
  address: string;
  status: PickupStatus;
  at: number;
  resolvedAt?: number;
  materialKey?: string;
  kg?: number;
  drachs?: number;
  reason?: string;
  operator?: string;
}

export const PICKUP_STATUS_LABEL: Record<PickupStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  nao_realizada: 'Não realizada',
  cancelada: 'Cancelada',
};

export const slotStart = (p: Pick<Pickup, 'date' | 'slot'>) => {
  const d = parseDay(p.date);
  d.setHours(SLOTS[p.slot].start, 0, 0, 0);
  return d.getTime();
};
/** O cidadão pode cancelar até o início da faixa de horário agendada. */
export const canCancelPickup = (p: Pickup) => p.status === 'agendada' && Date.now() < slotStart(p);

// ---------- Resgates ----------
export interface Redemption {
  id: number;
  citizenEmail: string;
  rewardName: string;
  partnerName?: string;
  cost: number;
  at: number;
}

// ---------- Notificações ----------
export type NotificationKind = 'descarte' | 'coleta' | 'ranking' | 'loja' | 'sugestao' | 'bonus';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  at: number;
  goTo: Screen;
  unread: boolean;
  tone?: 'ok' | 'warn' | 'bad';
}

// ---------- Ranking e painel ----------
export interface RankingEntry {
  name: string;
  points: number;
  me: boolean;
}
export interface RankingPeriod {
  top: RankingEntry[];
  position: number | null;
  myPoints: number;
  total: number;
}
export type Ranking = Record<'semana' | 'mes' | 'geral', RankingPeriod>;

export interface ManagerKpis {
  citizens: number;
  kgMonth: number;
  pointsMonth: number;
  redemptionsMonth: number;
}
