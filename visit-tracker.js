// Records one visit per browser session, on any page that includes this script.
// The session flag is set only after the server confirms the visit, so a failed
// request is retried on the next page view instead of being skipped for the session.
// window.hwTrack resolves once tracking has settled, with the visitor's place
// ("City, CC") or ''. Pages that read /api/visitors wait for it, so the data
// they get already includes this visit.
window.hwTrack = (() => {
  const get = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  if (get('hw_tracked')) return Promise.resolve(get('hw_place') || '');
  return fetch('/api/track', { method: 'POST' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d || !d.ok) return '';
      const place = [d.city, d.country].filter(Boolean).join(', ');
      set('hw_tracked', '1');
      set('hw_place', place);
      return place;
    })
    .catch(() => '');
})();
