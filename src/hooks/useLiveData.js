import { useEffect, useState } from 'react';
import { fetchLive, onLiveUpdate } from '../services/liveData';

/**
 * A live document with the bundled JSON as the first render and the fallback.
 * Returns { data, updatedAt, live } — `live` is true once a server version replaced the bundle.
 * `pick` maps the stored document to what the page wants (e.g. (doc) => doc.codes).
 */
export function useLiveData(key, fallback, { pick } = {}) {
  const [state, setState] = useState({ data: fallback, updatedAt: null, live: false });

  useEffect(() => {
    let alive = true;
    const apply = (entry) => {
      if (!alive || !entry) return;
      const value = pick ? pick(entry.value) : entry.value;
      if (value === undefined || value === null) return;
      setState({ data: value, updatedAt: entry.updatedAt, live: true });
    };
    fetchLive(key).then(apply);
    const off = onLiveUpdate(key, apply);
    return () => { alive = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
