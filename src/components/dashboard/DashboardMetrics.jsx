import { CalendarDays, ChevronRight, DoorOpen, Users } from 'lucide-react';
import { membershipStatus } from '../../utils/membership';

// Icon chips use each colour's own 10% tint, the pairing checked for AAA in index.css.
const TONES = {
  success: 'bg-emerald-500/10 text-success',
  info: 'bg-sky-500/10 text-info',
  violet: 'bg-violet-500/10 text-violet'
};

/** A thin bar made of coloured parts; decorative, the numbers are always written out beside it. */
const Meter = ({ parts, total }) => (
  <div aria-hidden="true" className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-hover)]">
    {total > 0 && parts.map((part) => (
      part.value > 0 && <span key={part.key} className={part.className} style={{ width: `${(part.value / total) * 100}%` }} />
    ))}
  </div>
);

const Tile = ({ icon: Icon, tone, label, value, unit, detail, detailClass = 'text-[var(--text-secondary)]', meter, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`glass-card group relative flex flex-col p-5 text-left w-full ${onClick ? 'hover:border-[var(--text-secondary)] hover:shadow-sm transition' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label">{label}</p>
        <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon size={18} strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight tabular-nums">{value}</span>
        <span className="text-sm text-[var(--text-secondary)]">{unit}</span>
      </p>
      <p className={`mt-1 text-xs font-medium ${detailClass}`}>{detail}</p>
      {meter}
      {onClick && (
        <ChevronRight
          aria-hidden="true"
          size={16}
          className="absolute right-5 bottom-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        />
      )}
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
        icon={Users}
        tone="success"
        label="Members"
        value={totalRegistered}
        unit="registered"
        detail={`${active} active${expiring ? ` • ${expiring} expiring this week` : ''}`}
        detailClass={expiring ? 'text-warning' : 'text-[var(--text-secondary)]'}
        meter={(
          <Meter
            total={Math.max(totalRegistered, active)}
            parts={[
              { key: 'active', value: active - expiring, className: 'bg-[var(--accent-color)]' },
              { key: 'expiring', value: expiring, className: 'bg-[var(--warning)]' }
            ]}
          />
        )}
        onClick={() => onTabChange('members')}
      />
      <Tile
        icon={DoorOpen}
        tone="info"
        label="In the center now"
        value={inClubCount}
        unit="checked in"
        detail={`${checkInsToday} check-in${checkInsToday === 1 ? '' : 's'} today`}
      />
      <Tile
        icon={CalendarDays}
        tone="violet"
        label="Today's classes"
        value={todayClasses.length}
        unit={todayClasses.length === 1 ? 'class' : 'classes'}
        detail={todayClasses.length ? `${running} running • ${completed} done • ${remaining} to go` : 'No classes today'}
        detailClass={running ? 'text-success' : 'text-[var(--text-secondary)]'}
        meter={(
          <Meter
            total={todayClasses.length}
            parts={[
              { key: 'done', value: completed, className: 'bg-[var(--text-secondary)]' },
              { key: 'running', value: running, className: 'bg-[var(--accent-color)]' }
            ]}
          />
        )}
        onClick={() => onTabChange('schedule')}
      />
    </div>
  );
};

export default DashboardMetrics;
