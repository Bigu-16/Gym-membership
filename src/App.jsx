import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, CalendarCheck, Home, Languages, LogOut, Menu, Settings as SettingsIcon, Shirt, UserPlus, Users, Wallet, X,
} from 'lucide-react';
import clsx from 'clsx';
import { api, session } from './lib/api';
import { AppContext } from './lib/appContext';
import { navigate, useRoute } from './lib/router';
import { useI18n } from './i18n/context';
import { Button, Dialog, Loading, Select } from './ui/kit';
import ErrorBoundary from './ui/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Family from './pages/Family';
import Enrol from './pages/Enrol';
import Attendance from './pages/Attendance';
import Uniforms from './pages/Uniforms';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const NAV = [
  { path: '/', key: 'nav.dashboard', icon: Home, mobile: true },
  { path: '/students', key: 'nav.students', icon: Users, mobile: true },
  { path: '/enrol', key: 'nav.enrol', icon: UserPlus, mobile: true },
  { path: '/attendance', key: 'nav.attendance', icon: CalendarCheck, mobile: true },
  { path: '/uniforms', key: 'nav.uniforms', icon: Shirt },
  { path: '/payments', key: 'nav.payments', icon: Wallet },
  { path: '/reports', key: 'nav.reports', icon: BarChart3 },
  { path: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

const IDLE_MINUTES = 60;
const WARN_MINUTES = 2;

function LanguageToggle({ onNavy = false }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'en' ? 'am' : 'en';
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      lang={next}
      aria-label={t('app.switchLanguage')}
      className={clsx(
        'inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 px-3 font-semibold',
        onNavy ? 'border-[#b9c4d9] text-white hover:bg-white/10' : 'border-brand text-brand hover:bg-tint',
      )}
    >
      <Languages className="h-5 w-5" aria-hidden="true" />
      {next === 'am' ? 'አማርኛ' : 'English'}
    </button>
  );
}

function NavLinks({ current, onPick }) {
  const { t } = useI18n();
  return (
    <ul className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.path === '/' ? current === '/' : current.startsWith(item.path) || (item.path === '/students' && current.startsWith('/family'));
        return (
          <li key={item.path}>
            <a
              href={`#${item.path}`}
              onClick={onPick}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex min-h-[48px] items-center gap-3 rounded-lg px-3 font-semibold',
                active ? 'bg-white text-navy' : 'text-[#e9eef7] hover:bg-white/10',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t(item.key)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function BranchPicker({ clubs, club, onChange, onNavy }) {
  const { t, lang } = useI18n();
  if (!club) return null;
  const name = (c) => (lang === 'am' && c.name_am ? c.name_am : c.name);
  if (clubs.length <= 1) {
    return <p className={clsx('font-semibold', onNavy ? 'text-[#e9eef7]' : 'text-ink')}>{name(club)}</p>;
  }
  return (
    <label className="flex flex-col gap-1">
      <span className={clsx('text-[0.9rem] font-semibold', onNavy ? 'text-[#b9c4d9]' : 'text-muted')}>{t('app.branch')}</span>
      <Select value={club.id} onChange={(e) => onChange(Number(e.target.value))} className="min-h-[44px]">
        {clubs.map((c) => <option key={c.id} value={c.id}>{name(c)}{c.is_active ? '' : ` (${t('settings.closed')})`}</option>)}
      </Select>
    </label>
  );
}

export default function App() {
  const { t, lang } = useI18n();
  const route = useRoute();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(session.token));
  const [clubs, setClubs] = useState([]);
  const [club, setClub] = useState(null);
  const [slots, setSlots] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const lastActivity = useRef(0);

  const signOut = useCallback(() => {
    session.setToken(null);
    setUser(null);
    setClub(null);
    setClubs([]);
    setIdleWarning(false);
  }, []);

  useEffect(() => { session.onUnauthenticated(signOut); }, [signOut]);

  const loadBranch = useCallback(async (clubId) => {
    session.setClubId(clubId);
    const [current, slotList] = await Promise.all([api.club(), api.slots()]);
    setClub(current);
    setSlots(slotList);
  }, []);

  const start = useCallback(async () => {
    try {
      const me = await api.me();
      const list = await api.clubs();
      setUser(me);
      setClubs(list);
      const preferred = me.role === 'admin'
        ? (list.find((c) => c.id === session.clubId && c.is_active) || list.find((c) => c.is_active) || list[0])
        : list[0];
      if (preferred) await loadBranch(preferred.id);
    } catch {
      signOut();
    } finally {
      setBooting(false);
    }
  }, [loadBranch, signOut]);

  useEffect(() => {
    // Restoring a saved login fetches from the server; state updates happen after the awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session.token) start();
  }, [start]);

  // Sign out after an hour without activity (shared desk computers), with a warning first.
  useEffect(() => {
    if (!user) return undefined;
    lastActivity.current = Date.now();
    const touch = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(() => {
      const idle = (Date.now() - lastActivity.current) / 60000;
      if (idle >= IDLE_MINUTES) signOut();
      else if (idle >= IDLE_MINUTES - WARN_MINUTES) setIdleWarning(true);
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [user, signOut]);

  const refreshClub = useCallback(async () => {
    if (!club) return;
    const [current, slotList, list] = await Promise.all([api.club(), api.slots(), api.clubs()]);
    setClub(current);
    setSlots(slotList);
    setClubs(list);
  }, [club]);

  const switchBranch = useCallback(async (id) => {
    await loadBranch(id);
    navigate('/');
  }, [loadBranch]);

  const context = useMemo(() => ({
    user,
    club,
    clubs,
    slots,
    activeSlots: slots.filter((s) => s.is_active),
    slotById: Object.fromEntries(slots.map((s) => [s.id, s])),
    isOwner: user?.role === 'admin',
    refreshClub,
    switchBranch,
    setClubs,
  }), [user, club, clubs, slots, refreshClub, switchBranch]);

  if (booting) return <Loading />;
  if (!user) return <Login onSignedIn={() => { setBooting(true); start(); }} />;

  if (!club) {
    return (
      <AppContext.Provider value={context}>
        <main className="mx-auto max-w-3xl p-6">
          <Settings firstRun />
        </main>
      </AppContext.Provider>
    );
  }

  const { path, params } = route;
  let page;
  if (path === '/') page = <Dashboard />;
  else if (path === '/students') page = <Students params={params} />;
  else if (path.startsWith('/family/')) page = <Family id={Number(path.split('/')[2])} />;
  else if (path === '/enrol') page = <Enrol params={params} />;
  else if (path === '/attendance') page = <Attendance params={params} />;
  else if (path === '/uniforms') page = <Uniforms params={params} />;
  else if (path === '/payments') page = <Payments />;
  else if (path === '/reports') page = <Reports />;
  else if (path === '/settings') page = <Settings />;
  else page = <Dashboard />;

  const branchName = lang === 'am' && club.name_am ? club.name_am : club.name;

  return (
    <AppContext.Provider value={context}>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('app.skipToContent')}
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="on-navy no-print hidden bg-navy lg:flex lg:flex-col lg:gap-6 lg:p-4 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3 px-2 pt-2">
            <img src="/logo.svg" alt="" className="h-10 w-10" />
            <p className="text-lg font-bold leading-tight text-white">{t('app.name')}</p>
          </div>
          <div className="px-2"><BranchPicker clubs={clubs} club={club} onChange={switchBranch} onNavy /></div>
          <nav aria-label={t('app.mainMenu')} className="flex-1 overflow-y-auto"><NavLinks current={path} /></nav>
          <div className="flex flex-col gap-2 border-t border-white/20 pt-4">
            <LanguageToggle onNavy />
            <p className="truncate px-1 text-[0.95rem] text-[#b9c4d9]">{user.full_name}</p>
            <button type="button" onClick={signOut} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-semibold text-white hover:bg-white/10">
              <LogOut className="h-5 w-5" aria-hidden="true" /> {t('app.signOut')}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Mobile top bar */}
          <header className="on-navy no-print sticky top-0 z-30 flex items-center gap-2 bg-navy px-3 py-2 lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t('app.openMenu')} aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10">
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="flex-1 truncate font-bold text-white">{branchName}</p>
            <LanguageToggle onNavy />
          </header>

          <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8 focus:outline-none">
            <div className="mx-auto max-w-6xl">
              <ErrorBoundary resetKey={path}>{page}</ErrorBoundary>
            </div>
          </main>

          {/* Mobile bottom bar: the four daily jobs */}
          <nav aria-label={t('app.quickMenu')} className="no-print fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t-2 border-line-soft bg-white lg:hidden">
            {NAV.filter((n) => n.mobile).map((item) => {
              const active = item.path === '/' ? path === '/' : path.startsWith(item.path);
              return (
                <a key={item.path} href={`#${item.path}`} aria-current={active ? 'page' : undefined}
                  className={clsx('flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[0.85rem] font-semibold', active ? 'text-brand bg-tint' : 'text-muted')}>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  {t(item.key)}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile full menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-[rgba(17,24,39,0.6)] lg:hidden" onClick={() => setMenuOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={t('app.mainMenu')} onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') setMenuOpen(false); }}
            className="on-navy flex h-full w-[85%] max-w-xs flex-col gap-4 overflow-y-auto bg-navy p-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-white">{t('app.name')}</p>
              <button type="button" autoFocus onClick={() => setMenuOpen(false)} aria-label={t('common.close')}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <BranchPicker clubs={clubs} club={club} onChange={(id) => { setMenuOpen(false); switchBranch(id); }} onNavy />
            <nav aria-label={t('app.mainMenu')}><NavLinks current={path} onPick={() => setMenuOpen(false)} /></nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-white/20 pt-4">
              <p className="truncate text-[#b9c4d9]">{user.full_name}</p>
              <button type="button" onClick={signOut} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-semibold text-white hover:bg-white/10">
                <LogOut className="h-5 w-5" aria-hidden="true" /> {t('app.signOut')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={idleWarning}
        title={t('app.idleTitle')}
        onClose={() => { lastActivity.current = Date.now(); setIdleWarning(false); }}
        footer={(
          <>
            <Button variant="secondary" onClick={signOut}>{t('app.signOut')}</Button>
            <Button data-autofocus onClick={() => { lastActivity.current = Date.now(); setIdleWarning(false); }}>{t('app.stayIn')}</Button>
          </>
        )}
      >
        <p>{t('app.idleText', { n: WARN_MINUTES })}</p>
      </Dialog>
    </AppContext.Provider>
  );
}
