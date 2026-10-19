import { freezeSummary, daysUntil, membershipStatus, periodProgress } from '../utils/membership';

const STYLES = {
  frozen: {
    border: 'border-cyan-300/50 dark:border-cyan-500/50',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)] dark:shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    indicator: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse',
    text: 'text-cyan-700 dark:text-cyan-300',
    bar: 'bg-gradient-to-r from-cyan-400 to-blue-400',
    bg: 'bg-gradient-to-br from-cyan-100/40 to-blue-200/20 dark:from-cyan-900/40 dark:to-blue-900/20 backdrop-blur-md backdrop-saturate-150'
  },
  expired: {
    border: 'border-rose-500/30 dark:border-rose-500/50',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)] dark:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    indicator: 'bg-rose-500 animate-pulse',
    text: 'text-rose-500 dark:text-rose-400',
    bar: 'bg-rose-500',
    bg: ''
  },
  expiring: {
    border: 'border-amber-400/30 dark:border-amber-400/40',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)] dark:shadow-[0_0_30px_rgba(251,191,36,0.2)]',
    indicator: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-400',
    bg: ''
  },
  active: {
    border: 'border-[var(--glass-border)]',
    glow: 'shadow-[var(--glass-shadow)]',
    indicator: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-[var(--text-secondary)]',
    bar: 'bg-emerald-400',
    bg: ''
  }
};
STYLES['no-expiry'] = { ...STYLES.active, indicator: 'bg-[var(--text-secondary)]' };

// A family card follows the trainee whose membership runs out first.
const planForProgress = (member) => {
  if (member.planDetails) return member.planDetails;
  if (member.isGroup) {
    return (member.trainees || []).find((t) => t.expiryDate === member.expiryDate)?.planDetails || null;
  }
  return null;
};

const statusLabel = (status, days, member) => {
  if (status === 'frozen') return member && !member.isGroup ? freezeSummary(member) : 'Frozen';
  if (status === 'no-expiry') return 'No expiry set';
  if (status === 'expired') return 'Expired';
  if (days === 0) return 'Expires today';
  return `${days} Days Left`;
};

const MembershipCard = ({ member, onManage }) => {
  const { name, plan, image } = member;
  const status = membershipStatus(member);
  const daysRemaining = daysUntil(member.expiryDate);
  const progress = status === 'frozen' ? 100 : periodProgress(member, planForProgress(member));

  const styles = STYLES[status];

  return (
    <div className={`glass-card p-6 flex flex-col gap-4 ${styles.border} ${styles.glow} ${styles.bg} hover:bg-[var(--card-hover)] group relative overflow-hidden`}>
      {member.isFrozen && (
        <>
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px] pointer-events-none z-0"></div>
          <div className="absolute -right-6 -bottom-6 z-0 opacity-30 dark:opacity-20 pointer-events-none">
            <svg className="w-32 h-32 text-cyan-400 dark:text-cyan-300 animate-spin-slow" style={{ animationDuration: '60s' }} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20m0-20l3 3m-3-3l-3 3m3 14l3-3m-3 3l-3-3m8.66-10l-17.32 10m17.32-10l-3.5 1.5m3.5-1.5l-1.5 3.5m-13.82 5l-3.5-1.5m3.5 1.5l1.5-3.5m13.82 5l-17.32-10m17.32 10l-1.5-3.5m1.5 3.5l-3.5-1.5m-13.82-5l1.5 3.5m-1.5-3.5l3.5 1.5" />
            </svg>
          </div>
          <div className="absolute top-4 right-1/4 z-0 opacity-20 dark:opacity-10 pointer-events-none">
            <svg className="w-12 h-12 text-cyan-300 dark:text-cyan-200 animate-spin-slow" style={{ animationDuration: '40s', animationDirection: 'reverse' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20m0-20l3 3m-3-3l-3 3m3 14l3-3m-3 3l-3-3m8.66-10l-17.32 10m17.32-10l-3.5 1.5m3.5-1.5l-1.5 3.5m-13.82 5l-3.5-1.5m3.5 1.5l1.5-3.5m13.82 5l-17.32-10m17.32 10l-1.5-3.5m1.5 3.5l-3.5-1.5m-13.82-5l1.5 3.5m-1.5-3.5l3.5 1.5" />
            </svg>
          </div>
        </>
      )}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full overflow-hidden border ${member.isFrozen ? 'border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-[var(--glass-border)]'}`}>
            <img 
              src={image} 
              alt={name} 
              className={`w-full h-full object-cover transition-all duration-700 ${member.isFrozen ? 'opacity-80 mix-blend-luminosity' : 'grayscale group-hover:grayscale-0'}`} 
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
                e.target.className = "w-full h-full object-cover";
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-[var(--text-primary)] opacity-90">{name}</h3>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-medium">{plan}</p>
              {member.isGroup && member.trainees && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.trainees.map(t => (
                    <span key={t.id} className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${member.isFrozen ? 'bg-cyan-500/20 text-cyan-200' : 'bg-[var(--text-primary)] text-[var(--bg-primary)] opacity-80'}`}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              {!member.isGroup && member.enrolledClasses?.length > 0 && (
                <p className="text-[9px] text-[var(--text-secondary)] opacity-70 mt-1">
                  {member.enrolledClasses.map((c) => c.className).filter((v, i, all) => all.indexOf(v) === i).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${styles.indicator}`}></div>
      </div>

      <div className="mt-4 relative z-10">
        <div className="flex justify-between text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] mb-2">
          <span>Membership Status</span>
          <span className={styles.text}>
            {statusLabel(status, daysRemaining, member)}
          </span>
        </div>
        <div className="w-full h-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
          <div
            data-testid="membership-progress"
            className={`h-full transition-all duration-1000 ${styles.bar}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 relative z-10">
        <button
          type="button"
          onClick={() => onManage && onManage(member)}
          className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          View Profile
        </button>
        <button
          type="button"
          onClick={() => onManage && onManage(member)}
          className={`px-4 py-2 rounded-full border text-[10px] uppercase tracking-luxury transition-all ${
            member.isFrozen 
              ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500 hover:text-white' 
              : 'bg-[var(--glass-border)] border-[var(--glass-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]'
          }`}>
          Manage
        </button>
      </div>
    </div>
  );
};

export default MembershipCard;
