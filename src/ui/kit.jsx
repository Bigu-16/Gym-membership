import { Children, cloneElement, isValidElement, useEffect, useId, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, MinusCircle, X, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../i18n/context';

// ----- Buttons ----------------------------------------------------------------------------

const BUTTON = {
  primary: 'bg-brand text-white hover:bg-brand-hover border border-brand',
  secondary: 'bg-white text-brand border-2 border-brand hover:bg-tint',
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
      className={clsx('inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-tint', className)}
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

const CONTROL = 'min-h-[48px] w-full rounded-lg border-2 border-line bg-white px-3 text-base text-ink placeholder:text-muted';

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
                'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2',
                checked ? 'border-brand bg-tint' : 'border-line bg-white hover:border-brand',
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

export function Card({ title, action, children, className, as: Tag = 'section', headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <Tag className={clsx('rounded-xl border border-line-soft bg-white p-4 shadow-card sm:p-5', className)}>
      {title || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title ? <Heading className="text-lg font-bold text-ink">{title}</Heading> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-tint text-brand',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    crit: 'bg-crit-soft text-crit',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-white p-4 shadow-card">
      {Icon ? (
        <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
        {hint ? <p className="text-[0.95rem] text-muted">{hint}</p> : null}
      </div>
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
    <div role="tablist" aria-label={label} className="mb-5 flex flex-wrap gap-1 border-b-2 border-line-soft">
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
              '-mb-[2px] min-h-[48px] border-b-4 px-4 font-semibold',
              selected ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="ml-2 rounded-full bg-tint px-2 text-[0.9rem] text-brand">{tab.count}</span> : null}
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
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-soft bg-white px-6 py-10 text-center">
      {Icon ? <Icon className="h-10 w-10 text-brand" aria-hidden="true" /> : null}
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
  const message = error.message === 'network' ? t('errors.network') : error.message;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-crit-strong bg-crit-soft p-4 text-crit">
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
    <div className={clsx('flex items-start gap-3 rounded-lg border-l-4 p-3', tones[tone])}>
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
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[0.95rem] font-semibold whitespace-nowrap', style.cls)}>
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
      <div className="h-3 w-24 overflow-hidden rounded-full bg-page border border-line" role="img" aria-label={label || `${pct}%`}>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,24,39,0.6)] sm:items-center sm:p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx('flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line-soft px-5 py-3">
          <h2 id={titleId} className="text-xl font-bold text-ink">{title}</h2>
          <IconButton label={t('common.close')} icon={X} onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
