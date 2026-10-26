import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { sessionsForDate, traineesForSession } from '../utils/classSessions';
import { useSessionActions } from '../hooks/useSessionActions';
import DashboardMetrics from './dashboard/DashboardMetrics';
import LiveSessionsCard from './dashboard/LiveSessionsCard';
import DeskCheckInCard from './dashboard/DeskCheckInCard';

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

  // Today's roster: members enrolled in one of today's classes.
  const todayRoster = useMemo(() => todayClasses
    .filter((session) => session.status !== 'cancelled')
    .map((session) => ({ session, trainees: traineesForSession(session, members) }))
    .filter((group) => group.trainees.length > 0), [todayClasses, members]);

  return (
    <div className="space-y-6">
      <DashboardMetrics
        dashboardStats={dashboardStats}
        members={members}
        inClubCount={inClubList.length}
        todayClasses={todayClasses}
        onTabChange={onTabChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <LiveSessionsCard sessions={todayClasses} onTabChange={onTabChange} actions={actions} />
        <DeskCheckInCard
          members={members}
          todayRoster={todayRoster}
          inClubList={inClubList}
          checkIn={checkIn}
          checkOut={checkOut}
          recentActivities={recentActivities}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;
