import { useCallback, useState } from 'react';

// Per-device conveniences (favourites, recent searches, redeemed codes). Storage can be
// missing or throw in private windows, so every access is guarded and the page still works.
function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));

  const update = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // ignore quota / privacy-mode errors
      }
      return resolved;
    });
  }, [key]);

  return [value, update];
}

/** A bounded most-recent-first list of strings (recent searches, etc.). */
export function useRecentList(key, max = 8) {
  const [list, setList] = useLocalStorage(key, []);
  const push = useCallback((item) => {
    if (!item) return;
    setList((prev) => [item, ...prev.filter((x) => x !== item)].slice(0, max));
  }, [setList, max]);
  const clear = useCallback(() => setList([]), [setList]);
  return [list, push, clear];
}

/** A toggle-able set of strings (favourites, redeemed codes). */
export function useLocalSet(key) {
  const [list, setList] = useLocalStorage(key, []);
  const has = useCallback((item) => list.includes(item), [list]);
  const toggle = useCallback((item) => {
    setList((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }, [setList]);
  return { list, has, toggle, set: setList };
}
