import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { Spinner } from '../common/Feedback';

const TITLES = {
  dashboard: 'Overview',
  members: 'Members',
  enrollment: 'New registration',
  schedule: 'Schedule',
  packages: 'Packages',
  analytics: 'Analytics',
  notifications: 'Messages',
  activity: 'Activity log'
};

const iconButton = 'p-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors';

/** One slim row: page title on the left, theme / account / sign out on the right. */
const AppHeader = ({ activeTab, theme, toggleTheme, handleLogout, onOpenAccount, currentUser, refreshing = false }) => (
  <header className="mb-6 flex items-center justify-between gap-4">
    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{TITLES[activeTab] || 'N & T Center'}</h1>
    <div className="flex items-center gap-2">
      {refreshing && <Spinner label="Updating…" className="text-xs text-[var(--text-secondary)] mr-2" />}
      {currentUser && (
        <span className="hidden md:block text-xs text-[var(--text-secondary)] mr-2">
          {currentUser.full_name} · {currentUser.role}
        </span>
      )}
      <button type="button" onClick={toggleTheme} className={iconButton} aria-label="Toggle Theme" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button type="button" onClick={onOpenAccount} className={iconButton} aria-label="Account and password" title="Account and password">
        <UserRound size={18} />
      </button>
      <button type="button" onClick={handleLogout} className={iconButton} aria-label="Sign Out" title="Sign out">
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

export default AppHeader;
