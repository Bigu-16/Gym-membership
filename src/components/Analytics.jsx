import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { BarList, Card, ColumnChart, EmptyState, Heatmap, KpiTile } from './analytics/charts';
import ClassFillTable from './analytics/ClassFillTable';
import { formatDay, formatMoney, formatMonth, formatNumber, sumValues } from './analytics/format';

const revenueChange = (current, previous) => {
  if (!(previous > 0)) return { text: `Last month: ${formatMoney(previous)}` };
  const pct = Math.round(((current - previous) / previous) * 100);
  return {
    text: `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}% vs last month`,
    tone: pct > 0 ? 'text-emerald-500' : pct < 0 ? 'text-rose-500' : undefined,
  };
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(() => apiService.getAnalyticsSummary()
    .then((summary) => { setData(summary); setError(null); })
    .catch((err) => setError(err?.message || 'Failed to load analytics'))
    .finally(() => setLoading(false)), []);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchSummary();
  };

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (loading && !data) {
    return (
      <div role="status" className="glass-card p-10 text-center text-xs uppercase tracking-luxury text-[var(--text-secondary)]">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="glass-card p-10 text-center space-y-4">
        <p className="text-sm text-[var(--text-primary)]">Could not load analytics.</p>
        <p className="text-xs text-[var(--text-secondary)]">{error}</p>
        <button type="button" onClick={load}
          className="px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury font-bold border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--card-hover)]">
          Retry
        </button>
      </div>
    );
  }

  const currency = data.currency || 'AED';
  const money = (v) => formatMoney(v, currency);
  const totals = data.totals || {};
  const revenueByMonth = data.revenue_by_month || [];
  const checkInsByDay = data.check_ins_by_day || [];
  const hasRevenue = sumValues(revenueByMonth) > 0 || data.revenue_this_month > 0;
  const change = revenueChange(data.revenue_this_month || 0, data.revenue_last_month || 0);
  const noPayments = 'No payments recorded yet';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[var(--glass-border)]">
        <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"></span> Business intelligence
        </h2>
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
          As of {data.generated_on ? formatDay(data.generated_on) : '—'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiTile label="Active members" value={formatNumber(totals.active)}
          detail={`${formatNumber(totals.total)} total · ${formatNumber(totals.frozen)} frozen`} />
        <KpiTile label="Revenue this month" value={money(data.revenue_this_month)} detail={change.text} tone={change.tone} />
        <KpiTile label="Check-ins (30 days)" value={formatNumber(data.check_ins_last_30_days)} />
        <KpiTile label="Renewal rate"
          value={data.renewal_rate == null ? '—' : `${Math.round(data.renewal_rate * 100)}%`}
          detail={`${formatNumber(data.renewals_last_90_days)} renewed · ${formatNumber(data.expired_unrenewed_last_90_days)} lapsed (90d)`} />
        <KpiTile label="Expiring in 7 days" value={formatNumber(totals.expiring_7_days)}
          detail={`${formatNumber(totals.expired)} already expired`}
          tone={totals.expiring_7_days > 0 ? 'text-amber-500' : undefined} />
      </div>

      <Card title="Revenue by month" subtitle={`Recorded payments, last 12 months (${currency})`}>
        {hasRevenue ? (
          <ColumnChart ariaLabel="Revenue by month" labelEvery={1}
            data={revenueByMonth.map((m) => ({
              key: m.month, label: formatMonth(m.month), value: m.value,
              tooltip: `${formatMonth(m.month, true)}: ${money(m.value)}`,
            }))} />
        ) : <EmptyState>{noPayments}</EmptyState>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue by program" subtitle="Last 12 months">
          <BarList items={data.revenue_by_program} format={money} emptyText={noPayments} />
        </Card>
        <Card title="Revenue by payment method" subtitle="Last 12 months">
          <BarList items={data.revenue_by_method} format={money} emptyText={noPayments} />
        </Card>
        <Card title="Members by program" subtitle="Active members">
          <BarList items={data.members_by_program} format={formatNumber} emptyText="No active members yet" />
        </Card>
        <Card title="Demographics" subtitle="Age groups & gender">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BarList items={data.age_groups} format={formatNumber} emptyText="No age data" />
            <BarList items={data.gender_split} format={formatNumber} emptyText="No gender data" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Attendance heatmap" subtitle="Check-ins by weekday & hour, last 8 weeks">
          {(data.attendance_heatmap || []).some((c) => c.count > 0)
            ? <Heatmap cells={data.attendance_heatmap} />
            : <EmptyState>No check-ins in the last 8 weeks</EmptyState>}
        </Card>
        <Card title="Check-ins per day" subtitle="Last 30 days">
          {checkInsByDay.some((d) => d.attendance_count > 0) ? (
            <ColumnChart ariaLabel="Check-ins per day" labelEvery={7}
              data={checkInsByDay.map((d) => ({
                key: d.date, label: formatDay(d.date), value: d.attendance_count,
                tooltip: `${formatDay(d.date)}: ${d.attendance_count} check-ins`,
              }))} />
          ) : <EmptyState>No check-ins in the last 30 days</EmptyState>}
        </Card>
      </div>

      <Card title="Class fill" subtitle="Enrolled vs capacity per weekly class">
        <ClassFillTable rows={data.class_fill || []} />
      </Card>
    </div>
  );
};

export default Analytics;
