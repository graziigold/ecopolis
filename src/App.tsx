import { useCallback, useEffect, useRef, useState } from 'react';
import type { Role, Screen, UserData } from './types';
import { decorateMaterial, decorateReward, stripMaterial, stripReward } from './data/catalog';
import type {
  Material, Reward, Partner, StaffMember, Delivery, EcoLocation, Suggestion, Pickup, Redemption, AppNotification,
  RawMaterial, RawReward, Ranking as RankingData, ManagerKpis,
} from './data/catalog';
import { api, authMessage, supabase } from './lib/supabase';
import MinhasColetas from './screens/MinhasColetas';
import EditarPerfil from './screens/EditarPerfil';
import GestaoSugestoes from './screens/GestaoSugestoes';
import OperadorColetas from './screens/OperadorColetas';
import Operador from './screens/Operador';
import GestaoParceiros from './screens/GestaoParceiros';
import GestaoEquipe from './screens/GestaoEquipe';
import AceitarConvite from './screens/AceitarConvite';
import PrimeiroGestor from './screens/PrimeiroGestor';
import Gestao from './screens/Gestao';
import GestaoResiduos from './screens/GestaoResiduos';
import GestaoRecompensas from './screens/GestaoRecompensas';
import Splash from './screens/Splash';
import Login from './screens/Login';
import Cadastro from './screens/Cadastro';
import Home from './screens/Home';
import Perfil from './screens/Perfil';
import Historico from './screens/Historico';
import Ecopontos from './screens/Ecopontos';
import Descarte from './screens/Descarte';
import Coleta from './screens/Coleta';
import Loja from './screens/Loja';
import Ranking from './screens/Ranking';
import Notificacoes from './screens/Notificacoes';
import RecuperarSenha from './screens/RecuperarSenha';
import RegistrarEcoponto from './screens/RegistrarEcoponto';

interface Bootstrap {
  profile: UserData;
  materials: RawMaterial[];
  rewards: RawReward[];
  partners: Partner[];
  locations: EcoLocation[];
  deliveries?: Delivery[];
  pickups?: Pickup[];
  redemptions?: Redemption[];
  notifications?: AppNotification[];
  ranking?: RankingData;
  suggestions?: Suggestion[];
  staff?: StaffMember[];
  kpis?: ManagerKpis;
}

interface Data {
  materials: Material[];
  rewards: Reward[];
  partners: Partner[];
  locations: EcoLocation[];
  deliveries: Delivery[];
  pickups: Pickup[];
  redemptions: Redemption[];
  notifications: AppNotification[];
  ranking: RankingData | null;
  suggestions: Suggestion[];
  staff: StaffMember[];
  kpis: ManagerKpis | null;
}

const EMPTY: Data = {
  materials: [], rewards: [], partners: [], locations: [], deliveries: [], pickups: [], redemptions: [],
  notifications: [], ranking: null, suggestions: [], staff: [], kpis: null,
};

const HOME: Record<Role, Screen> = { cidadao: 'home', gestor: 'gestao', operador: 'operador' };
const ROLE_NAME: Record<Role, string> = { cidadao: 'cidadão', gestor: 'gestor', operador: 'operador de ecolocalização' };
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.');

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<UserData | null>(null);
  const [data, setData] = useState<Data>(EMPTY);
  const [booting, setBooting] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const navigate = (s: Screen) => setScreen(s);
  const isManager = user?.role === 'gestor';
  const isCitizen = user?.role === 'cidadao';
  const isOperator = user?.role === 'operador';
  const hasUnread = data.notifications.some((n) => n.unread);

  const showToast = useCallback((text: string, tone: 'ok' | 'bad' = 'bad') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const apply = useCallback((b: Bootstrap) => {
    setUser(b.profile);
    setData({
      materials: b.materials.map(decorateMaterial),
      rewards: b.rewards.map(decorateReward),
      partners: b.partners,
      locations: b.locations,
      deliveries: b.deliveries ?? [],
      pickups: b.pickups ?? [],
      redemptions: b.redemptions ?? [],
      notifications: b.notifications ?? [],
      ranking: b.ranking ?? null,
      suggestions: b.suggestions ?? [],
      staff: b.staff ?? [],
      kpis: b.kpis ?? null,
    });
  }, []);

  const refresh = useCallback(async () => {
    const b = await api<Bootstrap>('/bootstrap');
    apply(b);
    return b.profile;
  }, [apply]);

  // Sessão salva no aparelho, link de convite e link de recuperação de senha.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('convite');
    if (code) {
      setInviteCode(code.toUpperCase());
      params.delete('convite');
      window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true);
        setScreen('recuperar');
      }
    });
    supabase.auth.getSession().then(async ({ data: s }) => {
      if (s.session && !window.location.hash.includes('type=recovery')) {
        try {
          await refresh();
        } catch {
          await supabase.auth.signOut();
        }
      }
      setBooting(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  // Depois do splash, vai para o lugar certo.
  useEffect(() => {
    if (!splashDone || booting || screen !== 'splash') return;
    if (recovering) setScreen('recuperar');
    else if (user) setScreen(HOME[user.role]);
    else setScreen(inviteCode ? 'aceitarConvite' : 'login');
  }, [splashDone, booting, screen, user, inviteCode, recovering]);

  // Atualiza os dados periodicamente (ex.: entrega confirmada pelo operador).
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh().catch(() => {});
    }, 20000);
    const onFocus = () => refresh().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, refresh]);

  /** Executa uma ação no servidor, atualiza os dados e avisa em caso de erro. */
  async function run<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    try {
      const r = await fn();
      await refresh().catch(() => {});
      if (success) showToast(success, 'ok');
      return r;
    } catch (e) {
      showToast(errMsg(e));
      return undefined;
    }
  }

  // ---------------------------------------------------------------- acesso
  async function signIn(email: string, password: string, role?: Role): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return authMessage(error.message);
    try {
      const profile = await refresh();
      if (role && profile.role !== role) {
        await supabase.auth.signOut();
        setUser(null);
        setData(EMPTY);
        return profile.role === 'cidadao'
          ? 'Esta é uma conta de cidadão. Use a aba Cidadão.'
          : `Esta conta é de ${ROLE_NAME[profile.role]}. Use a aba ${profile.role === 'gestor' ? 'Gestor' : 'Ecolocalização'}.`;
      }
      navigate(HOME[profile.role]);
      return null;
    } catch (e) {
      await supabase.auth.signOut();
      return errMsg(e);
    }
  }

  async function handleSignup(name: string, email: string, password: string): Promise<string | null> {
    try {
      await api('/signup', { body: { name, email, password } });
    } catch (e) {
      return errMsg(e);
    }
    return signIn(email, password);
  }

  async function handleSetup(name: string, email: string, password: string): Promise<string | null> {
    try {
      await api('/setup', { body: { name, email, password } });
    } catch (e) {
      return errMsg(e);
    }
    return signIn(email, password);
  }

  async function handleAcceptInvite(code: string, name: string, password: string): Promise<string | null> {
    try {
      const r = await api<{ email: string }>('/invite/accept', { body: { code, name, password } });
      setInviteCode('');
      return signIn(r.email, password);
    } catch (e) {
      return errMsg(e);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setData(EMPTY);
    navigate('login');
  }

  // ---------------------------------------------------------------- cidadão
  const handleRegister = async (materialKey: string, kg: number) =>
    (await run(() => api<{ delivery: Delivery }>('/deliveries', { body: { materialKey, kg } })))?.delivery.code ?? null;

  const handleSchedule = async (p: Pick<Pickup, 'type' | 'date' | 'slot' | 'address'>) =>
    !!(await run(() => api('/pickups', { body: p })));

  const handleCancelPickup = async (id: number) => !!(await run(() => api(`/pickups/${id}/cancel`, { body: {} }), 'Coleta cancelada.'));

  const handleRedeem = async (r: Reward) => !!(await run(() => api('/redeem', { body: { rewardId: r.id } })));

  const handleSuggest = async (s: Pick<Suggestion, 'name' | 'address' | 'materials' | 'obs'>) => !!(await run(() => api('/suggestions', { body: s })));

  function openNotification(n: AppNotification) {
    if (n.unread) {
      setData((d) => ({ ...d, notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, unread: false } : x)) }));
      api('/notifications/read', { body: { id: n.id } }).catch(() => {});
    }
    navigate(n.goTo);
  }

  function readAllNotifications() {
    setData((d) => ({ ...d, notifications: d.notifications.map((x) => ({ ...x, unread: false })) }));
    api('/notifications/read', { body: {} }).catch(() => {});
  }

  async function handleSaveProfile(patch: { name: string; phone?: string; sector?: string; photo?: string | null }): Promise<string | null> {
    try {
      await api('/me', { method: 'PUT', body: { name: patch.name, phone: patch.phone ?? '', sector: patch.sector ?? '' } });
      if (patch.photo === null) await api('/me/photo', { method: 'DELETE' });
      else if (patch.photo) await api('/me/photo', { body: { dataUrl: patch.photo } });
      await refresh();
      return null;
    } catch (e) {
      return errMsg(e);
    }
  }

  // ---------------------------------------------------------------- operador
  async function handleLookup(code: string): Promise<Delivery | string> {
    try {
      return (await api<{ delivery: Delivery }>('/deliveries/lookup', { body: { code } })).delivery;
    } catch (e) {
      return errMsg(e);
    }
  }

  const handleResolve = async (id: number, body: { action: 'confirmar' | 'recusar'; realMaterialKey?: string; realKg?: number; reason?: string }) =>
    (await run(() => api<{ delivery: Delivery }>(`/deliveries/${id}/resolve`, { body })))?.delivery ?? null;

  const handleResolvePickup = async (id: number, body: { action: 'realizada' | 'nao_realizada'; materialKey?: string; kg?: number; reason?: string }) =>
    (await run(() => api<{ pickup: Pickup }>(`/pickups/${id}/resolve`, { body })))?.pickup ?? null;

  // ---------------------------------------------------------------- gestor
  const saveCatalog = async (name: 'materials' | 'rewards' | 'partners', items: unknown[]) =>
    !!(await run(() => api(`/catalog/${name}`, { method: 'PUT', body: { items } })));

  const handleApprove = async (s: Suggestion, edits: { address: string; materials: string[]; hours: string; coords?: { lat: number; lng: number } }) =>
    !!(await run(() => api(`/suggestions/${s.id}/approve`, { body: edits })));

  const handleReject = async (s: Suggestion, reason: string) => !!(await run(() => api(`/suggestions/${s.id}/reject`, { body: { reason } })));

  async function handleInvite(email: string, role: 'gestor' | 'operador'): Promise<StaffMember | string> {
    try {
      const r = await api<{ member: StaffMember }>('/staff/invite', { body: { email, role } });
      await refresh().catch(() => {});
      return r.member;
    } catch (e) {
      return errMsg(e);
    }
  }
  const handleResend = async (id: number) => (await run(() => api<{ member: StaffMember }>(`/staff/${id}/resend`, { body: {} })))?.member ?? null;
  const handleRevoke = async (id: number) => !!(await run(() => api(`/staff/${id}`, { method: 'DELETE' }), 'Convite revogado.'));

  // ---------------------------------------------------------------- telas
  const { materials, rewards, partners, locations, deliveries, pickups, redemptions, notifications, ranking, suggestions, staff, kpis } = data;

  return (
    <div className="h-full">
      {screen === 'splash' && <Splash onFinish={() => setSplashDone(true)} />}
      {screen === 'login' && (
        <Login
          onLogin={signIn}
          onCadastro={() => navigate('cadastro')}
          onRecuperar={() => navigate('recuperar')}
          onConvite={() => navigate('aceitarConvite')}
          onSetup={() => navigate('primeiroGestor')}
        />
      )}
      {screen === 'recuperar' && (
        <RecuperarSenha
          recovering={recovering}
          onBack={() => { setRecovering(false); navigate('login'); }}
          onDone={async () => { setRecovering(false); await supabase.auth.signOut(); setUser(null); navigate('login'); }}
        />
      )}
      {screen === 'cadastro' && <Cadastro onSubmit={handleSignup} onBack={() => navigate('login')} />}
      {screen === 'primeiroGestor' && <PrimeiroGestor onSubmit={handleSetup} onBack={() => navigate('login')} />}
      {screen === 'aceitarConvite' && (
        <AceitarConvite initialCode={inviteCode} onAccept={handleAcceptInvite} onBack={() => navigate('login')} />
      )}

      {screen === 'home' && user && isCitizen && (
        <Home user={user} navigate={navigate} hasUnread={hasUnread} onOpenNotifications={() => navigate('notificacoes')}
          deliveries={deliveries} pickups={pickups} redemptions={redemptions} materials={materials} ranking={ranking} />
      )}
      {screen === 'perfil' && user && isCitizen && <Perfil user={user} navigate={navigate} onLogout={handleLogout} />}
      {screen === 'editarPerfil' && user && isCitizen && <EditarPerfil user={user} navigate={navigate} onSave={handleSaveProfile} />}
      {screen === 'historico' && user && isCitizen && (
        <Historico user={user} navigate={navigate} deliveries={deliveries} pickups={pickups} redemptions={redemptions} materials={materials} />
      )}
      {screen === 'ecopontos' && user && isCitizen && <Ecopontos user={user} navigate={navigate} locations={locations} />}
      {screen === 'registrarEcoponto' && user && isCitizen && <RegistrarEcoponto user={user} navigate={navigate} onSubmit={handleSuggest} />}
      {screen === 'descarte' && user && isCitizen && <Descarte user={user} navigate={navigate} onRegister={handleRegister} materials={materials} />}
      {screen === 'coleta' && user && isCitizen && <Coleta user={user} navigate={navigate} onSchedule={handleSchedule} />}
      {screen === 'minhasColetas' && user && isCitizen && <MinhasColetas user={user} navigate={navigate} pickups={pickups} onCancel={handleCancelPickup} />}
      {screen === 'loja' && user && isCitizen && <Loja user={user} navigate={navigate} onRedeem={handleRedeem} rewards={rewards} partners={partners} />}
      {screen === 'ranking' && user && isCitizen && <Ranking user={user} navigate={navigate} ranking={ranking} />}
      {screen === 'notificacoes' && user && isCitizen && (
        <Notificacoes user={user} navigate={navigate} items={notifications} onOpen={openNotification} onReadAll={readAllNotifications} />
      )}

      {screen === 'gestao' && user && isManager && (
        <Gestao user={user} navigate={navigate} materials={materials} rewards={rewards} suggestions={suggestions} kpis={kpis} onLogout={handleLogout} />
      )}
      {screen === 'gestaoResiduos' && isManager && (
        <GestaoResiduos navigate={navigate} materials={materials} onSave={(m) => saveCatalog('materials', m.map(stripMaterial))} />
      )}
      {screen === 'gestaoRecompensas' && isManager && (
        <GestaoRecompensas navigate={navigate} rewards={rewards} partners={partners} onSave={(r) => saveCatalog('rewards', r.map(stripReward))} />
      )}
      {screen === 'gestaoParceiros' && isManager && (
        <GestaoParceiros navigate={navigate} partners={partners} rewards={rewards} onChange={(p) => saveCatalog('partners', p)} />
      )}
      {screen === 'gestaoEquipe' && isManager && (
        <GestaoEquipe navigate={navigate} staff={staff} onInvite={handleInvite} onResend={handleResend} onRevoke={handleRevoke} />
      )}
      {screen === 'gestaoSugestoes' && isManager && (
        <GestaoSugestoes navigate={navigate} suggestions={suggestions} locations={locations} onApprove={handleApprove} onReject={handleReject} />
      )}

      {screen === 'operador' && user && isOperator && (
        <Operador user={user} navigate={navigate} deliveries={deliveries} materials={materials} onLookup={handleLookup} onResolve={handleResolve} onLogout={handleLogout} />
      )}
      {screen === 'operadorColetas' && user && isOperator && (
        <OperadorColetas user={user} navigate={navigate} pickups={pickups} materials={materials} onResolve={handleResolvePickup} onLogout={handleLogout} />
      )}

      {toast && (
        <div role="status" aria-live="polite"
          className={`fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-6 z-[80] max-w-sm w-[calc(100%-2rem)] rounded-xl px-4 py-3 text-sm font-body shadow-lg ${toast.tone === 'ok' ? 'bg-eco-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
