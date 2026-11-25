import { useState } from 'react';
import clsx from 'clsx';
import { todayKey } from '../lib/dates';
import { PRESETS } from '../lib/ranges';
import { useI18n } from '../i18n/context';
import { DateField } from './shared';

export function RangePicker({ value, onChange, presets = ['last4w', 'thisMonth', 'lastMonth', 'last3m'] }) {
  const { t } = useI18n();
  const [custom, setCustom] = useState(value.preset === 'custom');
  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('range.label')}>
        {presets.map((p) => (
          <button key={p} type="button" aria-pressed={value.preset === p && !custom}
            onClick={() => { setCustom(false); onChange({ preset: p, ...PRESETS[p]() }); }}
            className={clsx('min-h-[44px] rounded-full border px-4 font-semibold',
              value.preset === p && !custom ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand')}>
            {t(`range.${p}`)}
          </button>
        ))}
        <button type="button" aria-pressed={custom} onClick={() => setCustom(true)}
          className={clsx('min-h-[44px] rounded-full border px-4 font-semibold', custom ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand')}>
          {t('range.custom')}
        </button>
      </div>
      {custom ? (
        <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2">
          <DateField label={t('range.from')} value={value.start} max={value.end} onChange={(v) => v && onChange({ ...value, preset: 'custom', start: v })} />
          <DateField label={t('range.to')} value={value.end} max={todayKey()} onChange={(v) => v && onChange({ ...value, preset: 'custom', end: v })} />
        </div>
      ) : null}
    </div>
  );
}
