import { useMemo, useState } from 'react';
import { CheckCircle2, LogIn, LogOut, Search } from 'lucide-react';
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

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const Avatar = ({ member }) => (
  member.image
    ? <img src={member.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[var(--bg-secondary)]" />
    : (
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--card-hover)] text-xs font-bold">
        {initials(member.name)}
      </span>
    )
);

const MemberRow = ({ member, action }) => {
  const chip = STATUS_CHIP[membershipStatus(member)];
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[var(--card-hover)]">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar member={member} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold truncate">{member.name}</span>
            {chip && <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-xs font-semibold ${chip.className}`}>{chip.text}</span>}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">{member.plan}</p>
        </div>
      </div>
      {action}
    </li>
  );
};

/** A section heading with a count pill. */
const GroupHeading = ({ children, count }) => (
  <div className="mb-1 flex items-center justify-between px-2">
    <h3 className="label">{children}</h3>
    {count != null && (
      <span className="rounded-full bg-[var(--card-hover)] px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>
    )}
  </div>
);

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
    <section className="glass-card lg:col-span-2 overflow-hidden" aria-label="Desk check-in">
      <div className="px-5 py-4 border-b border-[var(--glass-border)] space-y-3">
        <h2 className="section-title">Desk check-in</h2>
        <div className="relative">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="search"
            placeholder="Search name, phone or parent"
            aria-label="Search members to check in"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-3 text-sm hover:border-[var(--text-secondary)] transition-colors"
          />
        </div>
        {blocked && (
          <div role="alert" className="text-sm rounded-xl border border-amber-500/30 p-3 bg-amber-500/10 text-warning space-y-2">
            <p><strong>{blocked.member.name}</strong>: {blocked.reason}. Renew at the desk, or let them in for today.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleCheckIn(blocked.member, true)} className="btn-primary btn-sm">Let in anyway</button>
              <button type="button" onClick={() => setBlocked(null)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-3">
        <GroupHeading count={list.length || null}>{searching ? 'Search results' : 'Expected today'}</GroupHeading>
        {list.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">
            {searching ? 'No matching members.' : 'Nobody else is expected today. Search above for walk-ins.'}
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto">
            {list.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                action={inClubList.includes(member.id)
                  ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 size={14} aria-hidden="true" /> In center
                    </span>
                  )
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

      <div className="px-3 py-3 border-t border-[var(--glass-border)]">
        <GroupHeading count={checkedInMembers.length}>In the center now</GroupHeading>
        {checkedInMembers.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">Nobody checked in right now.</p>
        ) : (
          <ul className="max-h-60 overflow-y-auto">
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
        <div className="px-3 py-3 border-t border-[var(--glass-border)] bg-[var(--bg-primary)]">
          <GroupHeading>Recent check-ins</GroupHeading>
          <ul className="text-sm">
            {recentActivities.slice(0, 5).map((act) => {
              const isIn = act.action === 'check_in';
              const Icon = isIn ? LogIn : LogOut;
              return (
                <li key={`${act.check_in_id}-${act.timestamp}`} className="flex items-center justify-between gap-3 px-2 py-1.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={14} aria-hidden="true" className={`shrink-0 ${isIn ? 'text-success' : 'text-[var(--text-secondary)]'}`} />
                    <span className="truncate">
                      {act.member_name} <span className="text-[var(--text-secondary)]">{isIn ? 'checked in' : 'checked out'}</span>
                    </span>
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] shrink-0 tabular-nums">{formatWhen(act.timestamp)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DeskCheckInCard;
