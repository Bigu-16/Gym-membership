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
import AppHeader from './components/layout/AppHeader';
import { useGymData } from './hooks/useGymData';
import { apiService } from './services/api';

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');

  const {
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    members,
    sessions,
    setSessions,
    inClubList,
    setInClubList,
    scheduleTemplates,
    loading,
    error,
    notificationJobs,
    setNotificationJobs,
    selectedMember,
    setSelectedMember,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    loadData,
    handleLogout,
    handleEnroll,
    handleAddTemplate,
    handleDeleteTemplate,
    handleUpdateTemplate,
    handleUpdateSessionStatus,
    handleUpdateMember,
    handleRenewMember,
    handleDeleteMember,
    processedMembers
  } = useGymData();

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

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
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
            <button 
              type="button"
              onClick={loadData} 
              className="px-3 py-1 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-[10px] uppercase tracking-luxury hover:opacity-80"
            >
              Retry Sync
            </button>
          </div>
        )}

        <AppHeader 
          activeTab={activeTab}
          theme={theme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
          currentUser={currentUser}
          totalMembersCount={members.length}
          activeNowCount={inClubList.length}
        />

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
                    onRenewMember={handleRenewMember}
                    scheduleTemplates={scheduleTemplates}
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
                            type="button"
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
                            type="button"
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
