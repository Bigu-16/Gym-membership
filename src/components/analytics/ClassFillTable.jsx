import { EmptyState } from './charts';
import { abbreviateDays, formatTimeRange } from './format';

const ClassFillTable = ({ rows = [] }) => {
  if (rows.length === 0) return <EmptyState>No class templates yet</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-xs text-[var(--text-secondary)] text-left border-b border-[var(--glass-border)]">
            <th scope="col" className="py-2 pr-3 font-semibold">Class</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Days</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Time</th>
            <th scope="col" className="py-2 font-semibold w-1/3">Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const capacity = Number(row.capacity) || 0;
            const ratio = capacity > 0 ? row.enrolled / capacity : 0;
            const nearlyFull = capacity > 0 && ratio >= 0.9;
            return (
              <tr key={row.template_id} data-testid={`class-fill-${row.template_id}`}
                className="border-b border-[var(--glass-border)] last:border-0">
                <td className="py-3 pr-3 text-[var(--text-primary)] font-medium">{row.title}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">{abbreviateDays(row.days) || '—'}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)] whitespace-nowrap">{formatTimeRange(row.time)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className={`tabular-nums whitespace-nowrap ${nearlyFull ? 'text-warning font-semibold' : 'text-[var(--text-primary)]'}`}>
                      {row.enrolled}/{capacity || '—'}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--card-hover)] border border-[var(--glass-border)] overflow-hidden"
                      role="progressbar" aria-label={`${row.title} fill`} aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={row.enrolled}>
                      <div className={`h-full rounded-full ${nearlyFull ? 'bg-amber-500' : 'bg-[var(--accent-color)]'}`}
                        style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                    </div>
                    {nearlyFull && <span className="text-xs text-warning font-bold whitespace-nowrap">Nearly full</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ClassFillTable;
