'use client';

const PREFIX = 'gamenect-lite:v1:';

const normalizeForCache = (_key: string, value: unknown) => {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) return value.toISOString();
  return value;
};

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const cacheKey = (...parts: Array<string | number | undefined | null>) =>
  PREFIX + parts.filter(Boolean).join(':');

export const readPersistentCache = <T>(key: string): T | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const writePersistentCache = <T>(key: string, value: T): void => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value, normalizeForCache));
  } catch {
    // Keep the UI responsive even if browser storage quota is full.
  }
};

export const removePersistentCache = (key: string): void => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // noop
  }
};
