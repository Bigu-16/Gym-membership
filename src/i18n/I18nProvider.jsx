import { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nContext } from './context';
import en from './en';
import am from './am';
import { ET_MONTHS, dayPartAm, ethiopianHour, toEthiopian } from '../lib/ethiopian';
import { parseKey, parseTime } from '../lib/dates';

const DICTS = { en, am };
const LANG_KEY = 'tkd_lang';

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

const interpolate = (text, vars) =>
  vars ? String(text).replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`)) : text;

const readLang = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'am' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return 'en';
};

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lookup(DICTS[lang], 'app.name');
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => {
    const dict = DICTS[lang];
    const t = (key, vars) => {
      let text = lookup(dict, key);
      if (text === undefined) text = lookup(en, key);
      if (text === undefined) return key;
      if (typeof text === 'object' && vars && 'count' in vars) {
        text = vars.count === 1 ? text.one : text.other;
      }
      return interpolate(text, vars);
    };
    const weekday = (index, short = false) => t(short ? `weekdays.short.${index}` : `weekdays.long.${index}`);

    /** A date key (YYYY-MM-DD) for people: Gregorian in English, Ethiopian calendar in Amharic. */
    const formatDate = (key, { withWeekday = false, withYear = true } = {}) => {
      if (!key) return '—';
      const d = parseKey(key);
      const wd = (d.getDay() + 6) % 7;
      if (lang === 'am') {
        const et = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const text = `${ET_MONTHS[et.month - 1]} ${et.day}${withYear ? `፣ ${et.year}` : ''}`;
        return withWeekday ? `${weekday(wd)}፣ ${text}` : text;
      }
      const opts = { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), ...(withWeekday ? { weekday: 'short' } : {}) };
      return d.toLocaleDateString('en-GB', opts);
    };

    /** The other calendar, as a hint under date inputs. */
    const altDate = (key) => {
      if (!key) return '';
      const d = parseKey(key);
      if (lang === 'am') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' (G.C.)';
      const et = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return `${et.day}/${et.month}/${et.year} E.C.`;
    };

    /** A class time range. English: "9:00–10:00 AM"; Amharic: "ከጠዋቱ 3:00–4:00" (Ethiopian clock). */
    const formatSlot = (slot) => {
      if (!slot) return '—';
      const s = parseTime(slot.start_time);
      const e = parseTime(slot.end_time);
      const mm = (m) => String(m).padStart(2, '0');
      if (lang === 'am') {
        return `${dayPartAm(s.h) === 'ጠዋት' ? 'ከጠዋቱ' : dayPartAm(s.h) === 'ከሰዓት' ? 'ከሰዓት' : dayPartAm(s.h)} ${ethiopianHour(s.h)}:${mm(s.m)}–${ethiopianHour(e.h)}:${mm(e.m)}`;
      }
      const h12 = (h) => ((h + 11) % 12) + 1;
      const ampm = (h) => (h < 12 ? 'AM' : 'PM');
      const startText = `${h12(s.h)}:${mm(s.m)}${ampm(s.h) === ampm(e.h) ? '' : ` ${ampm(s.h)}`}`;
      return `${startText}–${h12(e.h)}:${mm(e.m)} ${ampm(e.h)}`;
    };

    /** The other clock as a hint. */
    const slotHint = (slot) => {
      if (!slot) return '';
      const s = parseTime(slot.start_time);
      const e = parseTime(slot.end_time);
      if (lang === 'am') return `${String(s.h).padStart(2, '0')}:${String(s.m).padStart(2, '0')}–${String(e.h).padStart(2, '0')}:${String(e.m).padStart(2, '0')}`;
      return t('slots.localTime', { start: ethiopianHour(s.h), end: ethiopianHour(e.h) });
    };

    const formatMoney = (value, currency = 'ETB') => {
      const n = Number(value || 0);
      const text = n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
      return lang === 'am' ? `${text} ብር` : `${currency} ${text}`;
    };

    const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');
    const formatPercent = (rate) => (rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`);

    return { lang, setLang, t, weekday, formatDate, altDate, formatSlot, slotHint, formatMoney, formatNumber, formatPercent };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
