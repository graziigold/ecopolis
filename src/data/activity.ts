import { RecycleIcon, CalendarIcon, GiftIcon } from '../components/Icons';
import { fmtDay, SLOTS } from './catalog';
import type { Delivery, Material, Pickup, Redemption } from './catalog';

export type ActivityKind = 'descarte' | 'coleta' | 'recompensa';
export type ActivityTone = 'ok' | 'warn' | 'bad' | 'muted';

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  sub: string;
  at: number;
  amount?: number; // positivo = crédito, negativo = débito
  status: string;
  tone: ActivityTone;
  icon: typeof RecycleIcon;
}

export const TONE_STYLE: Record<ActivityTone, { color: string; bg: string }> = {
  ok: { color: '#2d7a3a', bg: '#e8f5e9' },
  warn: { color: '#b07d30', bg: '#fdf6eb' },
  bad: { color: '#dc2626', bg: '#fef2f2' },
  muted: { color: '#6b8070', bg: '#f1f4f1' },
};

const fmtKg = (kg: number) => kg.toLocaleString('pt-BR');

/** Linha do tempo do cidadão, derivada das entregas, coletas e resgates reais. */
export function buildActivities(
  email: string,
  deliveries: Delivery[],
  pickups: Pickup[],
  redemptions: Redemption[],
  materials: Material[],
): Activity[] {
  const label = (k?: string) => materials.find((m) => m.key === k)?.label ?? k ?? '';
  const list: Activity[] = [];

  for (const d of deliveries) {
    if (d.citizenEmail !== email) continue;
    const base = { id: `d${d.id}`, kind: 'descarte' as const, icon: RecycleIcon };
    if (d.status === 'pendente')
      list.push({ ...base, title: 'Descarte registrado', sub: `${label(d.materialKey)} · ${fmtKg(d.declaredKg)} kg · código ${d.code}`, at: d.at, status: 'Pendente', tone: 'warn' });
    else if (d.status === 'confirmada')
      list.push({ ...base, title: 'Descarte validado', sub: `${label(d.realMaterialKey)} · ${fmtKg(d.realKg ?? 0)} kg`, at: d.resolvedAt ?? d.at, amount: d.drachs, status: 'Concluído', tone: 'ok' });
    else if (d.status === 'ajustada')
      list.push({ ...base, title: 'Descarte ajustado', sub: d.reason ?? label(d.realMaterialKey), at: d.resolvedAt ?? d.at, amount: d.drachs, status: 'Ajustado', tone: 'warn' });
    else
      list.push({ ...base, title: 'Descarte recusado', sub: d.reason ?? '', at: d.resolvedAt ?? d.at, status: 'Recusado', tone: 'bad' });
  }

  for (const p of pickups) {
    if (p.citizenEmail !== email) continue;
    const base = { id: `p${p.id}`, kind: 'coleta' as const, icon: CalendarIcon };
    const when = `${fmtDay(p.date)} · ${SLOTS[p.slot].label}`;
    if (p.status === 'agendada')
      list.push({ ...base, title: 'Coleta agendada', sub: `${p.type} · ${when}`, at: p.at, status: 'Agendada', tone: 'warn' });
    else if (p.status === 'realizada')
      list.push({ ...base, title: 'Coleta realizada', sub: `${label(p.materialKey)} · ${fmtKg(p.kg ?? 0)} kg`, at: p.resolvedAt ?? p.at, amount: p.drachs, status: 'Concluído', tone: 'ok' });
    else if (p.status === 'nao_realizada')
      list.push({ ...base, title: 'Coleta não realizada', sub: p.reason ?? when, at: p.resolvedAt ?? p.at, status: 'Não realizada', tone: 'bad' });
    else
      list.push({ ...base, title: 'Coleta cancelada', sub: `${p.type} · ${when}`, at: p.resolvedAt ?? p.at, status: 'Cancelada', tone: 'muted' });
  }

  for (const r of redemptions) {
    if (r.citizenEmail !== email) continue;
    list.push({ id: `r${r.id}`, kind: 'recompensa', icon: GiftIcon, title: 'Recompensa resgatada', sub: r.partnerName ? `${r.rewardName} · ${r.partnerName}` : r.rewardName, at: r.at, amount: -r.cost, status: 'Resgatado', tone: 'muted' });
  }

  return list.sort((a, b) => b.at - a.at);
}
