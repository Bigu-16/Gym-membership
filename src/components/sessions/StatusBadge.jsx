import { STATUS_META, statusLabel } from '../../utils/classSessions';

const TONE_CLASSES = {
  neutral: 'bg-[var(--glass-border)] text-[var(--text-secondary)]',
  live: 'bg-emerald-500/10 text-success',
  done: 'bg-sky-500/10 text-info',
  cancelled: 'bg-rose-500/10 text-danger',
  warning: 'bg-amber-500/10 text-warning'
};

const StatusBadge = ({ status, isLive = false, className = '' }) => {
  const tone = STATUS_META[status]?.tone || 'neutral';
  const showNow = isLive && (status === 'scheduled' || status === 'upcoming');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs uppercase tracking-luxury font-bold ${TONE_CLASSES[tone]} ${className}`}>
      {(tone === 'live' || showNow) && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {showNow ? 'Starting now' : statusLabel(status)}
    </span>
  );
};

export default StatusBadge;
