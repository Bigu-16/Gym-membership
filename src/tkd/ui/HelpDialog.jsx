import { AlertTriangle, CheckCircle2, Clock, Lightbulb, XCircle } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { useI18n } from '../i18n/context';
import { Dialog, Button } from './kit';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

/** Short, task-focused help for the page being shown, the colour meanings and the shortcuts. */
export default function HelpDialog({ open, onClose, page }) {
  const { t } = useI18n();
  const { club } = useApp();
  if (!open) return null;
  const tips = t(`help.page.${page}`).split('\n').filter(Boolean);
  const colours = [
    { icon: CheckCircle2, cls: 'bg-ok-soft text-ok border-ok-strong', label: t('status.active'), text: t('help.colourOk') },
    { icon: Clock, cls: 'bg-warn-soft text-warn border-warn-strong', label: t('status.expiring'), text: t('help.colourWarn', { n: club?.expiring_days ?? 7 }) },
    { icon: AlertTriangle, cls: 'bg-crit-soft text-crit border-crit-strong', label: t('status.critical'), text: t('help.colourCrit', { n: club?.critical_days ?? 2 }) },
    { icon: XCircle, cls: 'bg-crit-strong text-white border-crit-strong', label: t('status.expired'), text: t('help.colourExpired') },
  ];
  const shortcuts = [
    [[isMac ? '⌘' : 'Ctrl', 'K'], t('help.keySearch')],
    [['?'], t('help.keyHelp')],
    [['Esc'], t('help.keyClose')],
  ];
  return (
    <Dialog open={open} onClose={onClose} title={t('help.title')} wide footer={<Button data-autofocus onClick={onClose}>{t('help.gotIt')}</Button>}>
      <div className="flex flex-col gap-6">
        <section aria-labelledby="help-page">
          <h3 id="help-page" className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
            <Lightbulb className="h-5 w-5 text-brand" aria-hidden="true" /> {t('help.onThisPage', { page: t(`help.pageName.${page}`) })}
          </h3>
          <ul className="flex flex-col gap-2">
            {tips.map((tip) => (
              <li key={tip} className="rounded-xl bg-page px-4 py-2.5">{tip}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="help-colours">
          <h3 id="help-colours" className="mb-2 text-lg font-bold text-ink">{t('help.colours')}</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {colours.map((c) => (
              <div key={c.label} className="flex items-start gap-3 rounded-xl border border-line-soft p-3">
                <dt className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.95rem] font-semibold ${c.cls}`}>
                  <c.icon className="h-4 w-4" aria-hidden="true" />{c.label}
                </dt>
                <dd className="text-[0.95rem] text-muted">{c.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="help-keys" className="hidden sm:block">
          <h3 id="help-keys" className="mb-2 text-lg font-bold text-ink">{t('help.shortcuts')}</h3>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {shortcuts.map(([keys, label]) => (
              <div key={keys.join('+')} className="flex items-center justify-between gap-3 border-b border-line-soft py-1.5">
                <dt>{label}</dt>
                <dd className="flex gap-1">{keys.map((k) => <kbd key={k}>{k}</kbd>)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </Dialog>
  );
}
