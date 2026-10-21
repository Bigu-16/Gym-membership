import { useState, useEffect } from 'react';
import MemberGrid from './components/MemberGrid';
import MemberDetails from './components/MemberDetails';
import Sidebar from './components/Sidebar';
import EnrollmentForm from './components/EnrollmentForm';
import Schedule from './components/Schedule';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Notifications from './components/Notifications';
import PackagesPage from './components/PackagesPage';
import ActivityLog from './components/ActivityLog';
import ErrorBoundary from './components/common/ErrorBoundary';
import AccountModal from './components/layout/AccountModal';
import { Spinner } from './components/common/Feedback';
import AppHeader from './components/layout/AppHeader';
import { useGymData } from './hooks/useGymData';

// First load: say what is happening, and explain slow starts (the server may be waking up).
const InitialLoading = () => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-[var(--text-secondary)]">
      <Spinner label="Loading members, classes and packages…" className="text-[var(--text-primary)]" />
      {slow && <p className="text-sm max-w-sm">The server is waking up. The first load of the day can take up to a minute.</p>}
    </div>
  );
};

const App = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accountOpen, setAccountOpen] = useState(false);

  const {
    isAuthenticated,
    setIsAuthenticated,
    signOutNotice,
    currentUser,
    members,
    sessions,
    inClubList,
    scheduleTemplates,
    membershipPlans,
    loading,
    hasLoaded,
    error,
    notificationJobs,
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
    handleLoadOfficialTimetable,
    handleAddPlan,
    handleUpdatePlan,
    handleDeletePlan,
    handleLoadOfficialPackages,
    saveSession,
    checkIn,
    checkOut,
    refreshNotificationJobs,
    handleUpdateMember,
    handleRenewMember,
    handleDeleteMember,
    handleSetMemberClasses,
    processedMembers
  } = useGymData();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Theme preference is a convenience; ignore unavailable storage.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!isAuthenticated) {
    return <Login notice={signOutNotice} onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 lg:gap-10 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 text-[var(--text-primary)]">
      <Sidebar
        activeTab={activeTab}
        isAdmin={currentUser?.role === 'admin'}
        onTabChange={(tab) => { setActiveTab(tab); setSelectedMember(null); }}
      />
      
      <div className="flex-grow max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-warning text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
            <button 
              type="button"
              onClick={loadData} 
              className="px-3 py-1 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-xs hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        <AppHeader 
          activeTab={activeTab}
          theme={theme}
          toggleTheme={toggleTheme}
          handleLogout={() => handleLogout()}
          onOpenAccount={() => setAccountOpen(true)}
          currentUser={currentUser}
          refreshing={loading && hasLoaded}
        />

        <main>
          {/* Full-page spinner only for the first load; later refreshes keep the current screen mounted. */}
          {loading && !hasLoaded && <InitialLoading />}

          {hasLoaded && (
            <ErrorBoundary resetKey={activeTab} page={activeTab}>
            <>
              {activeTab === 'members' ? (
                selectedMember ? (
                  <MemberDetails 
                    member={selectedMember} 
                    onBack={() => setSelectedMember(null)} 
                    onUpdateMember={handleUpdateMember} 
                    onDeleteMember={handleDeleteMember}
                    onRenewMember={handleRenewMember}
                    onSetMemberClasses={handleSetMemberClasses}
                    scheduleTemplates={scheduleTemplates}
                    membershipPlans={membershipPlans}
                  />
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="search"
                        aria-label="Search members"
                        placeholder="Search name, phone or Emirates ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-sm"
                      />
                      <div className="flex rounded-xl border border-[var(--glass-border)] p-1 shrink-0" role="group" aria-label="Show">
                        {[['all', 'All'], ['expiring', 'Expiring soon']].map(([value, text]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={filterType === value}
                            onClick={() => setFilterType(value)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${filterType === value ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    </div>
                    <MemberGrid members={processedMembers} onManage={setSelectedMember} />
                  </>
                )
              ) : activeTab === 'enrollment' ? (
                <EnrollmentForm
                  onEnroll={handleEnroll}
                  scheduleTemplates={scheduleTemplates}
                  membershipPlans={membershipPlans}
                  onLoadOfficialPackages={handleLoadOfficialPackages}
                />
              ) : activeTab === 'schedule' ? (
                <Schedule
                  sessions={sessions}
                  scheduleTemplates={scheduleTemplates}
                  members={members}
                  saveSession={saveSession}
                  timetableActions={{
                    onAdd: handleAddTemplate,
                    onUpdate: handleUpdateTemplate,
                    onDelete: handleDeleteTemplate,
                    onLoadOfficial: handleLoadOfficialTimetable
                  }}
                />
              ) : activeTab === 'packages' ? (
                <PackagesPage
                  membershipPlans={membershipPlans}
                  onAddPlan={handleAddPlan}
                  onUpdatePlan={handleUpdatePlan}
                  onDeletePlan={handleDeletePlan}
                  onLoadOfficialPackages={handleLoadOfficialPackages}
                />
              ) : activeTab === 'dashboard' ? (
                <DashboardOverview
                  members={members}
                  sessions={sessions}
                  scheduleTemplates={scheduleTemplates}
                  onTabChange={(tab) => { setActiveTab(tab); setSelectedMember(null); }}
                  inClubList={inClubList}
                  saveSession={saveSession}
                  checkIn={checkIn}
                  checkOut={checkOut}
                />
              ) : activeTab === 'activity' ? (
                <ActivityLog />
              ) : activeTab === 'analytics' ? (
                <Analytics />
              ) : activeTab === 'notifications' ? (
                <Notifications 
                  jobs={notificationJobs} 
                  members={members} 
                  onTriggerTask={refreshNotificationJobs}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[50vh] glass-card p-12 text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-[var(--glass-border)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Page not found</h2>
                  <p className="text-[var(--text-secondary)] text-sm max-w-md">
                    The <span className="text-[var(--text-primary)] font-semibold">{activeTab}</span> page could not be found.
                  </p>
                </div>
              )}
            </>
            </ErrorBoundary>
          )}
        {accountOpen && (
          <AccountModal
            currentUser={currentUser}
            onClose={() => setAccountOpen(false)}
            onSignedOut={() => { setAccountOpen(false); handleLogout('Signed out on all devices.'); }}
          />
        )}
        </main>
      </div>
    </div>
  );
};

export default App;
