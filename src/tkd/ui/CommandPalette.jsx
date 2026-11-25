import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, Search, User } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { NAV } from '../lib/nav';
import { useI18n } from '../i18n/context';
import { StatusBadge } from './kit';

/**
 * Quick search (Ctrl/⌘+K or "/"): jump to any page, or find a kid or parent by name or phone.
 * A shortcut for people who use the app every day; everything here is also in the menu.
 */
export default function CommandPalette({ open, onClose }) {
  return open ? <PaletteBody onClose={onClose} /> : null;
}

function PaletteBody({ onClose }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [kids, setKids] = useState([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const listId = useId();
  const opener = useRef(document.activeElement);

  useEffect(() => {
    input.current?.focus();
    const back = opener.current;
    return () => back?.focus?.();
  }, []);

  const query = text.trim();
  useEffect(() => {
    if (query.length < 2) return undefined;
    let live = true;
    const id = setTimeout(() => {
      setSearching(true);
      api.students({ search: query, include_inactive: true })
        .then((list) => { if (live) setKids(list.slice(0, 6)); })
        .catch(() => { if (live) setKids([]); })
        .finally(() => { if (live) setSearching(false); });
    }, 200);
    return () => { live = false; clearTimeout(id); };
  }, [query]);

  const items = useMemo(() => {
    const lower = query.toLowerCase();
    const pages = NAV
      .filter((n) => !lower || t(n.key).toLowerCase().includes(lower))
      .map((n) => ({ id: `page-${n.path}`, kind: 'page', icon: n.icon, label: t(n.key), href: n.path }));
    const people = query.length >= 2
      ? kids.map((k) => ({ id: `kid-${k.id}`, kind: 'kid', icon: User, label: k.name, sub: `${k.guardian_name} · ${k.guardian_phone}`, href: `/family/${k.guardian_id}`, kid: k }))
      : [];
    return [...people, ...pages];
  }, [query, kids, t]);

  const current = Math.min(active, Math.max(items.length - 1, 0));
  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.href);
  };

  const onKey = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActive((current + 1) % Math.max(items.length, 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((current - 1 + items.length) % Math.max(items.length, 1)); }
    else if (event.key === 'Enter') { event.preventDefault(); go(items[current]); }
  };

  return (
    <div className="anim-fade fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(15,23,42,0.55)] px-3 pt-[10vh] backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('search.title')} onClick={(e) => e.stopPropagation()}
        className="anim-rise w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-line-soft px-4">
          {searching ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" aria-hidden="true" /> : <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />}
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[current] ? `${listId}-${items[current].id}` : undefined}
            aria-label={t('search.title')}
            placeholder={t('search.placeholder')}
            value={text}
            onChange={(e) => { setText(e.target.value); setActive(0); if (e.target.value.trim().length < 2) setKids([]); }}
            onKeyDown={onKey}
            className="min-h-[60px] flex-1 bg-transparent text-lg text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd>Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label={t('search.results')} className="max-h-[55vh] overflow-y-auto p-2">
          {items.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${item.id}`}
              role="option"
              aria-selected={i === current}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={clsx('flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl px-3 py-2', i === current ? 'bg-tint' : '')}
            >
              <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.kind === 'kid' ? 'bg-brand text-white' : 'bg-page text-brand')}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{item.label}</span>
                <span className="block truncate text-[0.95rem] text-muted">{item.sub || t('search.goTo')}</span>
              </span>
              {item.kid ? <StatusBadge status={item.kid.status} daysLeft={item.kid.days_left} compact /> : null}
              {i === current ? <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /> : null}
            </li>
          ))}
          {!items.length ? (
            <li className="px-3 py-8 text-center text-muted">{searching ? t('common.loading') : t('search.none', { q: query })}</li>
          ) : null}
        </ul>
        <p className="hidden border-t border-line-soft bg-page px-4 py-2.5 text-[0.95rem] text-muted sm:block">
          <kbd>↑</kbd> <kbd>↓</kbd> {t('search.hintMove')} · <kbd>Enter</kbd> {t('search.hintOpen')}
        </p>
      </div>
    </div>
  );
}
