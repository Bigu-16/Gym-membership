import { membershipStatus } from '../../utils/membership';

const Tile = ({ label, value, unit, detail, detailClass = 'text-[var(--text-secondary)]', onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`glass-card px-5 py-4 text-left w-full ${onClick ? 'hover:border-[var(--text-primary)] transition-colors' : ''}`}
    >
      <p className="label">{label}</p>
      <p className="text-3xl font-semibold mt-1">
        {value} <span className="text-sm font-normal text-[var(--text-secondary)]">{unit}</span>
      </p>
      <p className={`text-xs mt-1 ${detailClass}`}>{detail}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Tile
        label="Members"
        value={totalRegistered}
        unit="registered"
        detail={`${active} active${expiring ? ` • ${expiring} expiring this week` : ''}`}
        detailClass={expiring ? 'text-warning' : 'text-[var(--text-secondary)]'}
        onClick={() => onTabChange('members')}
      />
      <Tile
        label="In the center now"
        value={inClubCount}
        unit="checked in"
        detail={`${checkInsToday} check-in${checkInsToday === 1 ? '' : 's'} today`}
      />
      <Tile
        label="Today's classes"
        value={todayClasses.length}
        unit={todayClasses.length === 1 ? 'class' : 'classes'}
        detail={todayClasses.length ? `${running} running • ${completed} done • ${remaining} to go` : 'No classes today'}
        detailClass={running ? 'text-success' : 'text-[var(--text-secondary)]'}
        onClick={() => onTabChange('schedule')}
      />
    </div>
  );
};

export default DashboardMetrics;
