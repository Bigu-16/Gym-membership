import { sessionActions } from '../../utils/classSessions';
import { Spinner } from '../common/Feedback';

/** The next step for a class (e.g. "Start class"), plus the alternative as a quieter button. */
const SessionActionButtons = ({ session, actions, disabled = false, size = 'sm' }) => {
  const savingThis = actions.pendingId === session.id;
  return (
    <div className="flex flex-wrap gap-2 justify-end shrink-0">
      {sessionActions(session).map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={disabled}
          onClick={() => actions.setStatus(session, action.status)}
          className={`${action.primary ? 'btn-primary' : 'btn-secondary'} ${size === 'sm' ? 'btn-sm' : ''}`}
        >
          {savingThis && actions.pendingStatus === action.status ? <Spinner label="Saving…" /> : action.label}
        </button>
      ))}
    </div>
  );
};

export default SessionActionButtons;
