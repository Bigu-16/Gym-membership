import { useState } from 'react';
import { AlertTriangle, ClipboardCheck, PackageCheck, PackagePlus, Pencil, Plus, Shirt, Truck, Undo2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { todayKey } from '../lib/dates';
import { useI18n } from '../i18n/context';
import { useToast } from '../ui/toastContext';
import { Button, Card, Checkbox, ConfirmDialog, Dialog, EmptyState, ErrorNote, Field, Input, Loading, PageHeader, Stat, TabPanel, Tabs } from '../ui/kit';
import { DateField, SellDialog } from '../ui/shared';

export default function Uniforms({ params }) {
  const { t, formatNumber } = useI18n();
  const { club } = useApp();
  const [tab, setTab] = useState(params.tab || 'stock');
  const sizes = useAsync(() => api.sizes(), [club?.id]);
  const [dialog, setDialog] = useState(null); // {type, size?}

  const list = sizes.data || [];
  const totals = list.reduce((acc, s) => ({ stock: acc.stock + s.in_stock, pending: acc.pending + s.pending, sold: acc.sold + s.sold }), { stock: 0, pending: 0, sold: 0 });
  const refresh = () => sizes.reload();

  return (
    <>
      <PageHeader
        title={t('uniforms.title')}
        actions={(
          <>
            <Button variant="secondary" icon={PackagePlus} onClick={() => setDialog({ type: 'order' })}>{t('uniforms.newOrder')}</Button>
            <Button icon={Shirt} onClick={() => setDialog({ type: 'sell' })}>{t('uniforms.sell')}</Button>
          </>
        )}
      />
      <section aria-label={t('uniforms.summary')} className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Truck} label={t('uniforms.ordered')} value={formatNumber(totals.pending)} hint={t('uniforms.orderedHint')} />
        <Stat icon={PackageCheck} tone="ok" label={t('uniforms.inStock')} value={formatNumber(totals.stock)} hint={t('uniforms.inStockHint')} />
        <Stat icon={Shirt} label={t('uniforms.sold')} value={formatNumber(totals.sold)} hint={t('uniforms.soldHint')} />
      </section>

      <Tabs label={t('uniforms.title')} value={tab} onChange={setTab}
        tabs={[{ value: 'stock', label: t('uniforms.tabStock') }, { value: 'orders', label: t('uniforms.tabOrders') }, { value: 'sales', label: t('uniforms.tabSales') }]} />

      {tab === 'stock' ? (
        <TabPanel value="stock">
          <ErrorNote error={sizes.error} onRetry={sizes.reload} />
          {sizes.loading && !sizes.data ? <Loading /> : <StockTable sizes={list} onCount={(s) => setDialog({ type: 'count', size: s })} onEdit={(s) => setDialog({ type: 'size', size: s })} />}
          <Button variant="ghost" icon={Plus} className="mt-3" onClick={() => setDialog({ type: 'size' })}>{t('uniforms.addSize')}</Button>
        </TabPanel>
      ) : null}
      {tab === 'orders' ? <TabPanel value="orders"><Orders sizes={list} onChange={refresh} onNew={() => setDialog({ type: 'order' })} /></TabPanel> : null}
      {tab === 'sales' ? <TabPanel value="sales"><Sales onChange={refresh} key={dialog ? 'open' : 'closed'} /></TabPanel> : null}

      <OrderDialog open={dialog?.type === 'order'} sizes={list} onClose={() => setDialog(null)} onDone={() => { refresh(); setTab('orders'); }} />
      <SellDialog open={dialog?.type === 'sell'} onClose={() => setDialog(null)} onDone={refresh} />
      <CountDialog size={dialog?.type === 'count' ? dialog.size : null} onClose={() => setDialog(null)} onDone={refresh} />
      <SizeDialog open={dialog?.type === 'size'} size={dialog?.size} onClose={() => setDialog(null)} onDone={refresh} />
    </>
  );
}

function StockTable({ sizes, onCount, onEdit }) {
  const { t, formatMoney } = useI18n();
  if (!sizes.length) return <EmptyState icon={Shirt} title={t('uniforms.noSizes')} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-line-soft bg-white">
      <table className="w-full text-left">
        <caption className="sr-only">{t('uniforms.tabStock')}</caption>
        <thead className="bg-page">
          <tr>
            {['size', 'ordered', 'inStock', 'sold', 'price', 'actions'].map((c) => (
              <th key={c} scope="col" className={clsx('px-4 py-3 font-semibold text-muted', ['ordered', 'inStock', 'sold'].includes(c) && 'text-right')}>{t(`uniforms.col.${c}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((s) => (
            <tr key={s.id} className={clsx('border-t border-line-soft', !s.is_active && 'opacity-70')}>
              <th scope="row" className="px-4 py-3 text-lg font-bold text-ink">
                {s.label}
                {!s.is_active ? <span className="ml-2 text-[0.9rem] font-normal text-muted">({t('uniforms.hidden')})</span> : null}
              </th>
              <td className="px-4 py-3 text-right tabular-nums">{s.pending || '—'}</td>
              <td className="px-4 py-3 text-right">
                <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold tabular-nums',
                  s.in_stock === 0 ? 'border border-crit-strong bg-crit-soft text-crit' : s.low ? 'border border-warn-strong bg-warn-soft text-warn' : 'text-ink')}>
                  {s.low ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : null}
                  {s.in_stock}
                  {s.in_stock === 0 ? <span className="font-semibold">{t('uniforms.none')}</span> : s.low ? <span className="font-semibold">{t('uniforms.low')}</span> : null}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{s.sold}</td>
              <td className="px-4 py-3 tabular-nums">{formatMoney(s.effective_price)}{s.price === null ? <span className="block text-[0.9rem] text-muted">{t('uniforms.branchPrice')}</span> : null}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1 whitespace-nowrap">
                  <Button size="sm" variant="ghost" icon={ClipboardCheck} onClick={() => onCount(s)}>{t('uniforms.count')}</Button>
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(s)}>{t('common.edit')}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders({ sizes, onChange, onNew }) {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const { club } = useApp();
  const orders = useAsync(() => api.orders(), [club?.id, sizes]);
  const [cancelling, setCancelling] = useState(null);
  const act = async (fn, message) => {
    try { await fn(); toast.success(message); orders.reload(); onChange(); } catch (err) { toast.error(err.message); }
  };
  if (orders.loading && !orders.data) return <Loading />;
  if (orders.error) return <ErrorNote error={orders.error} onRetry={orders.reload} />;
  if (!orders.data.length) return <EmptyState icon={Truck} title={t('uniforms.noOrders')} text={t('uniforms.noOrdersHint')} action={<Button icon={PackagePlus} onClick={onNew}>{t('uniforms.newOrder')}</Button>} />;
  const tone = { ordered: 'border-brand bg-tint text-brand', received: 'border-ok-strong bg-ok-soft text-ok', cancelled: 'border-line bg-page text-muted' };
  return (
    <ul className="flex flex-col gap-3">
      {orders.data.map((o) => (
        <li key={o.id}>
          <Card as="article" headingLevel={3}
            title={`${t('uniforms.orderN', { n: o.id })}${o.supplier ? ` · ${o.supplier}` : ''}`}
            action={<span className={clsx('rounded-full border px-3 py-0.5 font-semibold', tone[o.status])}>{t(`uniforms.status.${o.status}`)}</span>}>
            <p className="text-muted">
              {t('uniforms.orderedOn', { date: formatDate(o.ordered_on) })}
              {o.received_on ? ` · ${t('uniforms.receivedOn', { date: formatDate(o.received_on) })}` : ''}
              {' · '}{t('uniforms.pieces', { count: o.total_quantity, n: o.total_quantity })}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {o.lines.map((l) => <li key={l.size_id} className="rounded-md bg-page px-2 py-1 font-semibold">{t('uniforms.sizeQty', { size: l.size, n: l.quantity })}</li>)}
            </ul>
            {o.note ? <p className="mt-2">{o.note}</p> : null}
            {o.status === 'ordered' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" icon={PackageCheck} onClick={() => act(() => api.receiveOrder(o.id), t('uniforms.receivedToast'))}>{t('uniforms.markReceived')}</Button>
                <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setCancelling(o)}>{t('uniforms.cancelOrder')}</Button>
              </div>
            ) : null}
          </Card>
        </li>
      ))}
      <ConfirmDialog
        open={Boolean(cancelling)}
        title={t('uniforms.cancelOrderTitle')}
        confirmLabel={t('uniforms.cancelOrder')}
        icon={XCircle}
        onClose={() => setCancelling(null)}
        onConfirm={async () => { await act(() => api.cancelOrder(cancelling.id), t('uniforms.cancelledToast')); setCancelling(null); }}
      >
        {cancelling ? <p>{t('uniforms.cancelOrderText', { n: cancelling.id, count: cancelling.total_quantity })}</p> : null}
      </ConfirmDialog>
    </ul>
  );
}

function Sales({ onChange }) {
  const { t, formatDate, formatMoney } = useI18n();
  const toast = useToast();
  const { club } = useApp();
  const [confirm, setConfirm] = useState(null);
  const sales = useAsync(() => api.sales({ start: '2000-01-01' }), [club?.id]);
  const undo = async () => {
    try { await api.voidSale(confirm.id); toast.success(t('uniforms.saleUndone')); setConfirm(null); sales.reload(); onChange(); } catch (err) { toast.error(err.message); }
  };
  if (sales.loading && !sales.data) return <Loading />;
  if (sales.error) return <ErrorNote error={sales.error} onRetry={sales.reload} />;
  if (!sales.data.length) return <EmptyState icon={Shirt} title={t('uniforms.noSales')} />;
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line-soft bg-white">
        <table className="w-full text-left">
          <caption className="sr-only">{t('uniforms.tabSales')}</caption>
          <thead className="bg-page"><tr>
            {['date', 'buyer', 'item', 'method', 'total', 'actions'].map((c) => <th key={c} scope="col" className="px-4 py-3 font-semibold text-muted">{t(`uniforms.salesCol.${c}`)}</th>)}
          </tr></thead>
          <tbody>
            {sales.data.map((s) => (
              <tr key={s.id} className="border-t border-line-soft">
                <td className="px-4 py-3">{formatDate(s.sold_on)}</td>
                <td className="px-4 py-3">{s.guardian_id ? <a className="font-semibold text-brand underline" href={`#/family/${s.guardian_id}`}>{s.buyer}</a> : s.buyer}</td>
                <td className="px-4 py-3">{t('uniforms.sizeQty', { size: s.size, n: s.quantity })}</td>
                <td className="px-4 py-3">{t(`methods.${s.method}`)}{s.reference ? <span className="block text-[0.9rem] text-muted">{s.reference}</span> : null}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{formatMoney(s.total)}</td>
                <td className="px-4 py-3"><Button size="sm" variant="ghost" icon={Undo2} onClick={() => setConfirm(s)}>{t('common.undo')}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={Boolean(confirm)} title={t('uniforms.undoSaleTitle')} onClose={() => setConfirm(null)}
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>{t('common.cancel')}</Button><Button variant="danger" icon={Undo2} onClick={undo}>{t('common.undo')}</Button></>}>
        {confirm ? <p>{t('uniforms.undoSaleText', { size: confirm.size, n: confirm.quantity, buyer: confirm.buyer })}</p> : null}
      </Dialog>
    </>
  );
}

function OrderDialog(props) {
  return props.open ? <OrderForm {...props} /> : null;
}

function OrderForm({ open, sizes, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [qty, setQty] = useState({});
  const [supplier, setSupplier] = useState('');
  const [orderedOn, setOrderedOn] = useState(todayKey());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const total = Object.values(qty).reduce((a, b) => a + (Number(b) || 0), 0);
  const save = async () => {
    const lines = Object.entries(qty).filter(([, q]) => Number(q) > 0).map(([size_id, q]) => ({ size_id: Number(size_id), quantity: Number(q) }));
    if (!lines.length) { setError(new Error(t('uniforms.enterQty'))); return; }
    setBusy(true);
    try {
      await api.createOrder({ supplier: supplier || null, ordered_on: orderedOn, note: note || null, lines });
      toast.success(t('uniforms.orderSaved', { n: total }));
      onDone(); onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} title={t('uniforms.newOrder')} onClose={onClose} wide
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button icon={PackagePlus} loading={busy} onClick={save}>{t('uniforms.saveOrder', { n: total })}</Button></>}>
      <div className="flex flex-col gap-4">
        <p className="text-muted">{t('uniforms.orderHelp')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('uniforms.supplier')} optional><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></Field>
          <DateField label={t('uniforms.orderDate')} value={orderedOn} max={todayKey()} onChange={setOrderedOn} />
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">{t('uniforms.qtyPerSize')}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {sizes.filter((s) => s.is_active).map((s) => (
              <Field key={s.id} label={t('students.sizeN', { n: s.label })}>
                <Input type="number" min="0" inputMode="numeric" value={qty[s.id] ?? ''} onChange={(e) => setQty((q) => ({ ...q, [s.id]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </fieldset>
        <Field label={t('enrol.notes')} optional><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function CountDialog(props) {
  return props.size ? <CountForm {...props} /> : null;
}

function CountForm({ size, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [counted, setCounted] = useState(String(size.in_stock));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    setBusy(true);
    try {
      await api.stockCount({ size_id: size.id, counted: Number(counted), reason: reason.trim() || t('uniforms.countReasonDefault') });
      toast.success(t('common.saved'));
      onDone(); onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const diff = Number(counted) - size.in_stock;
  return (
    <Dialog open title={t('uniforms.countTitle', { size: size.label })} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <p>{t('uniforms.countHelp', { n: size.in_stock })}</p>
        <Field label={t('uniforms.counted')} required>
          <Input type="number" min="0" inputMode="numeric" value={counted} onChange={(e) => setCounted(e.target.value)} data-autofocus />
        </Field>
        {counted !== '' && diff !== 0 ? <p className="font-semibold">{t('uniforms.countDiff', { n: diff > 0 ? `+${diff}` : diff })}</p> : null}
        <Field label={t('uniforms.reason')} hint={t('uniforms.reasonHint')} optional><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function SizeDialog(props) {
  return props.open ? <SizeForm {...props} /> : null;
}

function SizeForm({ open, size, onClose, onDone }) {
  const { t, formatMoney } = useI18n();
  const { club } = useApp();
  const toast = useToast();
  const [label, setLabel] = useState(size?.label || '');
  const [price, setPrice] = useState(size?.price ?? '');
  const [active, setActive] = useState(size ? size.is_active : true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    setBusy(true);
    try {
      if (size) {
        await api.updateSize(size.id, { label, is_active: active, ...(price === '' || price === null ? { clear_price: true } : { price: String(price) }) });
      } else {
        await api.addSize({ label, price: price === '' ? null : String(price) });
      }
      toast.success(t('common.saved'));
      onDone(); onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} title={size ? t('uniforms.editSize', { size: size.label }) : t('uniforms.addSize')} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label={t('uniforms.size')} hint={t('uniforms.sizeLabelHint')} required><Input value={label} maxLength={10} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label={t('uniforms.unitPrice')} hint={t('uniforms.sizePriceHint', { amount: formatMoney(club.uniform_price) })} optional>
          <Input type="number" min="0" inputMode="decimal" value={price ?? ''} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        {size ? <Checkbox label={t('uniforms.showSize')} hint={t('uniforms.showSizeHint')} checked={active} onChange={(e) => setActive(e.target.checked)} /> : null}
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

