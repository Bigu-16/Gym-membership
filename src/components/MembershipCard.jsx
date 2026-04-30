import React from 'react';

const MembershipCard = ({ member }) => {
  const { name, plan, expiryDate, image } = member;
  
  const calculateDaysRemaining = (date) => {
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(expiryDate);

  const getStatusStyles = () => {
    if (daysRemaining < 3) {
      return {
        border: 'border-rose-500/30 dark:border-rose-500/50',
        glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)] dark:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
        indicator: 'bg-rose-500 animate-pulse',
        text: 'text-rose-500 dark:text-rose-400'
      };
    } else if (daysRemaining < 7) {
      return {
        border: 'border-amber-400/30 dark:border-amber-400/40',
        glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)] dark:shadow-[0_0_30px_rgba(251,191,36,0.2)]',
        indicator: 'bg-amber-400',
        text: 'text-amber-600 dark:text-amber-400'
      };
    } else {
      return {
        border: 'border-[var(--glass-border)]',
        glow: 'shadow-[var(--glass-shadow)]',
        indicator: 'bg-emerald-500 dark:bg-emerald-400',
        text: 'text-[var(--text-secondary)]'
      };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`glass-card p-6 flex flex-col gap-4 ${styles.border} ${styles.glow} hover:bg-[var(--card-hover)] group`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--glass-border)]">
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
                e.target.className = "w-full h-full object-cover";
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-[var(--text-primary)] opacity-90">{name}</h3>
            <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-medium">{plan}</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${styles.indicator}`}></div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] mb-2">
          <span>Membership Status</span>
          <span className={styles.text}>
            {daysRemaining < 0 ? 'Expired' : `${daysRemaining} Days Left`}
          </span>
        </div>
        <div className="w-full h-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              daysRemaining < 3 ? 'bg-rose-500' : daysRemaining < 7 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <button className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          View Profile
        </button>
        <button className="px-4 py-2 rounded-full bg-[var(--glass-border)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all">
          Manage
        </button>
      </div>
    </div>
  );
};

export default MembershipCard;
