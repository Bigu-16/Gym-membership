import { Users, Activity, CalendarClock } from 'lucide-react';
import { membershipStatus } from '../../utils/membership';

const Tile = ({ label, value, unit, detail, detailClass = 'text-[var(--text-secondary)]', icon, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`glass-card p-6 text-left w-full ${onClick ? 'cursor-pointer hover:border-[var(--text-primary)] group' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">{label}</span>
          <span className="text-3xl font-light tracking-wide">
            {value} <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
          </span>
        </div>
        <div className="p-3 bg-[var(--card-hover)] rounded-xl group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all duration-300">
          {icon}
        </div>
      </div>
      <span className={`text-[10px] uppercase tracking-luxury font-bold ${detailClass}`}>{detail}</span>
    </Wrapper>
  );
};

const DashboardMetrics = ({ dashboardStats, members = [], inClubCount = 0, todayClasses = [], onTabChange }) => {
  const totalRegistered = dashboardStats?.total_members ?? members.length;
  const statuses = members.map((m) => membershipStatus(m));
  const active = statuses.filter((s) => s === 'active' || s === 'expiring').length;
  const expiring = statuses.filter((s) => s === 'expiring').length;
  const checkInsToday = dashboardStats?.recent_activities ?? 0;

  const running = todayClasses.filter((s) => s.status === 'in-progress').length;
  const completed = todayClasses.filter((s) => s.status === 'completed').length;
  const remaining = todayClasses.filter((s) => s.status === 'scheduled' || s.status === 'upcoming').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Tile
        label="Members"
        value={totalRegistered}
        unit="registered"
        detail={`${active} active${expiring ? ` • ${expiring} expiring this week` : ''}`}
        detailClass={expiring ? 'text-amber-500' : 'text-[var(--text-secondary)]'}
        icon={<Users size={20} />}
        onClick={() => onTabChange('members')}
      />
      <Tile
        label="In the center now"
        value={inClubCount}
        unit="checked in"
        detail={`${checkInsToday} check-in${checkInsToday === 1 ? '' : 's'} today`}
        icon={<Activity size={20} />}
      />
      <Tile
        label="Today's classes"
        value={todayClasses.length}
        unit={todayClasses.length === 1 ? 'class' : 'classes'}
        detail={todayClasses.length ? `${running} running • ${completed} done • ${remaining} to go` : 'No classes today'}
        detailClass={running ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}
        icon={<CalendarClock size={20} />}
        onClick={() => onTabChange('schedule')}
      />
    </div>
  );
};

export default DashboardMetrics;
