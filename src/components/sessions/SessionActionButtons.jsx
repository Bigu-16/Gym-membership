import { sessionActions } from '../../utils/classSessions';

const SessionActionButtons = ({ session, actions, disabled = false, size = 'sm' }) => {
  const padding = size === 'lg' ? 'px-5 py-3 text-[10px]' : 'px-3 py-1.5 text-[9px]';
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {sessionActions(session).map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={disabled}
          onClick={() => actions.setStatus(session, action.status)}
          className={`${padding} rounded-xl uppercase tracking-luxury font-bold transition-all disabled:opacity-40 ${
            action.primary
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90'
              : 'border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default SessionActionButtons;
