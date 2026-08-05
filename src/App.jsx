import React, { useState, useEffect } from 'react';
import MemberGrid from './components/MemberGrid';
import MemberDetails from './components/MemberDetails';
import Sidebar from './components/Sidebar';
import EnrollmentForm from './components/EnrollmentForm';
import Schedule from './components/Schedule';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Notifications from './components/Notifications';
import { apiService } from './services/api';


const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('gym_api_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' or 'expiring'

  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [inClubList, setInClubList] = useState([]);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationJobs, setNotificationJobs] = useState([]);

  // Fetch all data from backend
  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      // 0. Fetch logged in user profile
      const userProfile = await apiService.getMe();
      setCurrentUser(userProfile);

      // 1. Fetch templates
      const templatesData = await apiService.getTemplates();
      setScheduleTemplates(templatesData);

      // 2. Fetch members
      const membersData = await apiService.getMembers();
      setMembers(membersData);
      setSelectedMember(prev => {
        if (!prev) return null;
        if (prev.isGroup) {
          const familyMembers = membersData.filter(m => m.parentPhone === prev.parentPhone);
          if (familyMembers.length === 0) return null;
          
          const firstName = familyMembers[0].name.split(' ')[0];
          const isFrozen = familyMembers.some(m => m.isFrozen);
          const expiryDate = familyMembers[0].expiryDate;
          
          return {
            isGroup: true,
            id: prev.parentPhone,
            parentName: prev.parentPhone,
            parentPhone: prev.parentPhone,
            trainees: familyMembers,
            name: `${firstName}'s Family`,
            plan: `Family Group (${familyMembers.length} Kids)`,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff`,
            expiryDate: expiryDate,
            isFrozen: isFrozen
          };
        } else {
          const fresh = membersData.find(m => m.id === prev.id);
          return fresh || null;
        }
      });

      // 3. Fetch enrollments to compute enrolled count for each template dynamically
      const enrollments = await apiService.getEnrollments();
      const templatesWithEnrolled = templatesData.map(t => ({
        ...t,
        enrolled: enrollments.filter(e => e.template_id === t.id).length
      }));
      setScheduleTemplates(templatesWithEnrolled);

      // 4. Fetch active check-ins for inClubList
      const activeCheckIns = await apiService.getActiveCheckIns();
      setInClubList(activeCheckIns.map(c => c.member_id));

      // 5. Fetch sessions
      const sessionsData = await apiService.getSessions(templatesData);
      setSessions(sessionsData);

      // 6. Fetch notification jobs
      const jobsData = await apiService.getNotificationJobs();
      setNotificationJobs(jobsData);
    } catch (err) {
      console.error(err);
      if (err.message === 'Unauthenticated' || err.message.includes('401')) {
        handleLogout();
      } else {
        setError('Error syncing with Azyab Backend. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMembers([]);
    setSessions([]);
    setInClubList([]);
    setScheduleTemplates([]);
    setNotificationJobs([]);
  };

  const handleEnroll = async (newMembers, newSessions) => {
    try {
      // 1. Enroll members to backend
      const enrolled = await apiService.enrollMembers(newMembers);
      
      // 2. For group training, enroll them into the selected template
      for (let i = 0; i < newMembers.length; i++) {
        const mem = newMembers[i];
        if (mem.trainingType === 'group' && mem.schedule?.slot) {
          const template = scheduleTemplates.find(t => {
            const slotText = `${t.className || 'General Class'}: ${t.days} @ ${t.time}`;
            return slotText === mem.schedule.slot;
          });
          if (template) {
            const backendMember = enrolled.find(em => em.phone === mem.phone);
            if (backendMember) {
              await apiService.enrollMemberInClass(backendMember.id, template.id);
            }
          }
        }
      }

      // 3. For sessions, if personal training, we create a session on backend
      for (const sess of newSessions) {
        if (sess.type === 'personal') {
          await apiService.createSession({
            start: sess.start,
            trainer: sess.trainer,
            status: sess.status,
            checklist: sess.checklist
          });
        }
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Enrollment failed: ' + err.message);
    }
  };

  const handleAddTemplate = async (newTemplate) => {
    try {
      await apiService.createTemplate(newTemplate);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create class template: ' + err.message);
    }
  };

  const handleDeleteTemplate = (id) => {
    // Local delete for templates (backend doesn't support delete)
    setScheduleTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTemplate = (updatedTemplate) => {
    // Local update for templates (backend doesn't support update)
    setScheduleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const handleUpdateSessionStatus = async (sessionId, newStatus) => {
    try {
      await apiService.updateSessionStatus(sessionId, newStatus);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update session status: ' + err.message);
    }
  };

  const handleUpdateMember = async (updatedMember) => {
    try {
      if (updatedMember.isGroup) {
        const enrolled = await apiService.freezeFamily(updatedMember.parentPhone, updatedMember.isFrozen);
        setMembers(prev => prev.map(m => {
          if (m.parentPhone === updatedMember.parentPhone) {
            const updatedTrainee = enrolled.find(t => t.id === m.id);
            return updatedTrainee || m;
          }
          return m;
        }));
        setSelectedMember(updatedMember);
      } else {
        const saved = await apiService.updateMember(updatedMember.id, updatedMember);
        await apiService.freezeMember(updatedMember.id, updatedMember.isFrozen);
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? saved : m));
        
        if (updatedMember.parentPhone) {
          setSelectedMember(prev => {
            if (prev && prev.isGroup && prev.parentPhone === updatedMember.parentPhone) {
              return prev; // keep the current family group selected
            }
            return saved;
          });
        } else {
          setSelectedMember(saved);
        }
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update member: ' + err.message);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await apiService.deleteMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setSelectedMember(null);
      await loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const calculateDaysRemaining = (date) => {
    if (!date) return 9999; // Standard high number for no expiry
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProcessedMembers = () => {
    const groups = new Map();
    const result = [];

    members.forEach(m => {
      if (m.parentPhone) {
        if (!groups.has(m.parentPhone)) {
          groups.set(m.parentPhone, {
            isGroup: true,
            id: m.parentPhone,
            parentName: m.parentPhone, // Use parent phone or phone if name is missing
            parentPhone: m.parentPhone,
            trainees: [m],
            name: `${m.name.split(' ')[0]}'s Family`,
            plan: 'Family Group',
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random&color=fff`,
            expiryDate: m.expiryDate,
            isFrozen: m.isFrozen
          });
        } else {
          const group = groups.get(m.parentPhone);
          group.trainees.push(m);
          if (m.isFrozen) group.isFrozen = true;
        }
      } else {
        result.push(m);
      }
    });

    groups.forEach(g => {
      g.plan = `Family Group (${g.trainees.length} Kids)`;
      result.push(g);
    });

    let filtered = result;

    if (filterType === 'expiring') {
      filtered = filtered.filter(item => {
        if (item.isGroup) {
          return item.trainees.some(t => {
            const days = calculateDaysRemaining(t.expiryDate);
            return days >= 0 && days < 7;
          });
        } else {
          const days = calculateDaysRemaining(item.expiryDate);
          return days >= 0 && days < 7;
        }
      });
    }

    if (!searchQuery) return filtered;
    
    const lowerQ = searchQuery.toLowerCase();
    return filtered.filter(item => {
      if (item.isGroup) {
        if (item.name.toLowerCase().includes(lowerQ) || item.parentPhone.includes(lowerQ)) return true;
        return item.trainees.some(t => t.name.toLowerCase().includes(lowerQ) || (t.phone && t.phone.toLowerCase().includes(lowerQ)));
      } else {
        return item.name.toLowerCase().includes(lowerQ) || (item.phone && item.phone.toLowerCase().includes(lowerQ));
      }
    });
  };

  const processedMembers = getProcessedMembers();

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 lg:gap-12 p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 text-[var(--text-primary)]">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedMember(null); }} />
      
      <div className="flex-grow max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={loadData} className="px-3 py-1 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-[10px] uppercase tracking-luxury hover:opacity-80">
              Retry Sync
            </button>
          </div>
        )}

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
              <div className="flex items-center gap-2">
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
                <button 
                  onClick={handleLogout}
                  className="glass-card p-2.5 sm:p-3 rounded-full hover:scale-110 hover:text-rose-400 transition-all active:scale-95 text-rose-500/80 border border-rose-500/10"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm tracking-wide uppercase">
              Managing <span className="text-[var(--text-primary)] opacity-60">Azyab Wellness Center</span>
              {currentUser && (
                <span className="block text-[10px] mt-1 normal-case text-emerald-500 font-medium">
                  Logged in as <span className="font-bold">{currentUser.full_name}</span> ({currentUser.role})
                </span>
              )}
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
          {loading && (
            <div className="flex justify-center items-center py-12">
              <span className="w-8 h-8 border-4 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'members' ? (
                selectedMember ? (
                  <MemberDetails 
                    member={selectedMember} 
                    onBack={() => setSelectedMember(null)} 
                    onUpdateMember={handleUpdateMember} 
                    onDeleteMember={handleDeleteMember}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold whitespace-nowrap">Live Member Stream</h2>
                      <div className="h-[1px] flex-grow bg-[var(--glass-border)] hidden md:block"></div>
                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                          <input 
                            type="text" 
                            placeholder="Search name or phone..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20 pl-8"
                          />
                          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury transition-all ${
                              filterType === 'all' 
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold' 
                                : 'glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                            }`}
                          >
                            All
                          </button>
                          <button 
                            onClick={() => setFilterType('expiring')}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury transition-all ${
                              filterType === 'expiring' 
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold' 
                                : 'glass-card border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                            }`}
                          >
                            Expiring
                          </button>
                        </div>
                      </div>
                    </div>
                    <MemberGrid members={processedMembers} onManage={setSelectedMember} />
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
                  onUpdateTemplate={handleUpdateTemplate}
                  onUpdateSessionStatus={handleUpdateSessionStatus}
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
                  onUpdateSessionStatus={handleUpdateSessionStatus}
                />
              ) : activeTab === 'analytics' ? (
                <Analytics members={members} scheduleTemplates={scheduleTemplates} />
              ) : activeTab === 'notifications' ? (
                <Notifications 
                  jobs={notificationJobs} 
                  members={members} 
                  onTriggerTask={async () => {
                    const jobsData = await apiService.getNotificationJobs();
                    setNotificationJobs(jobsData);
                  }}
                />
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
            </>
          )}
        </main>
        
        <footer className="mt-16 pt-8 border-t border-[var(--glass-border)] flex flex-wrap justify-between gap-6 text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
          <span>© 2026 Azyab Wellness Systems</span>
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
