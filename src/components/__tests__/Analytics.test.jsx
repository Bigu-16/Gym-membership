import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Analytics from '../Analytics';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: { getAnalyticsSummary: vi.fn() },
}));

const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
  '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

const makeSummary = (overrides = {}) => ({
  generated_on: '2026-10-14',
  currency: 'AED',
  totals: { total: 40, active: 32, expired: 5, frozen: 3, expiring_7_days: 4, no_package: 2, families: 6 },
  revenue_this_month: 12500,
  revenue_last_month: 10000,
  revenue_by_month: months.map((month, i) => ({ month, value: i === 11 ? 12500 : i === 10 ? 10000 : 0 })),
  revenue_by_program: [{ label: 'Karate', value: 15000 }, { label: 'Taekwondo', value: 7500 }],
  revenue_by_method: [{ label: 'Cash', value: 10000 }, { label: 'Card', value: 12500 }],
  new_members_by_month: months.map((month) => ({ month, value: 1 })),
  members_by_program: [{ label: 'Karate', value: 20 }, { label: 'No package', value: 2 }],
  members_by_plan: [],
  age_groups: [{ label: 'Kids (7–12)', value: 18 }, { label: 'Adults (18+)', value: 6 }],
  gender_split: [{ label: 'Male', value: 20 }, { label: 'Female', value: 12 }],
  check_ins_last_30_days: 287,
  check_ins_by_day: [{ date: '2026-10-13', attendance_count: 14 }, { date: '2026-10-14', attendance_count: 9 }],
  attendance_heatmap: [{ weekday: 0, hour: 16, count: 7 }, { weekday: 6, hour: 10, count: 2 }],
  class_fill: [{
    template_id: 7, title: 'Kids Karate', days: ['Monday', 'Wednesday'],
    time: '16:00 - 17:00', capacity: 15, enrolled: 12,
  }],
  renewals_last_90_days: 9,
  expired_unrenewed_last_90_days: 3,
  renewal_rate: 0.75,
  ...overrides,
});

describe('Analytics', () => {
  beforeEach(() => {
    apiService.getAnalyticsSummary.mockReset();
  });

  it('renders KPI values from the analytics summary', async () => {
    apiService.getAnalyticsSummary.mockResolvedValue(makeSummary());
    render(<Analytics />);

    expect(await screen.findByTestId('kpi-Active members')).toHaveTextContent('32');
    expect(screen.getByTestId('kpi-Revenue this month')).toHaveTextContent('12,500 AED');
    expect(screen.getByText('+25% vs last month')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-Check-ins (30 days)')).toHaveTextContent('287');
    expect(screen.getByTestId('kpi-Renewal rate')).toHaveTextContent('75%');
    expect(screen.getByTestId('kpi-Expiring in 7 days')).toHaveTextContent('4');
    // heatmap includes Sunday (has data) and expands hours to 10 AM
    expect(screen.getByLabelText('Monday 4 PM: 7 check-ins')).toBeInTheDocument();
    expect(screen.getByLabelText('Sunday 10 AM: 2 check-ins')).toBeInTheDocument();
  });

  it('shows an honest empty state when no revenue is recorded', async () => {
    apiService.getAnalyticsSummary.mockResolvedValue(makeSummary({
      revenue_this_month: 0, revenue_last_month: 0,
      revenue_by_month: months.map((month) => ({ month, value: 0 })),
      revenue_by_program: [], revenue_by_method: [], renewal_rate: null,
    }));
    render(<Analytics />);

    expect(await screen.findByTestId('kpi-Revenue this month')).toHaveTextContent('0 AED');
    expect(screen.getAllByText('No payments recorded yet').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
    expect(screen.getByTestId('kpi-Renewal rate')).toHaveTextContent('—');
  });

  it('shows an error and retries the request', async () => {
    apiService.getAnalyticsSummary
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce(makeSummary());
    render(<Analytics />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByTestId('kpi-Active members')).toHaveTextContent('32');
    expect(apiService.getAnalyticsSummary).toHaveBeenCalledTimes(2);
  });

  it('renders class fill rows with enrolled/capacity and formatted time', async () => {
    apiService.getAnalyticsSummary.mockResolvedValue(makeSummary());
    render(<Analytics />);

    const row = await screen.findByTestId('class-fill-7');
    expect(within(row).getByText('Kids Karate')).toBeInTheDocument();
    expect(within(row).getByText('12/15')).toBeInTheDocument();
    expect(within(row).getByText('Mon, Wed')).toBeInTheDocument();
    expect(within(row).getByText('4:00 PM – 5:00 PM')).toBeInTheDocument();
    expect(within(row).queryByText('Nearly full')).not.toBeInTheDocument();
  });
});
