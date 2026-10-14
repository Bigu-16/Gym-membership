import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { membershipStatus } from '../../utils/membership';

const STATUS_CHIP = {
  expired: { text: 'Expired', className: 'text-rose-500 bg-rose-500/10' },
  frozen: { text: 'Frozen', className: 'text-sky-500 bg-sky-500/10' },
  expiring: { text: 'Expiring', className: 'text-amber-500 bg-amber-500/10' }
};

const timeFormat = { hour: 'numeric', minute: '2-digit' };

const MemberRow = ({ member, isCheckedIn, onCheckIn, busy }) => {
  const chip = STATUS_CHIP[membershipStatus(member)];
  return (
    <li className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--glass-border)]">
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={member.image} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--glass-border)]" />
        <div className="min-w-0">
          <span className="text-xs font-semibold block truncate">{member.name}</span>
          <span className="text-[9px] text-[var(--text-secondary)] block truncate">
            {member.plan}
            {chip && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full font-bold ${chip.className}`}>{chip.text}</span>}
          </span>
        </div>
      </div>
      {isCheckedIn ? (
        <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold px-2 py-1 rounded-full bg-emerald-500/10 shrink-0">
          In center
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onCheckIn(member)}
          className="px-3 py-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[9px] uppercase tracking-luxury font-bold disabled:opacity-40 shrink-0"
        >
          Check in
        </button>
      )}
    </li>
  );
};

const DeskCheckInCard = ({ members = [], todayRoster = [], inClubList = [], checkIn, checkOut }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
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
    const groups = selectedClass === 'all' ? todayRoster : todayRoster.filter((g) => g.session.id === selectedClass);
    const seen = new Set();
    return groups.flatMap((g) => g.trainees).filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
  }, [todayRoster, selectedClass]);

  const flash = (text, tone = 'success') => {
    setMessage({ text, tone });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCheckIn = async (member, override = false) => {
    setBusyId(member.id);
    setBlocked(null);
    try {
      await checkIn(member.id, override ? { override: true } : undefined);
      flash(`${member.name} checked in.`);
      setSearchTerm('');
    } catch (err) {
      if (/expired|frozen/i.test(err.message)) {
        setBlocked({ member, reason: err.message });
      } else {
        flash(`Check-in failed: ${err.message}`, 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckOut = async (member) => {
    setBusyId(member.id);
    try {
      await checkOut(member.id);
      flash(`${member.name} checked out.`);
    } catch (err) {
      flash(`Check-out failed: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const checkedInMembers = inClubList.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  const list = searchTerm.trim() ? searchResults : rosterMembers;

  return (
    <section className="glass-card p-6 border border-[var(--glass-border)]" aria-label="Desk check-in">
      <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold mb-4 flex items-center gap-2">
        <ClipboardCheck size={16} /> Desk check-in
      </h3>

      {message && (
        <p role="status" className={`mb-3 text-xs rounded-xl p-2.5 ${message.tone === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          {message.text}
        </p>
      )}

      {blocked && (
        <div role="alert" className="mb-3 text-xs rounded-xl p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 space-y-2">
          <p><strong>{blocked.member.name}</strong>: {blocked.reason}. Renew at the desk, or let them in for today.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleCheckIn(blocked.member, true)} className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold">
              Let in anyway
            </button>
            <button type="button" onClick={() => setBlocked(null)} className="px-3 py-1 rounded-lg border border-amber-500/40">
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        type="search"
        placeholder="Search name, phone or parent…"
        aria-label="Search members to check in"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 bg-[var(--card-hover)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
      />

      {!searchTerm.trim() && todayRoster.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
          {[{ id: 'all', label: 'All classes' }, ...todayRoster.map((g) => ({
            id: g.session.id,
            label: `${g.session.title} ${g.session.start.toLocaleTimeString([], timeFormat)}`
          }))].map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={selectedClass === chip.id}
              onClick={() => setSelectedClass(chip.id)}
              className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-luxury font-bold whitespace-nowrap ${
                selectedClass === chip.id
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-[11px] text-[var(--text-secondary)] italic text-center py-4 border border-dashed border-[var(--glass-border)] rounded-xl mb-6">
          {searchTerm.trim() ? 'No matching members.' : 'Nobody is enrolled in today\'s classes yet. Search above for walk-ins.'}
        </p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-6">
          {list.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isCheckedIn={inClubList.includes(member.id)}
              onCheckIn={handleCheckIn}
              busy={busyId === member.id}
            />
          ))}
        </ul>
      )}

      <div className="pt-4 border-t border-[var(--glass-border)]">
        <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block mb-3">
          In the center ({checkedInMembers.length})
        </span>
        {checkedInMembers.length === 0 ? (
          <p className="text-[11px] text-[var(--text-secondary)] italic text-center py-2">Nobody checked in right now.</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {checkedInMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[var(--card-hover)]">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={member.image} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--glass-border)]" />
                  <span className="text-xs font-medium truncate">{member.name}</span>
                </div>
                <button
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => handleCheckOut(member)}
                  className="px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-luxury font-bold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-40 shrink-0"
                >
                  Check out
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default DeskCheckInCard;
