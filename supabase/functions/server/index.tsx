import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const P = "/make-server-fb0f2ffe";
const BUCKET = "make-fb0f2ffe-avatars";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// ---------------------------------------------------------------- utilitários
type Role = "cidadao" | "gestor" | "operador";
interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  drachs: number; // saldo atual de Ecopontos
  earned: number; // total já ganho (define o nível)
  descartes: number;
  materiais: number;
  phone?: string;
  sector?: string;
  photoPath?: string;
  location?: string; // ecolocalização do operador
  createdAt: number;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const newId = () => Date.now() * 100 + Math.floor(Math.random() * 100);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const LEVELS: [number, string][] = [
  [0, "Semente Verde"],
  [500, "Broto Verde"],
  [1500, "Guardião Verde"],
  [3000, "Árvore Viva"],
  [6000, "Floresta Urbana"],
];
function levelOf(earned: number) {
  let i = 0;
  LEVELS.forEach(([t], idx) => {
    if (earned >= t) i = idx;
  });
  return { level: LEVELS[i][1], levelNum: i + 1, levelFloor: LEVELS[i][0], nextLevelAt: LEVELS[i + 1]?.[0] ?? null };
}

const PASSWORD_OK = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9\s]/.test(pw);

// Horário de Brasília (UTC-3, sem horário de verão).
const SLOT_START = [8, 10, 14, 16];
const slotStartMs = (date: string, slot: number) => new Date(`${date}T${String(SLOT_START[slot]).padStart(2, "0")}:00:00-03:00`).getTime();
const brDate = (ms: number) => new Date(ms - 3 * 3600_000).toISOString().slice(0, 10);

// ---------------------------------------------------------------- catálogo inicial
const SEED = {
  materials: [
    { key: "plastico", label: "Plástico", rate: 65, active: true },
    { key: "papel", label: "Papel", rate: 50, active: true },
    { key: "vidro", label: "Vidro", rate: 40, active: true },
    { key: "metal", label: "Metal", rate: 90, active: true },
    { key: "eletronico", label: "Eletrônico", rate: 150, active: true },
    { key: "organico", label: "Orgânico", rate: 25, active: true },
  ],
  partners: [
    { id: 1, name: "Feira Orgânica do Gama", type: "Feira", cnpj: "12.345.678/0001-90", contact: "Luís", phone: "(61) 99876-1122", email: "contato@feiragama.com.br", cep: "72405-610", address: "Setor Central, Gama, DF", active: true },
    { id: 2, name: "Bazar Solidário Gama Sul", type: "Bazar", cnpj: "23.456.789/0001-01", contact: "Emilly", phone: "(61) 99654-3321", email: "bazar@gamasul.org", cep: "72415-120", address: "Setor Sul, Gama, DF", active: true },
    { id: 3, name: "Caesb", type: "Empresa", cnpj: "00.082.024/0001-37", contact: "Relacionamento", phone: "(61) 3213-7100", email: "parcerias@caesb.df.gov.br", cep: "70000-000", address: "Brasília, DF", active: true },
    { id: 4, name: "Banco de Alimentos DF", type: "ONG", cnpj: "34.567.890/0001-12", contact: "Júlia", phone: "(61) 99111-2233", email: "doacoes@bancodf.org", cep: "72430-010", address: "Setor Leste, Gama, DF", active: true },
  ],
  rewards: [
    { id: 1, partnerId: 1, name: "Cupom R$20 na Feira Orgânica", cat: "Cupons", cost: 400, stock: 120, active: true },
    { id: 2, partnerId: 4, name: "Muda de árvore nativa", cat: "Doações", cost: 250, stock: 300, active: true },
    { id: 3, partnerId: 2, name: "Sacola ecológica Ecópolis", cat: "Cupons", cost: 600, stock: 45, active: true },
    { id: 4, partnerId: 3, name: "Desconto conta de água 10%", cat: "Serviços", cost: 900, stock: 80, active: true },
    { id: 5, partnerId: 2, name: "Kit composteira doméstica", cat: "Serviços", cost: 1500, stock: 12, active: true },
    { id: 6, partnerId: 4, name: "Doar 1 refeição ao Banco de Alimentos", cat: "Doações", cost: 300, stock: 500, active: true },
  ],
  locations: [
    { id: 1, name: "Ecolocalização Setor Central", address: "Praça Central, St. Central, Gama, DF", open: true, hours: "Aberto até 20h", materials: ["Plástico", "Papel", "Vidro", "Metal"], lat: -16.0168, lng: -48.064, x: 34, y: 40 },
    { id: 2, name: "Estação Verde Setor Sul", address: "St. Sul QD 12, Área Especial, Gama, DF", open: true, hours: "Aberto até 18h", materials: ["Eletrônicos", "Pilhas", "Óleo"], lat: -16.0305, lng: -48.0675, x: 62, y: 26 },
    { id: 3, name: "Ponto Coleta Setor Norte", address: "St. Norte QD 08, Lote 15, Gama, DF", open: false, hours: "Abre às 8h", materials: ["Plástico", "Papel", "Orgânico"], lat: -16.0035, lng: -48.0585, x: 46, y: 66 },
    { id: 4, name: "Reciclare Setor Leste", address: "St. Leste QD 30, Área Especial, Gama, DF", open: true, hours: "Aberto 24h", materials: ["Vidro", "Metal", "Eletrônicos"], lat: -16.0215, lng: -48.0455, x: 78, y: 58 },
  ],
};
type CatalogName = keyof typeof SEED;

// Textos do catálogo inicial foram revisados (sem travessões); ajusta o que já estava gravado.
const TEXT_FIX: Record<string, string> = {
  "Cupom R$20 \u2014 Feira Orgânica": "Cupom R$20 na Feira Orgânica",
  "Doar 1 refeição \u2014 Banco de Alimentos": "Doar 1 refeição ao Banco de Alimentos",
};
const fixText = (v: unknown): unknown =>
  typeof v === "string" ? TEXT_FIX[v] ?? v.replace(/\s+\u2014\s+/g, ", ")
  : Array.isArray(v) ? v.map(fixText)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fixText(x)]))
  : v;

async function catalog<T = any>(name: CatalogName): Promise<T[]> {
  const v = await kv.get(`catalog:${name}`);
  if (Array.isArray(v)) {
    if (JSON.stringify(v).includes("\u2014")) {
      const fixed = fixText(v) as T[];
      await kv.set(`catalog:${name}`, fixed);
      return fixed;
    }
    return v;
  }
  await kv.set(`catalog:${name}`, SEED[name]);
  return SEED[name] as T[];
}

// ---------------------------------------------------------------- autenticação
async function authUser(c: any): Promise<Profile> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) fail(401, "Sessão expirada. Entre novamente.");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) fail(401, "Sessão expirada. Entre novamente.");
  const profile = (await kv.get(`profile:${data.user!.id}`)) as Profile | null;
  if (!profile) fail(403, "Conta sem perfil no Ecópolis.");
  return profile!;
}
async function requireRole(c: any, ...roles: Role[]): Promise<Profile> {
  const p = await authUser(c);
  if (!roles.includes(p.role)) fail(403, "Você não tem permissão para esta ação.");
  return p;
}

async function createAccount(email: string, password: string, name: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    // Sem servidor de e-mail configurado para confirmação, a conta já nasce confirmada.
    email_confirm: true,
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) fail(409, "Este e-mail já está cadastrado.");
    fail(400, `Não foi possível criar a conta: ${error.message}`);
  }
  return data.user!;
}

async function photoUrl(path?: string) {
  if (!path) return undefined;
  const { data } = await admin().storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl;
}
async function publicProfile(p: Profile) {
  const { photoPath, ...rest } = p;
  return { ...rest, ...levelOf(p.earned), photo: await photoUrl(photoPath) };
}

async function notify(userId: string, n: { kind: string; tone?: string; title: string; body: string; goTo: string }) {
  const id = newId();
  await kv.set(`notif:${userId}:${id}`, { id, userId, ...n, at: Date.now(), unread: true });
}

// Garante o bucket privado das fotos de perfil (idempotente).
let bucketReady: Promise<void> | null = null;
function ensureBucket() {
  bucketReady ??= (async () => {
    const { data } = await admin().storage.listBuckets();
    if (!data?.some((b) => b.name === BUCKET)) {
      const { error } = await admin().storage.createBucket(BUCKET, { public: false, fileSizeLimit: 2 * 1024 * 1024 });
      if (error && !/exists/i.test(error.message)) throw error;
    }
  })().catch((e) => {
    bucketReady = null;
    throw e;
  });
  return bucketReady;
}

// ---------------------------------------------------------------- dados derivados
const all = (prefix: string) => kv.getByPrefix(prefix) as Promise<any[]>;
const credited = (x: any) => (x.status === "confirmada" || x.status === "ajustada" || x.status === "realizada") && x.drachs > 0;

async function rankingFor(me: Profile) {
  const [profiles, deliveries, pickups] = await Promise.all([all("profile:"), all("delivery:"), all("pickup:")]);
  const citizens = (profiles as Profile[]).filter((p) => p.role === "cidadao");
  const now = Date.now();
  const since = { semana: now - 7 * 86400_000, mes: now - 30 * 86400_000 };
  const periodPoints = (from: number) => {
    const m = new Map<string, number>();
    for (const x of [...deliveries, ...pickups])
      if (credited(x) && (x.resolvedAt ?? 0) >= from) m.set(x.citizenId, (m.get(x.citizenId) ?? 0) + x.drachs);
    return m;
  };
  const build = (pointsOf: (p: Profile) => number) => {
    const list = citizens
      .map((p) => ({ id: p.id, name: p.name.split(" ")[0], points: pointsOf(p) }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    const pos = list.findIndex((x) => x.id === me.id);
    return { top: list.slice(0, 10).map(({ id, ...r }) => ({ ...r, me: id === me.id })), position: pos >= 0 ? pos + 1 : null, myPoints: pos >= 0 ? list[pos].points : 0, total: list.length };
  };
  const week = periodPoints(since.semana);
  const month = periodPoints(since.mes);
  return {
    semana: build((p) => week.get(p.id) ?? 0),
    mes: build((p) => month.get(p.id) ?? 0),
    geral: build((p) => p.earned),
  };
}

async function managerKpis() {
  const [profiles, deliveries, pickups, redemptions] = await Promise.all([all("profile:"), all("delivery:"), all("pickup:"), all("redemption:")]);
  const monthStart = new Date(new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 8) + "01T00:00:00-03:00").getTime();
  const inMonth = (x: any) => credited(x) && (x.resolvedAt ?? 0) >= monthStart;
  const done = [...deliveries, ...pickups].filter(inMonth);
  return {
    citizens: (profiles as Profile[]).filter((p) => p.role === "cidadao").length,
    kgMonth: Math.round(done.reduce((s, x) => s + (x.realKg ?? x.kg ?? 0), 0) * 10) / 10,
    pointsMonth: done.reduce((s, x) => s + (x.drachs ?? 0), 0),
    redemptionsMonth: redemptions.filter((r) => r.at >= monthStart).length,
  };
}

// ---------------------------------------------------------------- rotas públicas
app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

app.get(`${P}/setup/status`, async (c) => {
  const profiles = (await all("profile:")) as Profile[];
  return c.json({ needsSetup: !profiles.some((p) => p.role === "gestor") });
});

// Cria o primeiro gestor. Fica bloqueado assim que existir um gestor.
app.post(`${P}/setup`, async (c) => {
  const profiles = (await all("profile:")) as Profile[];
  if (profiles.some((p) => p.role === "gestor")) fail(403, "O primeiro gestor já foi configurado. Peça um convite.");
  const b = await c.req.json();
  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), password = String(b.password ?? "");
  if (name.split(/\s+/).length < 2) fail(400, "Informe nome e sobrenome.");
  if (!EMAIL_RE.test(email)) fail(400, "E-mail inválido.");
  if (!PASSWORD_OK(password)) fail(400, "A senha não atende aos requisitos.");
  const user = await createAccount(email, password, name);
  const profile: Profile = { id: user.id, role: "gestor", name, email, drachs: 0, earned: 0, descartes: 0, materiais: 0, createdAt: Date.now() };
  await kv.set(`profile:${user.id}`, profile);
  const sid = newId();
  await kv.set(`staff:${sid}`, { id: sid, name, email, role: "gestor", status: "ativo", userId: user.id });
  return c.json({ ok: true });
});

app.post(`${P}/signup`, async (c) => {
  const b = await c.req.json();
  const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), password = String(b.password ?? "");
  if (name.split(/\s+/).length < 2) fail(400, "Informe nome e sobrenome.");
  if (!EMAIL_RE.test(email)) fail(400, "E-mail inválido.");
  if (!PASSWORD_OK(password)) fail(400, "A senha não atende aos requisitos.");
  const staff = await all("staff:");
  if (staff.some((s) => s.email === email && s.status === "pendente")) fail(409, "Este e-mail tem um convite da equipe. Use a opção “Recebi um convite”.");
  const user = await createAccount(email, password, name);
  const profile: Profile = { id: user.id, role: "cidadao", name, email, drachs: 0, earned: 0, descartes: 0, materiais: 0, createdAt: Date.now() };
  await kv.set(`profile:${user.id}`, profile);
  await notify(user.id, { kind: "bonus", tone: "ok", title: "Bem-vindo(a) ao Ecópolis!", body: "Registre seu primeiro descarte e comece a juntar Ecopontos.", goTo: "descarte" });
  return c.json({ ok: true });
});

const findInvite = async (code: string) => {
  const staff = await all("staff:");
  const m = staff.find((s) => s.status === "pendente" && s.code === clean(code, 20).toUpperCase());
  if (!m) fail(404, "Código inválido, expirado ou já utilizado.");
  if (Date.now() - (m.invitedAt ?? 0) > 7 * 86400_000) fail(410, "Este convite expirou. Peça um novo ao gestor.");
  return m;
};

app.post(`${P}/invite/check`, async (c) => {
  const m = await findInvite((await c.req.json()).code);
  return c.json({ email: m.email, role: m.role });
});

app.post(`${P}/invite/accept`, async (c) => {
  const b = await c.req.json();
  const m = await findInvite(b.code);
  const name = clean(b.name, 80), password = String(b.password ?? "");
  if (name.split(/\s+/).length < 2) fail(400, "Informe nome e sobrenome.");
  if (!PASSWORD_OK(password)) fail(400, "A senha não atende aos requisitos.");
  const user = await createAccount(m.email, password, name);
  const locations = await catalog("locations");
  const profile: Profile = {
    id: user.id, role: m.role, name, email: m.email, drachs: 0, earned: 0, descartes: 0, materiais: 0, createdAt: Date.now(),
    ...(m.role === "operador" && { location: locations[0]?.name ?? "Ecolocalização" }),
  };
  await kv.set(`profile:${user.id}`, profile);
  await kv.set(`staff:${m.id}`, { ...m, name, status: "ativo", code: undefined, userId: user.id });
  return c.json({ ok: true, email: m.email });
});

// ---------------------------------------------------------------- dados da sessão
app.get(`${P}/bootstrap`, async (c) => {
  const me = await authUser(c);
  const [materials, rewards, partners, locations] = await Promise.all([catalog("materials"), catalog("rewards"), catalog("partners"), catalog("locations")]);
  const base = { profile: await publicProfile(me), materials, rewards, partners, locations };

  if (me.role === "cidadao") {
    const [deliveries, pickups, redemptions, notifications, ranking] = await Promise.all([
      all("delivery:"), all("pickup:"), all("redemption:"), all(`notif:${me.id}:`), rankingFor(me),
    ]);
    return c.json({
      ...base,
      deliveries: deliveries.filter((d) => d.citizenId === me.id),
      pickups: pickups.filter((p) => p.citizenId === me.id),
      redemptions: redemptions.filter((r) => r.citizenId === me.id),
      notifications,
      ranking,
    });
  }
  if (me.role === "operador") {
    const [deliveries, pickups] = await Promise.all([all("delivery:"), all("pickup:")]);
    const since = Date.now() - 7 * 86400_000;
    return c.json({
      ...base,
      // O código da entrega fica só com o cidadão.
      deliveries: deliveries
        .filter((d) => d.status === "pendente" || (d.operatorId === me.id && (d.resolvedAt ?? 0) >= since))
        .map(({ code, ...d }) => d),
      pickups: pickups.filter((p) => p.status === "agendada" || ((p.status === "realizada" || p.status === "nao_realizada") && (p.resolvedAt ?? 0) >= since)),
    });
  }
  const [suggestions, staff, kpis] = await Promise.all([all("suggestion:"), all("staff:"), managerKpis()]);
  return c.json({ ...base, suggestions, staff, kpis });
});

// ---------------------------------------------------------------- perfil
app.put(`${P}/me`, async (c) => {
  const me = await authUser(c);
  const b = await c.req.json();
  const name = clean(b.name, 80);
  if (name.split(/\s+/).length < 2) fail(400, "Informe nome e sobrenome.");
  const phone = clean(b.phone, 20);
  if (phone && !/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) fail(400, "Telefone inválido.");
  const next: Profile = { ...me, name, phone: phone || undefined, sector: clean(b.sector, 60) || undefined };
  await kv.set(`profile:${me.id}`, next);
  await admin().auth.admin.updateUserById(me.id, { user_metadata: { name } });
  return c.json({ profile: await publicProfile(next) });
});

// Foto de perfil: vai para o Storage; o banco guarda só o caminho.
app.post(`${P}/me/photo`, async (c) => {
  const me = await authUser(c);
  const { dataUrl } = await c.req.json();
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(dataUrl ?? ""));
  if (!m) fail(400, "Imagem inválida.");
  const bytes = Uint8Array.from(atob(m![2]), (ch) => ch.charCodeAt(0));
  if (bytes.length > 2 * 1024 * 1024) fail(413, "A imagem deve ter no máximo 2 MB.");
  await ensureBucket();
  const path = `${me.id}/${Date.now()}.${m![1] === "jpeg" ? "jpg" : m![1]}`;
  const { error } = await admin().storage.from(BUCKET).upload(path, bytes, { contentType: `image/${m![1]}`, upsert: false });
  if (error) fail(500, `Não foi possível salvar a foto: ${error.message}`);
  if (me.photoPath) await admin().storage.from(BUCKET).remove([me.photoPath]);
  const next = { ...me, photoPath: path };
  await kv.set(`profile:${me.id}`, next);
  return c.json({ profile: await publicProfile(next) });
});

app.delete(`${P}/me/photo`, async (c) => {
  const me = await authUser(c);
  if (me.photoPath) await admin().storage.from(BUCKET).remove([me.photoPath]);
  const { photoPath: _, ...next } = me;
  await kv.set(`profile:${me.id}`, next);
  return c.json({ profile: await publicProfile(next as Profile) });
});

// ---------------------------------------------------------------- cidadão
app.post(`${P}/deliveries`, async (c) => {
  const me = await requireRole(c, "cidadao");
  const b = await c.req.json();
  const materials = await catalog("materials");
  const mat = materials.find((m: any) => m.key === b.materialKey && m.active);
  if (!mat) fail(400, "Material indisponível.");
  const kg = Number(b.kg);
  if (!(kg > 0 && kg <= 100)) fail(400, "Quantidade inválida.");
  const pending = new Set((await all("delivery:")).filter((d) => d.status === "pendente").map((d) => d.code));
  let code = "";
  do code = String(Math.floor(1000 + Math.random() * 9000)); while (pending.has(code));
  const id = newId();
  const d = { id, code, citizenId: me.id, citizenName: me.name, citizenEmail: me.email, materialKey: mat.key, declaredKg: kg, status: "pendente", at: Date.now() };
  await kv.set(`delivery:${id}`, d);
  return c.json({ delivery: d });
});

app.post(`${P}/pickups`, async (c) => {
  const me = await requireRole(c, "cidadao");
  const b = await c.req.json();
  const date = clean(b.date, 10), slot = Number(b.slot), type = clean(b.type, 60), address = clean(b.address, 300);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(slot >= 0 && slot <= 3)) fail(400, "Data ou horário inválido.");
  if (new Date(`${date}T12:00:00-03:00`).getUTCDay() === 0) fail(400, "Não há coleta aos domingos.");
  if (date <= brDate(Date.now())) fail(400, "Escolha uma data a partir de amanhã.");
  if (!type || !address) fail(400, "Informe o tipo de resíduo e o endereço.");
  const id = newId();
  const p = { id, citizenId: me.id, citizenName: me.name, citizenEmail: me.email, type, date, slot, address, status: "agendada", at: Date.now() };
  await kv.set(`pickup:${id}`, p);
  await notify(me.id, { kind: "coleta", tone: "ok", title: "Coleta agendada", body: `${type} · ${date.split("-").reverse().join("/")}.`, goTo: "minhasColetas" });
  return c.json({ pickup: p });
});

app.post(`${P}/pickups/:id/cancel`, async (c) => {
  const me = await requireRole(c, "cidadao");
  const p = await kv.get(`pickup:${c.req.param("id")}`);
  if (!p || p.citizenId !== me.id) fail(404, "Coleta não encontrada.");
  if (p.status !== "agendada") fail(409, "Esta coleta não pode mais ser cancelada.");
  if (Date.now() >= slotStartMs(p.date, p.slot)) fail(409, "O horário da coleta já começou.");
  const next = { ...p, status: "cancelada", resolvedAt: Date.now() };
  await kv.set(`pickup:${p.id}`, next);
  await notify(me.id, { kind: "coleta", tone: "warn", title: "Coleta cancelada", body: `${p.type} · a coleta saiu da agenda da equipe.`, goTo: "minhasColetas" });
  return c.json({ pickup: next });
});

app.post(`${P}/redeem`, async (c) => {
  const me = await requireRole(c, "cidadao");
  const { rewardId } = await c.req.json();
  const [rewards, partners] = await Promise.all([catalog("rewards"), catalog("partners")]);
  const r = rewards.find((x: any) => x.id === Number(rewardId));
  const partner = partners.find((x: any) => x.id === r?.partnerId);
  if (!r || !r.active || (r.partnerId && !partner?.active)) fail(404, "Recompensa indisponível.");
  if (r.stock <= 0) fail(409, "Recompensa esgotada.");
  const fresh = (await kv.get(`profile:${me.id}`)) as Profile;
  if (fresh.drachs < r.cost) fail(409, "Saldo insuficiente.");
  await kv.set("catalog:rewards", rewards.map((x: any) => (x.id === r.id ? { ...x, stock: x.stock - 1 } : x)));
  await kv.set(`profile:${me.id}`, { ...fresh, drachs: fresh.drachs - r.cost });
  const id = newId();
  await kv.set(`redemption:${id}`, { id, citizenId: me.id, citizenEmail: me.email, rewardName: r.name, partnerName: partner?.name, cost: r.cost, at: Date.now() });
  await notify(me.id, { kind: "loja", tone: "ok", title: "Recompensa resgatada", body: `${r.name}${partner ? ` · ${partner.name}` : ""}.`, goTo: "historico" });
  return c.json({ ok: true });
});

app.post(`${P}/suggestions`, async (c) => {
  const me = await requireRole(c, "cidadao");
  const b = await c.req.json();
  const name = clean(b.name, 100), address = clean(b.address, 300);
  const materials = Array.isArray(b.materials) ? b.materials.map((m: unknown) => clean(m, 40)).filter(Boolean).slice(0, 12) : [];
  if (!name || !address || materials.length === 0) fail(400, "Preencha nome, endereço e materiais.");
  const id = newId();
  await kv.set(`suggestion:${id}`, { id, name, address, materials, obs: clean(b.obs, 500) || undefined, citizenId: me.id, citizenName: me.name, citizenEmail: me.email, at: Date.now(), status: "pendente" });
  return c.json({ ok: true });
});

app.post(`${P}/notifications/read`, async (c) => {
  const me = await authUser(c);
  const { id } = await c.req.json().catch(() => ({}));
  const list = await all(`notif:${me.id}:`);
  const targets = list.filter((n) => n.unread && (id === undefined || n.id === id));
  if (targets.length) await kv.mset(targets.map((n) => `notif:${me.id}:${n.id}`), targets.map((n) => ({ ...n, unread: false })));
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- operador
app.post(`${P}/deliveries/lookup`, async (c) => {
  await requireRole(c, "operador");
  const code = clean((await c.req.json()).code, 4);
  const d = (await all("delivery:")).find((x) => x.code === code && x.status === "pendente");
  if (!d) fail(404, "Código não encontrado ou entrega já validada");
  const { code: _, ...safe } = d;
  return c.json({ delivery: safe });
});

const TOLERANCE = 0.1;
app.post(`${P}/deliveries/:id/resolve`, async (c) => {
  const op = await requireRole(c, "operador");
  const d = await kv.get(`delivery:${c.req.param("id")}`);
  if (!d) fail(404, "Entrega não encontrada.");
  if (d.status !== "pendente") fail(409, "Esta entrega já foi validada.");
  const b = await c.req.json();
  const base = { ...d, resolvedAt: Date.now(), operator: op.name, operatorId: op.id, ecoponto: op.location ?? "Ecolocalização" };
  let next: any;
  if (b.action === "recusar") {
    const reason = clean(b.reason, 200);
    if (!reason) fail(400, "Informe o motivo da recusa.");
    next = { ...base, status: "recusada", drachs: 0, reason };
    await notify(d.citizenId, { kind: "descarte", tone: "bad", title: "Entrega recusada", body: `Motivo: ${reason}.`, goTo: "historico" });
  } else {
    const materials = await catalog("materials");
    const mat = materials.find((m: any) => m.key === b.realMaterialKey);
    const kg = Number(b.realKg);
    if (!mat) fail(400, "Material inválido.");
    if (!(kg > 0 && kg < 1000)) fail(400, "Peso inválido.");
    const drachs = Math.round(mat.rate * kg);
    const same = mat.key === d.materialKey;
    const within = Math.abs(kg - d.declaredKg) / d.declaredKg <= TOLERANCE;
    const label = (k: string) => materials.find((m: any) => m.key === k)?.label ?? k;
    const reasons = [!same && `Material recebido: ${mat.label}`, !within && `Peso real ${kg} kg (declarado ${d.declaredKg} kg)`].filter(Boolean);
    next = { ...base, status: same && within ? "confirmada" : "ajustada", realMaterialKey: mat.key, realKg: kg, drachs, reason: reasons.join(" · ") || undefined };
    const citizen = (await kv.get(`profile:${d.citizenId}`)) as Profile | null;
    if (citizen)
      await kv.set(`profile:${citizen.id}`, { ...citizen, drachs: citizen.drachs + drachs, earned: citizen.earned + drachs, descartes: citizen.descartes + 1, materiais: citizen.materiais + 1 });
    await notify(
      d.citizenId,
      next.status === "confirmada"
        ? { kind: "descarte", tone: "ok", title: "Entrega confirmada", body: `${String(kg).replace(".", ",")} kg de ${label(mat.key).toLowerCase()} conferidos na ${base.ecoponto}. +${drachs} Ecopontos.`, goTo: "historico" }
        : { kind: "descarte", tone: "warn", title: "Entrega confirmada com ajuste", body: `${next.reason}. Você recebeu +${drachs} Ecopontos.`, goTo: "historico" },
    );
  }
  await kv.set(`delivery:${d.id}`, next);
  const { code: _, ...safe } = next;
  return c.json({ delivery: safe });
});

app.post(`${P}/pickups/:id/resolve`, async (c) => {
  const op = await requireRole(c, "operador");
  const p = await kv.get(`pickup:${c.req.param("id")}`);
  if (!p) fail(404, "Coleta não encontrada.");
  if (p.status !== "agendada") fail(409, "Esta coleta já foi encerrada ou cancelada.");
  const b = await c.req.json();
  const base = { ...p, resolvedAt: Date.now(), operator: op.name, operatorId: op.id };
  let next: any;
  if (b.action === "nao_realizada") {
    const reason = clean(b.reason, 200);
    if (!reason) fail(400, "Informe o motivo.");
    next = { ...base, status: "nao_realizada", reason };
    await notify(p.citizenId, { kind: "coleta", tone: "bad", title: "Coleta não realizada", body: `Motivo: ${reason}. Você pode agendar um novo horário.`, goTo: "minhasColetas" });
  } else {
    const materials = await catalog("materials");
    const mat = materials.find((m: any) => m.key === b.materialKey);
    const kg = Number(b.kg);
    if (!mat) fail(400, "Material inválido.");
    if (!(kg > 0 && kg < 1000)) fail(400, "Peso inválido.");
    const drachs = Math.round(mat.rate * kg);
    next = { ...base, status: "realizada", materialKey: mat.key, kg, drachs };
    const citizen = (await kv.get(`profile:${p.citizenId}`)) as Profile | null;
    if (citizen)
      await kv.set(`profile:${citizen.id}`, { ...citizen, drachs: citizen.drachs + drachs, earned: citizen.earned + drachs, descartes: citizen.descartes + 1, materiais: citizen.materiais + 1 });
    await notify(p.citizenId, { kind: "coleta", tone: "ok", title: "Coleta realizada", body: `${String(kg).replace(".", ",")} kg de ${mat.label.toLowerCase()} coletados. +${drachs} Ecopontos.`, goTo: "historico" });
  }
  await kv.set(`pickup:${p.id}`, next);
  return c.json({ pickup: next });
});

// ---------------------------------------------------------------- gestor
const VALIDATE: Record<string, (items: any[]) => string | null> = {
  materials: (items) =>
    items.every((m) => typeof m.key === "string" && clean(m.label, 60) && Number(m.rate) > 0 && typeof m.active === "boolean") ? null : "Valores inválidos nos resíduos.",
  rewards: (items) =>
    items.every((r) => Number.isFinite(r.id) && clean(r.name, 120) && Number(r.cost) > 0 && Number(r.stock) >= 0 && typeof r.active === "boolean") ? null : "Valores inválidos nas recompensas.",
  partners: (items) =>
    items.every((p) => Number.isFinite(p.id) && clean(p.name, 120) && typeof p.active === "boolean") ? null : "Dados inválidos nos parceiros.",
};
app.put(`${P}/catalog/:name`, async (c) => {
  await requireRole(c, "gestor");
  const name = c.req.param("name");
  if (!(name in VALIDATE)) fail(404, "Catálogo inválido.");
  const { items } = await c.req.json();
  if (!Array.isArray(items)) fail(400, "Lista inválida.");
  const err = VALIDATE[name](items);
  if (err) fail(400, err);
  await kv.set(`catalog:${name}`, items);
  return c.json({ items });
});

app.post(`${P}/suggestions/:id/approve`, async (c) => {
  await requireRole(c, "gestor");
  const s = await kv.get(`suggestion:${c.req.param("id")}`);
  if (!s || s.status !== "pendente") fail(404, "Sugestão não encontrada ou já analisada.");
  const b = await c.req.json();
  const address = clean(b.address, 300), hours = clean(b.hours, 80);
  const materials = Array.isArray(b.materials) ? b.materials.map((m: unknown) => clean(m, 40)).filter(Boolean) : [];
  const lat = Number(b.coords?.lat), lng = Number(b.coords?.lng);
  if (!address || !hours || materials.length === 0) fail(400, "Informe endereço, materiais e horário.");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) fail(400, "Posição no mapa inválida.");
  const locations = await catalog("locations");
  locations.push({ id: newId(), name: s.name, address, materials, hours, open: true, lat, lng, x: 15 + Math.round(Math.random() * 70), y: 15 + Math.round(Math.random() * 65) });
  await kv.set("catalog:locations", locations);
  await kv.set(`suggestion:${s.id}`, { ...s, address, materials, status: "aprovada", decidedAt: Date.now() });
  await notify(s.citizenId, { kind: "sugestao", tone: "ok", title: "Sugestão aprovada", body: `${s.name} agora aparece no mapa de ecolocalizações. Obrigado por contribuir!`, goTo: "ecopontos" });
  return c.json({ ok: true });
});

app.post(`${P}/suggestions/:id/reject`, async (c) => {
  await requireRole(c, "gestor");
  const s = await kv.get(`suggestion:${c.req.param("id")}`);
  if (!s || s.status !== "pendente") fail(404, "Sugestão não encontrada ou já analisada.");
  const reason = clean((await c.req.json()).reason, 300);
  if (!reason) fail(400, "Informe o motivo.");
  await kv.set(`suggestion:${s.id}`, { ...s, status: "rejeitada", reason, decidedAt: Date.now() });
  await notify(s.citizenId, { kind: "sugestao", tone: "bad", title: "Sugestão não aprovada", body: `${s.name}: ${reason}.`, goTo: "ecopontos" });
  return c.json({ ok: true });
});

const inviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O e 1/I
  const rnd = crypto.getRandomValues(new Uint8Array(4));
  return "ECO-" + Array.from(rnd, (n) => chars[n % chars.length]).join("");
};

app.post(`${P}/staff/invite`, async (c) => {
  await requireRole(c, "gestor");
  const b = await c.req.json();
  const email = clean(b.email, 120).toLowerCase();
  const role = b.role === "gestor" ? "gestor" : "operador";
  if (!EMAIL_RE.test(email)) fail(400, "Informe um e-mail válido");
  const [staff, profiles] = await Promise.all([all("staff:"), all("profile:")]);
  if (staff.some((s) => s.email === email) || profiles.some((p: Profile) => p.email === email)) fail(409, "Esse e-mail já faz parte da equipe, tem convite pendente ou já tem conta");
  const id = newId();
  const m = { id, name: "", email, role, status: "pendente", code: inviteCode(), invitedAt: Date.now() };
  await kv.set(`staff:${id}`, m);
  return c.json({ member: m });
});

app.post(`${P}/staff/:id/resend`, async (c) => {
  await requireRole(c, "gestor");
  const m = await kv.get(`staff:${c.req.param("id")}`);
  if (!m || m.status !== "pendente") fail(404, "Convite não encontrado.");
  const next = { ...m, code: inviteCode(), invitedAt: Date.now() };
  await kv.set(`staff:${m.id}`, next);
  return c.json({ member: next });
});

app.delete(`${P}/staff/:id`, async (c) => {
  await requireRole(c, "gestor");
  const m = await kv.get(`staff:${c.req.param("id")}`);
  if (!m || m.status !== "pendente") fail(404, "Só convites pendentes podem ser revogados.");
  await kv.del(`staff:${m.id}`);
  return c.json({ ok: true });
});

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as any);
  console.log("Erro inesperado:", err);
  return c.json({ error: "Erro inesperado no servidor. Tente novamente." }, 500);
});

Deno.serve(app.fetch);
