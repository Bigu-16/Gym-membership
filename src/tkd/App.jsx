import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, Languages, LogOut, Menu, Search, WifiOff, X } from 'lucide-react';
import clsx from 'clsx';
import { api, session } from './lib/api';
import { AppContext } from './lib/appContext';
import { forceNavigate, setNavigationGuard, shouldHold, useRoute } from './lib/router';
import { hasUnsavedWork } from './lib/unsaved';
import { useOnline } from './lib/useOnline';
import { NAV, helpKeyFor, isActive } from './lib/nav';
import { reopenForAccount } from '../appKind';
import { useI18n } from './i18n/context';
import { Button, ConfirmDialog, Dialog, Loading } from './ui/kit';
import ErrorBoundary from './ui/ErrorBoundary';
import CommandPalette from './ui/CommandPalette';
import HelpDialog from './ui/HelpDialog';
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

const IDLE_MINUTES = 60;
const WARN_MINUTES = 2;
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

const typingIn = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

function LanguageToggle({ compact = false }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'en' ? 'am' : 'en';
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      lang={next}
      aria-label={t('app.switchLanguage')}
      className={clsx(
        'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-semibold text-brand transition-colors hover:bg-tint',
      )}
    >
      <Languages className="h-5 w-5" aria-hidden="true" />
      <span className={clsx(compact && 'sr-only sm:not-sr-only')}>{next === 'am' ? 'አማርኛ' : 'English'}</span>
    </button>
  );
}

function NavLinks({ current, onPick }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      {['daily', 'manage'].map((group, gi) => (
        <ul key={group} aria-label={t(`nav.group.${group}`)} className={clsx('flex flex-col gap-0.5', gi > 0 && 'border-t border-line-soft pt-3')}>
          {NAV.filter((n) => n.group === group).map((item) => {
            const active = isActive(item.path, current);
            return (
              <li key={item.path}>
                <a
                  href={`#${item.path}`}
                  onClick={onPick}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-semibold transition-colors',
                    active ? 'bg-tint text-brand' : 'text-muted hover:bg-page hover:text-ink',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {t(item.key)}
                </a>
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}

function UserCard({ user, onSignOut }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 border-t border-line-soft pt-3">
      <div className="min-w-0 flex-1 px-1">
        <p className="truncate font-semibold text-ink">{user.full_name}</p>
        <p className="truncate text-[0.9rem] text-muted">{t(user.role === 'admin' ? 'settings.roleAdmin' : 'settings.roleStaff')}</p>
      </div>
      <button type="button" onClick={onSignOut} aria-label={t('app.signOut')} title={t('app.signOut')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-tint hover:text-ink">
        <LogOut className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function App() {
  const { t, lang } = useI18n();
  const route = useRoute();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(session.token));
  const [club, setClub] = useState(null);
  const [slots, setSlots] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leaving, setLeaving] = useState(null); // where to go once the user agrees to drop unsaved work
  const lastActivity = useRef(0);
  const online = useOnline();

  const signOut = useCallback(() => {
    session.setToken(null);
    setUser(null);
    setClub(null);
    setIdleWarning(false);
  }, []);

  useEffect(() => { session.onUnauthenticated(signOut); }, [signOut]);

  const start = useCallback(async () => {
    try {
      const me = await api.me();
      // A gym-app account opens the gym app instead.
      if (me.club_kind !== 'taekwondo') { reopenForAccount(); return; }
      const [current, slotList] = await Promise.all([api.club(), api.slots()]);
      setUser(me);
      setClub(current);
      setSlots(slotList);
    } catch {
      signOut();
    } finally {
      setBooting(false);
    }
  }, [signOut]);

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
    const [current, slotList] = await Promise.all([api.club(), api.slots()]);
    setClub(current);
    setSlots(slotList);
  }, [club]);

  // Leaving a page with unsaved work asks first (user control / error prevention).
  useEffect(() => {
    setNavigationGuard((href) => {
      if (!hasUnsavedWork()) return false;
      setLeaving(href);
      return true;
    });
    const onClick = (event) => {
      const link = event.target.closest?.('a[href^="#/"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (shouldHold(link.getAttribute('href'))) event.preventDefault();
    };
    document.addEventListener('click', onClick, true);
    return () => { setNavigationGuard(null); document.removeEventListener('click', onClick, true); };
  }, []);

  // Shortcuts for daily users: Ctrl/⌘+K or "/" opens search, "?" opens help.
  useEffect(() => {
    if (!user) return undefined;
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (typingIn(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === '/') { event.preventDefault(); setSearchOpen(true); }
      else if (event.key === '?') { event.preventDefault(); setHelpOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  const context = useMemo(() => ({
    user,
    club,
    slots,
    activeSlots: slots.filter((s) => s.is_active),
    slotById: Object.fromEntries(slots.map((s) => [s.id, s])),
    isAdmin: user?.role === 'admin',
    refreshClub,
  }), [user, club, slots, refreshClub]);

  if (booting) return <Loading />;
  if (!user) return <Login onSignedIn={() => { setBooting(true); start(); }} />;

  if (!club) return <Loading />;

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
  const pageKey = helpKeyFor(path);
  const searchLabel = `${isMac ? '⌘' : 'Ctrl'} K`;

  return (
    <AppContext.Provider value={context}>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('app.skipToContent')}
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="no-print hidden border-r border-line-soft bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6 lg:p-4">
          <div className="flex items-center gap-3 px-2 pt-1">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight text-ink">{t('app.name')}</p>
              {branchName !== t('app.name') ? <p className="truncate text-[0.9rem] text-muted">{branchName}</p> : null}
            </div>
          </div>
          <nav aria-label={t('app.mainMenu')} className="-mx-1 flex-1 overflow-y-auto px-1"><NavLinks current={path} /></nav>
          <UserCard user={user} onSignOut={signOut} />
        </aside>

        <div className="flex min-w-0 flex-col">
          {!online ? (
            <div role="status" className="no-print sticky top-0 z-40 flex items-center justify-center gap-2 bg-warn-soft px-4 py-2 font-semibold text-warn">
              <WifiOff className="h-5 w-5 shrink-0" aria-hidden="true" /> {t('app.offline')}
            </div>
          ) : null}

          {/* Top bar: search, help and language are always in the same place */}
          <header className="no-print sticky top-0 z-30 border-b border-line-soft bg-white">
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-6 lg:px-10">
              <button type="button" onClick={() => setMenuOpen(true)} aria-label={t('app.openMenu')} aria-expanded={menuOpen}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-tint lg:hidden">
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <p className="min-w-0 flex-1 truncate font-bold text-ink lg:hidden">{branchName}</p>
              <button type="button" onClick={() => setSearchOpen(true)} aria-label={t('search.title')} aria-keyshortcuts="Control+K Meta+K /"
                className="flex h-11 min-w-[2.75rem] items-center justify-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-tint hover:text-ink lg:flex-1 lg:justify-start lg:max-w-sm lg:border lg:border-line-soft">
                <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="hidden flex-1 truncate text-left lg:inline">{t('search.placeholder')}</span>
                <kbd className="hidden lg:inline">{searchLabel}</kbd>
              </button>
              <span className="hidden flex-1 lg:block" />
              <button type="button" onClick={() => setHelpOpen(true)} aria-label={t('help.title')} aria-keyshortcuts="?" title={t('help.title')}
                className="flex h-11 items-center justify-center gap-2 rounded-lg px-2.5 font-semibold text-brand hover:bg-tint">
                <CircleHelp className="h-5 w-5" aria-hidden="true" /><span className="hidden sm:inline">{t('help.short')}</span>
              </button>
              <LanguageToggle compact />
            </div>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-6 focus:outline-none sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
            <div className="mx-auto max-w-6xl">
              <ErrorBoundary resetKey={path}>{page}</ErrorBoundary>
            </div>
          </main>

          {/* Mobile bottom bar: the four daily jobs */}
          <nav aria-label={t('app.quickMenu')} className="no-print fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-1 border-t border-line-soft bg-white px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
            {NAV.filter((n) => n.mobile).map((item) => {
              const active = isActive(item.path, path);
              return (
                <a key={item.path} href={`#${item.path}`} aria-current={active ? 'page' : undefined}
                  className={clsx('flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-lg text-[0.85rem] font-semibold transition-colors', active ? 'text-brand' : 'text-muted hover:text-ink')}>
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
        <div className="anim-fade fixed inset-0 z-40 bg-[rgba(15,23,42,0.5)] lg:hidden" onClick={() => setMenuOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={t('app.mainMenu')} onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') setMenuOpen(false); }}
            className="anim-slide flex h-full w-[85%] max-w-xs flex-col gap-5 overflow-y-auto bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/logo.svg" alt="" className="h-9 w-9 shrink-0" />
                <p className="truncate font-bold text-ink">{t('app.name')}</p>
              </div>
              <button type="button" autoFocus onClick={() => setMenuOpen(false)} aria-label={t('common.close')}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-tint">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label={t('app.mainMenu')}><NavLinks current={path} onPick={() => setMenuOpen(false)} /></nav>
            <button type="button" onClick={() => { setMenuOpen(false); setHelpOpen(true); }}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-semibold text-muted hover:bg-page hover:text-ink">
              <CircleHelp className="h-5 w-5" aria-hidden="true" /> {t('help.title')}
            </button>
            <div className="mt-auto"><UserCard user={user} onSignOut={signOut} /></div>
          </div>
        </div>
      ) : null}

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} page={pageKey} />

      <ConfirmDialog
        open={Boolean(leaving)}
        title={t('app.leaveTitle')}
        confirmLabel={t('app.leaveConfirm')}
        onClose={() => setLeaving(null)}
        onConfirm={() => { const to = leaving; setLeaving(null); forceNavigate(to); }}
      >
        <p>{t('app.leaveText')}</p>
      </ConfirmDialog>

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
