import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import en from '../i18n/en';
import am from '../i18n/am';

const isPlural = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => k === 'one' || k === 'other');

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) return value.map((_, i) => `${path}.${i}`);
    if (value && typeof value === 'object' && !isPlural(value)) return flatten(value, path);
    return [path];
  });

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.(jsx?|tsx?)$/.test(name) ? [path] : [];
  });

describe('translations', () => {
  const enKeys = new Set(flatten(en));
  const amKeys = new Set(flatten(am));

  it('has every English key in Amharic and nothing extra', () => {
    expect([...enKeys].filter((k) => !amKeys.has(k))).toEqual([]);
    expect([...amKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it('has no empty translations', () => {
    const empty = [...amKeys].filter((k) => {
      const v = k.split('.').reduce((n, p) => n?.[p], am);
      return typeof v === 'string' && !v.trim();
    });
    expect(empty).toEqual([]);
  });

  it('defines every key the screens use', () => {
    const root = join(cwd(), 'src');
    const used = new Set();
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
      for (const m of text.matchAll(/key: '([a-z]+\.[a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
    }
    const resolves = (key) => {
      const v = key.split('.').reduce((n, p) => n?.[p], en);
      return v !== undefined;
    };
    expect([...used].filter((k) => !resolves(k))).toEqual([]);
  });

  it('keeps the same {placeholders} in both languages', () => {
    const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const mismatched = [];
    for (const key of enKeys) {
      const get = (dict) => key.split('.').reduce((n, p) => n?.[p], dict);
      const e = get(en);
      const a = get(am);
      const eText = isPlural(e) ? e.other : e;
      const aText = isPlural(a) ? a.other : a;
      if (JSON.stringify([...new Set(vars(eText))]) !== JSON.stringify([...new Set(vars(aText))])) mismatched.push(key);
    }
    expect(mismatched).toEqual([]);
  });
});
