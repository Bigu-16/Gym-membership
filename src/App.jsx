import React, { useState, useEffect } from 'react';
import MemberGrid from './components/MemberGrid';

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [members] = useState([
    {
      id: 1,
      name: 'Alexander Rossi',
      plan: 'Elite Performance',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
      image: '/members/member1.png'
    },
    {
      id: 2,
      name: 'Elena Vance',
      plan: 'Wellness Pro',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
      image: '/members/member2.png'
    },
    {
      id: 3,
      name: 'Marcus Thorne',
      plan: 'Diamond Access',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      image: '/members/member3.png'
    },
    {
      id: 4,
      name: 'Sophia Chen',
      plan: 'Elite Performance',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
      image: '/members/member1.png'
    },
    {
      id: 5,
      name: 'Julian Drax',
      plan: 'Wellness Pro',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString(),
      image: '/members/member2.png'
    },
    {
      id: 6,
      name: 'Isabella Saint',
      plan: 'Diamond Access',
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      image: '/members/member3.png'
    }
  ]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen p-8 md:p-16 text-[var(--text-primary)]">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-light tracking-luxury uppercase mb-0">
              Trainer <span className="font-bold">Dashboard</span>
            </h1>
            <button 
              onClick={toggleTheme}
              className="glass-card p-3 rounded-full hover:scale-110 transition-transform active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[var(--text-secondary)] text-sm tracking-wide uppercase">
            Managing <span className="text-[var(--text-primary)] opacity-60">Luxe Wellness Collective</span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Total Members</span>
            <span className="text-2xl font-semibold">{members.length}</span>
          </div>
          <div className="glass-card px-6 py-3">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Active Now</span>
            <span className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">12</span>
          </div>
        </div>
      </header>

      <main>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold">Member Directory</h2>
          <div className="h-[1px] flex-grow bg-[var(--glass-border)]"></div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold">All</button>
            <button className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] transition-all">Expiring</button>
          </div>
        </div>
        
        <MemberGrid members={members} />
      </main>
      
      <footer className="mt-16 pt-8 border-t border-[var(--glass-border)] flex justify-between text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
        <span>© 2026 Antigravity Wellness Systems</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Security</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
