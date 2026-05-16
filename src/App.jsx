import React, { useState, useEffect } from 'react';
import MemberGrid from './components/MemberGrid';
import MemberDetails from './components/MemberDetails';
import Sidebar from './components/Sidebar';
import EnrollmentForm from './components/EnrollmentForm';
import Schedule from './components/Schedule';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import { setHours, setMinutes, addDays } from 'date-fns';
import { GROUP_SCHEDULE_SLOTS } from './config/scheduleConfig';

const MOCK_SESSIONS = [
  {
    id: 1,
    title: 'Elite Performance',
    trainer: 'Marcus Thorne',
    location: 'Studio A - Main Floor',
    start: setMinutes(setHours(new Date(), 14), 0),
    end: setMinutes(setHours(new Date(), 15), 30),
    status: 'in-progress',
    type: 'group',
    checklist: [
      { id: 1, text: 'Warm-up completed', checked: true },
      { id: 2, text: 'High-intensity interval set', checked: false },
      { id: 3, text: 'Cool-down stretch', checked: false }
    ]
  },
  {
    id: 2,
    title: 'Personal Training',
    trainer: 'Elena Vance',
    location: 'VIP Zone - Sector 4',
    start: setMinutes(setHours(addDays(new Date(), 1), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 11), 30),
    status: 'upcoming',
    type: 'personal',
    checklist: [
      { id: 1, text: 'Posture assessment', checked: false },
      { id: 2, text: 'Strength baseline', checked: false }
    ]
  },
  {
    id: 3,
    title: 'Yoga Flow',
    trainer: 'Sophia Chen',
    location: 'Zen Garden',
    start: setMinutes(setHours(new Date(), 16), 30),
    end: setMinutes(setHours(new Date(), 18), 0),
    status: 'upcoming',
    type: 'group',
    checklist: []
  }
];

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([
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

  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [inClubList, setInClubList] = useState([1, 4]);

  const [scheduleTemplates, setScheduleTemplates] = useState(() => {
    const saved = localStorage.getItem('gym_schedule_templates');
    return saved ? JSON.parse(saved) : GROUP_SCHEDULE_SLOTS;
  });

  useEffect(() => {
    localStorage.setItem('gym_schedule_templates', JSON.stringify(scheduleTemplates));
  }, [scheduleTemplates]);

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

  const handleEnroll = (newMembers, newSessions) => {
    setMembers(prev => [...newMembers, ...prev]);
    if (newSessions && newSessions.length > 0) {
      setSessions(prev => [...newSessions, ...prev]);
    }

    // Update enrolled count for selected schedule templates
    newMembers.forEach(member => {
      if (member.trainingType === 'group' && member.schedule?.slot) {
        setScheduleTemplates(prev => prev.map(template => {
          const slotText = `${template.days} @ ${template.time}`;
          if (slotText === member.schedule.slot) {
            return {
              ...template,
              enrolled: Math.min(template.capacity, template.enrolled + 1)
            };
          }
          return template;
        }));
      }
    });
  };

  const handleAddTemplate = (newTemplate) => {
    setScheduleTemplates(prev => [
      ...prev,
      {
        id: Date.now(),
        ...newTemplate,
        enrolled: 0
      }
    ]);
  };

  const handleDeleteTemplate = (id) => {
    setScheduleTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateMember = (updatedMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setSelectedMember(updatedMember);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 lg:gap-12 p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 text-[var(--text-primary)]">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedMember(null); }} />
      
      <div className="flex-grow max-w-7xl mx-auto w-full">
        <header className="mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-4 mb-4 justify-between md:justify-start">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-luxury uppercase mb-0">
                {activeTab === 'dashboard' ? (
                  <>Club <span className="font-bold">Overview</span></>
                ) : activeTab === 'members' ? (
                  <>Member <span className="font-bold">Directory</span></>
                ) : activeTab === 'enrollment' ? (
                  <>New <span className="font-bold">Registration</span></>
                ) : activeTab === 'schedule' ? (
                  <>Training <span className="font-bold">Schedule</span></>
                ) : activeTab === 'analytics' ? (
                  <>Business <span className="font-bold">Analytics</span></>
                ) : (
                  <>{activeTab} <span className="font-bold">Panel</span></>
                )}
              </h1>
              <button 
                onClick={toggleTheme}
                className="glass-card p-2.5 sm:p-3 rounded-full hover:scale-110 transition-transform active:scale-95"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm tracking-wide uppercase">
              Managing <span className="text-[var(--text-primary)] opacity-60">Luxe Wellness Collective</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
            <div className="glass-card px-4 py-2.5 sm:px-6 sm:py-3 text-center md:text-left">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Total Members</span>
              <span className="text-xl sm:text-2xl font-semibold">{members.length}</span>
            </div>
            <div className="glass-card px-4 py-2.5 sm:px-6 sm:py-3 text-center md:text-left">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Active Now</span>
              <span className="text-xl sm:text-2xl font-semibold text-emerald-500 dark:text-emerald-400">{inClubList.length}</span>
            </div>
          </div>
        </header>

        <main className="transition-all duration-500">
          {activeTab === 'members' ? (
            selectedMember ? (
              <MemberDetails 
                member={selectedMember} 
                onBack={() => setSelectedMember(null)} 
                onUpdateMember={handleUpdateMember} 
              />
            ) : (
              <>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold">Live Member Stream</h2>
                  <div className="h-[1px] flex-grow bg-[var(--glass-border)]"></div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold">All</button>
                    <button className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] transition-all">Expiring</button>
                  </div>
                </div>
                <MemberGrid members={members} onManage={setSelectedMember} />
              </>
            )
          ) : activeTab === 'enrollment' ? (
            <EnrollmentForm onEnroll={handleEnroll} scheduleTemplates={scheduleTemplates} />
          ) : activeTab === 'schedule' ? (
            <Schedule 
              sessions={sessions} 
              scheduleTemplates={scheduleTemplates}
              members={members}
              onAddTemplate={handleAddTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardOverview 
              members={members} 
              sessions={sessions} 
              setSessions={setSessions}
              scheduleTemplates={scheduleTemplates}
              onTabChange={(tab) => { setActiveTab(tab); setSelectedMember(null); }}
              inClubList={inClubList}
              setInClubList={setInClubList}
            />
          ) : activeTab === 'analytics' ? (
            <Analytics members={members} scheduleTemplates={scheduleTemplates} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] glass-card p-12 text-center">
              <div className="w-16 h-16 mb-6 rounded-full bg-[var(--glass-border)] flex items-center justify-center animate-pulse-soft">
                <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-light uppercase tracking-luxury mb-2">Module Initializing</h2>
              <p className="text-[var(--text-secondary)] text-sm max-w-md">
                The <span className="text-[var(--text-primary)] font-semibold uppercase">{activeTab}</span> interface is being optimized for your personalized trainer experience.
              </p>
            </div>
          )}
        </main>
        
        <footer className="mt-16 pt-8 border-t border-[var(--glass-border)] flex flex-wrap justify-between gap-6 text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
          <span>© 2026 Antigravity Wellness Systems</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Security</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">System Status</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

