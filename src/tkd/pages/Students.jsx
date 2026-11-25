import { useEffect, useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { navigate } from '../lib/router';
import { useI18n } from '../i18n/context';
import { Button, Checkbox, EmptyState, ErrorNote, Field, Input, Loading, PageHeader, Select, StatusBadge } from '../ui/kit';
import { STATUS_ROW } from '../lib/constants';
import { SlotText } from '../ui/shared';

const FILTERS = [
  { value: '', key: 'students.filterAll' },
  { value: 'critical,expiring', key: 'students.filterEnding' },
  { value: 'expired,unpaid', key: 'students.filterExpired' },
  { value: 'active', key: 'students.filterPaid' },
];

export default function Students({ params }) {
  const { t, formatDate, formatSlot } = useI18n();
  const { activeSlots, slotById, club } = useApp();
  const [search, setSearch] = useState(params.q || '');
  const [query, setQuery] = useState(params.q || '');
  const [status, setStatus] = useState(params.status || '');
  const [slotId, setSlotId] = useState(params.slot || '');
  const [showLeft, setShowLeft] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, error, loading, reload } = useAsync(
    () => api.students({ search: query, status: status || undefined, slot_id: slotId || undefined, include_inactive: showLeft }),
    [query, status, slotId, showLeft, club?.id],
  );

  return (
    <>
      <PageHeader
        title={t('students.title')}
        subtitle={data ? t('students.count', { count: data.length, n: data.length }) : undefined}
        actions={<Button icon={UserPlus} onClick={() => navigate('/enrol')}>{t('nav.enrol')}</Button>}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <Field label={t('students.search')}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input type="search" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('students.searchHint')} />
          </div>
        </Field>
        <Field label={t('students.class')}>
          <Select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
            <option value="">{t('students.allClasses')}</option>
            {activeSlots.map((s) => <option key={s.id} value={s.id}>{formatSlot(s)}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label={t('students.filterBy')}>
        {FILTERS.map((f) => (
          <button key={f.value} type="button" aria-pressed={status === f.value} onClick={() => setStatus(f.value)}
            className={clsx('min-h-[44px] rounded-full border-2 px-4 font-semibold',
              status === f.value ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand')}>
            {t(f.key)}
          </button>
        ))}
        <Checkbox className="ml-2" label={t('students.showLeft')} checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} />
      </div>

      {error ? <ErrorNote error={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}
      {data && !data.length ? (
        <EmptyState icon={Users} title={query || status ? t('students.noMatch') : t('students.empty')}
          action={!query && !status ? <Button icon={UserPlus} onClick={() => navigate('/enrol')}>{t('nav.enrol')}</Button> : null} />
      ) : null}

      {data && data.length ? (
        <>
          {/* Wide screens: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-line-soft bg-white shadow-card md:block">
            <table className="w-full text-left">
              <caption className="sr-only">{t('students.title')}</caption>
              <thead className="bg-page">
                <tr>
                  {['kid', 'parent', 'class', 'size', 'ends', 'status'].map((c) => (
                    <th key={c} scope="col" className="px-4 py-3 font-semibold text-muted">{t(`students.col.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((kid) => (
                  <tr key={kid.id} className={clsx('border-t border-line-soft', STATUS_ROW[kid.status])}>
                    <td className="px-4 py-3">
                      <a href={`#/family/${kid.guardian_id}`} className="font-semibold text-brand underline underline-offset-2">{kid.name}</a>
                      {kid.age ? <span className="block text-[0.95rem] text-muted">{t('students.age', { n: kid.age })}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      {kid.guardian_name}
                      <a href={`tel:${kid.guardian_phone}`} className="block text-[0.95rem] text-muted underline">{kid.guardian_phone}</a>
                    </td>
                    <td className="px-4 py-3"><SlotText slot={slotById[kid.slot_id]} /></td>
                    <td className="px-4 py-3 font-semibold">{kid.uniform_size || '—'}</td>
                    <td className="px-4 py-3">
                      {formatDate(kid.expiry_date)}
                      {kid.classes_left !== null ? <span className="block text-[0.95rem] text-muted">{t('status.classesLeft', { count: kid.classes_left, n: kid.classes_left })}</span> : null}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={kid.status} daysLeft={kid.days_left} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {data.map((kid) => (
              <li key={kid.id}>
                <a href={`#/family/${kid.guardian_id}`} className={clsx('block rounded-xl border border-line-soft bg-white p-4 shadow-card', STATUS_ROW[kid.status])}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-bold text-brand">{kid.name}</p>
                    {kid.uniform_size ? <span className="rounded-md bg-tint px-2 font-semibold text-brand">{t('students.sizeN', { n: kid.uniform_size })}</span> : null}
                  </div>
                  <p className="text-muted">{kid.guardian_name} · {kid.guardian_phone}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={kid.status} daysLeft={kid.days_left} compact />
                    <span className="text-muted">{formatSlot(slotById[kid.slot_id])}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

