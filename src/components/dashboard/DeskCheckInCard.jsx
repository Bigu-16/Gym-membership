import { useMemo, useState } from 'react';
import { membershipStatus } from '../../utils/membership';
import { Spinner, useFeedback } from '../common/Feedback';

const STATUS_CHIP = {
  expired: { text: 'Expired', className: 'text-danger bg-rose-500/10' },
  frozen: { text: 'Frozen', className: 'text-info bg-sky-500/10' },
  expiring: { text: 'Expiring', className: 'text-warning bg-amber-500/10' }
};

const timeFormat = { hour: 'numeric', minute: '2-digit' };

const formatWhen = (timestamp) => {
  const when = new Date(timestamp);
  const time = when.toLocaleTimeString([], timeFormat);
  return when.toDateString() === new Date().toDateString()
    ? time
    : `${when.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
};

const MemberRow = ({ member, action }) => {
  const chip = STATUS_CHIP[membershipStatus(member)];
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <img src={member.image} alt="" className="w-8 h-8 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member.name}</p>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {member.plan}
            {chip && <span className={`ml-1.5 px-1.5 rounded font-semibold ${chip.className}`}>{chip.text}</span>}
          </p>
        </div>
      </div>
      {action}
    </li>
  );
};

/** Check members in and out at the desk; today's enrolled members are listed first. */
const DeskCheckInCard = ({ members = [], todayRoster = [], inClubList = [], checkIn, checkOut, recentActivities = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [blocked, setBlocked] = useState(null);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.parentName || '').toLowerCase().includes(q) ||
      (m.parentPhone || '').includes(q)
    ).slice(0, 20);
  }, [members, searchTerm]);

  const rosterMembers = useMemo(() => {
    const seen = new Set();
    return todayRoster.flatMap((g) => g.trainees).filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
  }, [todayRoster]);

  // "Checked in/out" confirmations come from the data layer; failures are reported here.
  const { notify } = useFeedback();

  const handleCheckIn = async (member, override = false) => {
    setBusyId(member.id);
    setBlocked(null);
    try {
      await checkIn(member.id, override ? { override: true } : undefined);
      setSearchTerm('');
    } catch (err) {
      if (/expired|frozen/i.test(err.message)) setBlocked({ member, reason: err.message });
      else notify.error(`Could not check in ${member.name}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckOut = async (member) => {
    setBusyId(member.id);
    try {
      await checkOut(member.id);
    } catch (err) {
      notify.error(`Could not check out ${member.name}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const checkedInMembers = inClubList.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  const searching = Boolean(searchTerm.trim());
  const list = searching ? searchResults : rosterMembers.filter((m) => !inClubList.includes(m.id));

  return (
    <section className="glass-card" aria-label="Desk check-in">
      <div className="px-5 py-4 border-b border-[var(--glass-border)] space-y-3">
        <h2 className="section-title">Desk check-in</h2>
        <input
          type="search"
          placeholder="Search name, phone or parent"
          aria-label="Search members to check in"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm"
        />
        {blocked && (
          <div role="alert" className="text-sm rounded-lg p-3 bg-amber-500/10 text-warning space-y-2">
            <p><strong>{blocked.member.name}</strong>: {blocked.reason}. Renew at the desk, or let them in for today.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleCheckIn(blocked.member, true)} className="btn-primary btn-sm">Let in anyway</button>
              <button type="button" onClick={() => setBlocked(null)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3">
        <p className="label">{searching ? 'Search results' : 'Expected today'}</p>
        {list.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-2">
            {searching ? 'No matching members.' : 'Nobody else is expected today. Search above for walk-ins.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)] max-h-72 overflow-y-auto">
            {list.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                action={inClubList.includes(member.id)
                  ? <span className="text-xs font-semibold text-success shrink-0">In center</span>
                  : (
                    <button type="button" disabled={busyId === member.id} onClick={() => handleCheckIn(member)} className="btn-primary btn-sm shrink-0">
                      {busyId === member.id ? <Spinner label="Checking in…" /> : 'Check in'}
                    </button>
                  )}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[var(--glass-border)]">
        <p className="label">In the center now ({checkedInMembers.length})</p>
        {checkedInMembers.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-2">Nobody checked in right now.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)] max-h-60 overflow-y-auto">
            {checkedInMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                action={(
                  <button type="button" disabled={busyId === member.id} onClick={() => handleCheckOut(member)} className="btn-secondary btn-sm shrink-0">
                    {busyId === member.id ? <Spinner label="Checking out…" /> : 'Check out'}
                  </button>
                )}
              />
            ))}
          </ul>
        )}
      </div>

      {recentActivities.length > 0 && (
        <div className="px-5 py-3 border-t border-[var(--glass-border)]">
          <p className="label">Recent check-ins</p>
          <ul className="text-sm divide-y divide-[var(--glass-border)]">
            {recentActivities.slice(0, 5).map((act) => (
              <li key={`${act.check_in_id}-${act.timestamp}`} className="flex justify-between gap-3 py-1.5">
                <span className="truncate">
                  {act.member_name} <span className="text-[var(--text-secondary)]">{act.action === 'check_in' ? 'checked in' : 'checked out'}</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] shrink-0">{formatWhen(act.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DeskCheckInCard;
