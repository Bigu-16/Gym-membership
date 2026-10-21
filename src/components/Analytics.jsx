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
    tone: pct > 0 ? 'text-success' : pct < 0 ? 'text-danger' : undefined,
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
      <div role="status" className="glass-card p-10 text-center text-xs text-[var(--text-secondary)]">
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
          className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--card-hover)]">
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

  const revenueByMonthChart = hasRevenue ? (
    <ColumnChart ariaLabel="Revenue by month" labelEvery={1}
      data={revenueByMonth.map((m) => ({
        key: m.month, label: formatMonth(m.month), value: m.value,
        tooltip: `${formatMonth(m.month, true)}: ${money(m.value)}`,
      }))} />
  ) : <EmptyState>{noPayments}</EmptyState>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--text-secondary)]">
        Figures as of {data.generated_on ? formatDay(data.generated_on) : '—'}.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiTile label="Active members" value={formatNumber(totals.active)}
          detail={`${formatNumber(totals.total)} total · ${formatNumber(totals.frozen)} frozen`} />
        <KpiTile label="Expiring in 7 days" value={formatNumber(totals.expiring_7_days)}
          detail={`${formatNumber(totals.expired)} already expired`}
          tone={totals.expiring_7_days > 0 ? 'text-warning' : undefined} />
        <KpiTile label="Renewal rate"
          value={data.renewal_rate == null ? '—' : `${Math.round(data.renewal_rate * 100)}%`}
          detail={`${formatNumber(data.renewals_last_90_days)} renewed · ${formatNumber(data.expired_unrenewed_last_90_days)} lapsed (90 days)`} />
        <KpiTile label="Revenue this month" value={money(data.revenue_this_month)} detail={change.text} tone={change.tone} />
        <KpiTile label="Check-ins (30 days)" value={formatNumber(data.check_ins_last_30_days)} />
      </div>

      <section className="space-y-4" aria-labelledby="analytics-members">
        <h2 id="analytics-members" className="section-title">Members</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="By program" subtitle="Active members">
            <BarList items={data.members_by_program} format={formatNumber} emptyText="No active members yet" />
          </Card>
          <Card title="Age and gender" subtitle="Active members">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BarList items={data.age_groups} format={formatNumber} emptyText="No age data" />
              <BarList items={data.gender_split} format={formatNumber} emptyText="No gender data" />
            </div>
          </Card>
        </div>
        <Card title="Class fill" subtitle="Members enrolled in each weekly class">
          <ClassFillTable rows={data.class_fill || []} />
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="analytics-money">
        <h2 id="analytics-money" className="section-title">Money</h2>
        <Card title="Revenue by month" subtitle={`Recorded payments, last 12 months (${currency})`}>
          {revenueByMonthChart}
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="By program" subtitle="Last 12 months">
            <BarList items={data.revenue_by_program} format={money} emptyText={noPayments} />
          </Card>
          <Card title="By payment method" subtitle="Last 12 months">
            <BarList items={data.revenue_by_method} format={money} emptyText={noPayments} />
          </Card>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="analytics-attendance">
        <h2 id="analytics-attendance" className="section-title">Attendance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Busiest times" subtitle="Check-ins by weekday and hour, last 8 weeks">
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
      </section>
    </div>
  );
};

export default Analytics;
