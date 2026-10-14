import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { sessionsForDate, traineesForSession } from '../utils/classSessions';
import { useSessionActions } from '../hooks/useSessionActions';
import DashboardMetrics from './dashboard/DashboardMetrics';
import LiveSessionsCard from './dashboard/LiveSessionsCard';
import DeskCheckInCard from './dashboard/DeskCheckInCard';
import RecentActivityLog from './dashboard/RecentActivityLog';

const DashboardOverview = ({
  members = [],
  sessions = [],
  scheduleTemplates = [],
  inClubList = [],
  onTabChange,
  saveSession,
  checkIn,
  checkOut
}) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const actions = useSessionActions(saveSession);

  // Keep "starting now" / "not recorded" labels current while the desk screen stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      try {
        const [stats, activities] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivities()
        ]);
        if (isMounted) {
          setDashboardStats(stats);
          setRecentActivities(activities);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats/activities:', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };
    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [inClubList, members.length]);

  const todayClasses = useMemo(
    () => sessionsForDate(now, { sessions, templates: scheduleTemplates, now }),
    [now, sessions, scheduleTemplates]
  );
  const displayedClasses = useMemo(
    () => sessionsForDate(selectedDate, { sessions, templates: scheduleTemplates, now }),
    [selectedDate, now, sessions, scheduleTemplates]
  );

  // Today's roster: members enrolled in one of today's classes.
  const todayRoster = useMemo(() => todayClasses
    .filter((session) => session.status !== 'cancelled')
    .map((session) => ({ session, trainees: traineesForSession(session, members) }))
    .filter((group) => group.trainees.length > 0), [todayClasses, members]);

  return (
    <div className="space-y-10 animate-fade-in">
      <DashboardMetrics
        dashboardStats={dashboardStats}
        members={members}
        inClubCount={inClubList.length}
        todayClasses={todayClasses}
        onTabChange={onTabChange}
      />

      {actions.error && (
        <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500 flex justify-between gap-3">
          <span>{actions.error}</span>
          <button type="button" onClick={actions.clearError} className="font-bold uppercase tracking-luxury">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LiveSessionsCard
          sessions={displayedClasses}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onTabChange={onTabChange}
          actions={actions}
          now={now}
        />

        <div className="space-y-8">
          <DeskCheckInCard
            members={members}
            todayRoster={todayRoster}
            inClubList={inClubList}
            checkIn={checkIn}
            checkOut={checkOut}
          />
          <RecentActivityLog recentActivities={recentActivities} loadingStats={loadingStats} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
