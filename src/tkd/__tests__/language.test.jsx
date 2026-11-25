import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n/I18nProvider';
import { useI18n } from '../i18n/context';
import { StatusBadge } from '../ui/kit';

function Probe() {
  const { t, formatSlot, formatDate, formatMoney, setLang, lang } = useI18n();
  return (
    <div>
      <p data-testid="nav">{t('nav.attendance')}</p>
      <p data-testid="slot">{formatSlot({ start_time: '09:00:00', end_time: '10:00:00' })}</p>
      <p data-testid="afternoon">{formatSlot({ start_time: '14:00:00', end_time: '15:00:00' })}</p>
      <p data-testid="date">{formatDate('2026-09-11')}</p>
      <p data-testid="money">{formatMoney('1500')}</p>
      <StatusBadge status="expiring" daysLeft={3} />
      <button type="button" onClick={() => setLang(lang === 'en' ? 'am' : 'en')}>toggle</button>
    </div>
  );
}

describe('language toggle', () => {
  it('switches every label, the clock and the calendar', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('nav')).toHaveTextContent('Attendance');
    expect(screen.getByTestId('slot')).toHaveTextContent('9:00–10:00 AM');
    expect(screen.getByTestId('date')).toHaveTextContent('11 Sept 2026');
    expect(screen.getByTestId('money')).toHaveTextContent('ETB 1,500');
    expect(screen.getByText('Ending soon')).toBeInTheDocument();
    expect(screen.getByText(/3 days left/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('toggle'));
    expect(document.documentElement.lang).toBe('am');
    expect(screen.getByTestId('nav')).toHaveTextContent('ተገኝነት');
    expect(screen.getByTestId('slot')).toHaveTextContent('ከጠዋቱ 3:00–4:00');
    expect(screen.getByTestId('afternoon')).toHaveTextContent('ከሰዓት 8:00–9:00');
    expect(screen.getByTestId('date')).toHaveTextContent('መስከረም 1፣ 2019');
    expect(screen.getByTestId('money')).toHaveTextContent('1,500 ብር');
    expect(screen.getByText('በቅርቡ ያበቃል')).toBeInTheDocument();
  });
});
