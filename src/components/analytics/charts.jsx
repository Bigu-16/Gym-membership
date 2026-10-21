import { formatHour } from './format';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Card = ({ title, subtitle, children, className = '' }) => (
  <section className={`glass-card p-6 border border-[var(--glass-border)] ${className}`}>
    <h3 className="text-sm uppercase tracking-luxury text-[var(--text-secondary)] font-semibold leading-none mb-1">{title}</h3>
    {subtitle && <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-5">{subtitle}</p>}
    {!subtitle && <div className="mb-5" />}
    {children}
  </section>
);

export const EmptyState = ({ children }) => (
  <div className="py-8 text-center text-xs text-[var(--text-secondary)] uppercase tracking-luxury">{children}</div>
);

export const KpiTile = ({ label, value, detail, tone }) => (
  <div className="glass-card p-6">
    <span className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">{label}</span>
    <span className="text-3xl font-light text-[var(--text-primary)]" data-testid={`kpi-${label}`}>{value}</span>
    {detail && (
      <div className={`mt-3 text-xs font-medium uppercase tracking-wide ${tone || 'text-[var(--text-secondary)]'}`}>{detail}</div>
    )}
  </div>
);

/** Vertical column chart. data: [{ key, label, value, tooltip }] */
export const ColumnChart = ({ data, height = 160, labelEvery = 1, ariaLabel }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = data.length * 10;
  return (
    <div>
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} 100`} preserveAspectRatio="none"
        className="w-full text-[var(--accent-color)]" style={{ height }}>
        <line x1="0" y1="100" x2={width} y2="100" stroke="var(--glass-border)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = (d.value / max) * 96;
          return (
            <rect key={d.key} x={i * 10 + 1.5} y={100 - h} width="7" height={Math.max(h, d.value > 0 ? 1 : 0)}
              rx="1" fill="currentColor" opacity="0.85">
              <title>{d.tooltip}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex mt-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 text-center truncate">
            {i % labelEvery === 0 || i === data.length - 1 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Horizontal bar list. items: [{ label, value }] */
export const BarList = ({ items, format = String, emptyText = 'No data yet' }) => {
  const rows = (items || []).filter((i) => Number(i.value) > 0);
  if (rows.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  const max = Math.max(...rows.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {rows.map((item) => (
        <li key={item.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-primary)]">{item.label}</span>
            <span className="text-[var(--text-secondary)] tabular-nums">{format(item.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--card-hover)] border border-[var(--glass-border)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent-color)]" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Weekday x hour heatmap. cells: [{ weekday 0=Mon, hour, count }] */
export const Heatmap = ({ cells = [] }) => {
  const withData = cells.filter((c) => c.count > 0);
  const hours = withData.map((c) => c.hour);
  const minHour = Math.min(15, ...hours);
  const maxHour = Math.max(21, ...hours);
  const days = withData.some((c) => c.weekday === 6) ? 7 : 6;
  const lookup = new Map(withData.map((c) => [`${c.weekday}-${c.hour}`, c.count]));
  const max = Math.max(1, ...withData.map((c) => c.count));
  const hourRange = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Day</span></th>
            {hourRange.map((h) => (
              <th key={h} scope="col" className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{formatHour(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKDAYS.slice(0, days).map((day, d) => (
            <tr key={day}>
              <th scope="row" className="text-xs font-medium text-[var(--text-secondary)] text-left pr-2">{day.slice(0, 3)}</th>
              {hourRange.map((h) => {
                const count = lookup.get(`${d}-${h}`) || 0;
                const label = `${day} ${formatHour(h)}: ${count} check-in${count === 1 ? '' : 's'}`;
                return (
                  <td key={h} title={label} aria-label={label}
                    className="h-7 min-w-[28px] rounded-md border border-[var(--glass-border)] text-center text-xs tabular-nums text-[var(--text-primary)]"
                    style={{ background: count ? `color-mix(in srgb, var(--accent-color) ${Math.round(15 + (count / max) * 75)}%, transparent)` : 'var(--card-hover)' }}>
                    {count || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
