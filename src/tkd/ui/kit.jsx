import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, Loader2, MinusCircle, X, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../i18n/context';

// ----- Buttons ----------------------------------------------------------------------------

const BUTTON = {
  primary: 'bg-brand text-white hover:bg-brand-hover border border-brand',
  secondary: 'bg-white text-brand border border-line hover:border-brand hover:bg-tint',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-tint',
  danger: 'bg-crit-strong text-white border border-crit-strong hover:brightness-90',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, loading = false, className, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
        size === 'sm' ? 'min-h-[44px] px-3 text-[0.95rem]' : 'min-h-[48px] px-5 text-base',
        BUTTON[variant],
        className,
      )}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, icon: Icon, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx('inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-tint', className)}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

// ----- Form fields ------------------------------------------------------------------------

/** Label + control + hint + error, wired with ids so screen readers announce them together. */
export function Field({ label, hint, error, required, optional, children, className }) {
  const id = useId();
  const { t } = useI18n();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const child = Children.only(children);
  const control = isValidElement(child)
    ? cloneElement(child, {
        id: child.props.id || id,
        'aria-describedby': [hintId, errorId, child.props['aria-describedby']].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
        required: required || child.props.required,
      })
    : child;
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={child.props.id || id} className="font-semibold text-ink">
        {label}
        {required ? <span className="text-crit ml-1" aria-hidden="true">*</span> : null}
        {optional ? <span className="ml-2 font-normal text-muted">({t('common.optional')})</span> : null}
      </label>
      {control}
      {hint ? <p id={hintId} className="text-[0.95rem] text-muted">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 font-semibold text-crit" role="alert">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL = 'min-h-[48px] w-full rounded-lg border border-line bg-white px-3.5 text-base text-ink transition-colors placeholder:text-muted hover:border-ink focus:border-brand aria-[invalid=true]:border-2 aria-[invalid=true]:border-crit-strong';

export const Input = ({ className, ...props }) => <input className={clsx(CONTROL, className)} {...props} />;
export const Select = ({ className, children, ...props }) => (
  <select className={clsx(CONTROL, 'pr-8', className)} {...props}>{children}</select>
);
export const Textarea = ({ className, ...props }) => <textarea className={clsx(CONTROL, 'py-2 min-h-[96px]', className)} {...props} />;

export function Checkbox({ label, hint, className, ...props }) {
  const id = useId();
  return (
    <div className={clsx('flex items-start gap-3', className)}>
      <input id={id} type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[var(--brand)]" {...props} />
      <label htmlFor={id} className="min-h-[32px] cursor-pointer">
        <span className="font-semibold text-ink">{label}</span>
        {hint ? <span className="block text-[0.95rem] text-muted">{hint}</span> : null}
      </label>
    </div>
  );
}

/** Big tappable radio cards (payment methods, classes). */
export function ChoiceGroup({ legend, name, options, value, onChange, columns = 2, error }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-ink">{legend}</legend>
      <div className={clsx('grid gap-2', columns === 4 ? 'grid-cols-2 md:grid-cols-4' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
        {options.map((opt) => {
          const checked = String(value) === String(opt.value);
          return (
            <label
              key={opt.value}
              className={clsx(
                'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2 transition-colors',
                checked ? 'border-brand bg-tint outline outline-1 outline-brand' : 'border-line bg-white hover:border-brand',
                opt.disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="h-5 w-5 shrink-0 accent-[var(--brand)]"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-ink">{opt.label}</span>
                {opt.hint ? <span className="text-[0.95rem] text-muted">{opt.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 font-semibold text-crit" role="alert">{error}</p> : null}
    </fieldset>
  );
}

// ----- Layout -----------------------------------------------------------------------------

export function Card({ title, subtitle, icon: Icon, action, children, className, as: Tag = 'section', headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <Tag className={clsx('rounded-xl border border-line-soft bg-white p-4 sm:p-5', className)}>
      {title || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <div className="flex min-w-0 items-center gap-3">
              {Icon ? <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" /> : null}
              <div className="min-w-0">
                <Heading className="text-lg font-bold text-ink">{title}</Heading>
                {subtitle ? <p className="text-[0.95rem] text-muted">{subtitle}</p> : null}
              </div>
            </div>
          ) : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

/** Page title. `crumbs` ([{label, href}]) shows where this page sits, so people never feel lost. */
export function PageHeader({ title, subtitle, actions, crumbs }) {
  const { t } = useI18n();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs?.length ? (
          <nav aria-label={t('app.breadcrumb')} className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-[0.95rem] text-muted">
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-1">
                  <a href={c.href} className="font-semibold text-brand underline-offset-2 hover:underline">{c.label}</a>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </li>
              ))}
              <li aria-current="page" className="truncate">{title}</li>
            </ol>
          </nav>
        ) : null}
        <h1 className="text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = { brand: 'text-brand', ok: 'text-ok', warn: 'text-warn', crit: 'text-crit' };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line-soft bg-white p-4 sm:p-5">
      <p className="flex items-center gap-2 text-[0.95rem] font-semibold text-muted">
        {Icon ? <Icon className={clsx('h-4 w-4 shrink-0', tones[tone])} aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="text-[1.75rem] font-bold leading-none text-ink tabular-nums">{value}</p>
      {hint ? <p className="text-[0.95rem] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef([]);
  const onKey = (event, index) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="mb-6 flex flex-wrap gap-4 border-b border-line-soft">
      {tabs.map((tab, i) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            type="button"
            id={`tab-${tab.value}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              '-mb-px min-h-[44px] border-b-[3px] px-1 font-semibold transition-colors',
              selected ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="ml-1.5 text-[0.9rem] text-muted">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export const TabPanel = ({ value, children }) => (
  <div role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} tabIndex={0}>
    {children}
  </div>
);

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-soft px-6 py-12 text-center">
      {Icon ? <Icon className="h-8 w-8 text-muted" aria-hidden="true" /> : null}
      <p className="text-lg font-bold text-ink">{title}</p>
      {text ? <p className="max-w-md text-muted">{text}</p> : null}
      {action}
    </div>
  );
}

export function Loading({ label }) {
  const { t } = useI18n();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-muted">
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
      <span>{label || t('common.loading')}</span>
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  const { t } = useI18n();
  if (!error) return null;
  const message = error.message === 'network'
    ? t('errors.network')
    : error.status >= 500 ? t('errors.server')
      : error.status === 403 ? t('errors.forbidden')
        : error.status === 404 ? t('errors.notFound')
          : error.message;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-crit-strong bg-crit-soft p-4 text-crit">
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 font-semibold">{message}</p>
      {onRetry ? <Button variant="secondary" size="sm" onClick={onRetry}>{t('common.retry')}</Button> : null}
    </div>
  );
}

export function Notice({ tone = 'info', children, icon: Icon }) {
  const tones = {
    info: 'border-brand bg-tint text-brand',
    warn: 'border-warn-strong bg-warn-soft text-warn',
    ok: 'border-ok-strong bg-ok-soft text-ok',
    crit: 'border-crit-strong bg-crit-soft text-crit',
  };
  return (
    <div className={clsx('flex items-start gap-3 rounded-lg border-l-[3px] p-4', tones[tone])}>
      {Icon ? <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : null}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ----- Expiry status ------------------------------------------------------------------------

const STATUS_STYLE = {
  active: { cls: 'bg-ok-soft text-ok border-ok-strong', icon: CheckCircle2 },
  expiring: { cls: 'bg-warn-soft text-warn border-warn-strong', icon: Clock },
  critical: { cls: 'bg-crit-soft text-crit border-crit-strong', icon: AlertTriangle },
  expired: { cls: 'bg-crit-strong text-white border-crit-strong', icon: XCircle },
  unpaid: { cls: 'bg-white text-crit border-crit-strong border-dashed', icon: AlertTriangle },
  inactive: { cls: 'bg-page text-muted border-line', icon: MinusCircle },
};

/** Expiry status with colour, icon AND words, so it never relies on colour alone. */
export function StatusBadge({ status, daysLeft, compact = false }) {
  const { t } = useI18n();
  const style = STATUS_STYLE[status] || STATUS_STYLE.inactive;
  const Icon = style.icon;
  let detail = '';
  if (daysLeft !== null && daysLeft !== undefined && status !== 'inactive') {
    if (daysLeft < 0) detail = t('status.expiredAgo', { count: -daysLeft, n: -daysLeft });
    else if (daysLeft === 0) detail = t('status.endsToday');
    else detail = t('status.daysLeft', { count: daysLeft, n: daysLeft });
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.95rem] font-semibold whitespace-nowrap', style.cls)}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {compact && detail ? detail : t(`status.${status}`)}
      {!compact && detail ? <span className="font-normal">· {detail}</span> : null}
    </span>
  );
}


export function Meter({ value, label }) {
  const pct = value === null || value === undefined ? 0 : Math.round(value * 100);
  const tone = pct >= 75 ? 'bg-ok-bar' : pct >= 50 ? 'bg-warn-bar' : 'bg-crit-bar';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-page border border-line" role="img" aria-label={label || `${pct}%`}>
        <div className={clsx('h-full', tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums font-semibold text-ink">{value === null || value === undefined ? '—' : `${pct}%`}</span>
    </div>
  );
}

// ----- Dialog -------------------------------------------------------------------------------

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal dialog: traps focus, closes on Escape, returns focus to the opener. */
export function Dialog({ open, title, onClose, children, footer, wide = false }) {
  const { t } = useI18n();
  const panel = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const first = panel.current?.querySelector('[data-autofocus]') || panel.current?.querySelector(FOCUSABLE);
    first?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const [head, tail] = [items[0], items[items.length - 1]];
        if (event.shiftKey && document.activeElement === head) { event.preventDefault(); tail.focus(); }
        else if (!event.shiftKey && document.activeElement === tail) { event.preventDefault(); head.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,42,0.5)] sm:items-center sm:p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx('anim-rise flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line-soft px-6 py-4">
          <h2 id={titleId} className="text-xl font-bold text-ink">{title}</h2>
          <IconButton label={t('common.close')} icon={X} onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * Asks before anything that is hard to take back (error prevention, user control).
 * The safe choice gets focus first, so pressing Enter never deletes by accident.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onClose, icon = AlertTriangle, danger = true }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" data-autofocus onClick={onClose}>{t('common.keep')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} icon={icon} loading={busy} onClick={run}>{confirmLabel}</Button>
        </>
      )}
    >
      {children}
    </Dialog>
  );
}
