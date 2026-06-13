// Records one visit per browser session, on any page that includes this script.
// Shares the same sessionStorage flag as hello-world.html, so a single visit
// is recorded only once no matter how many pages the visitor opens.
if (!sessionStorage.getItem('hw_tracked')) {
  fetch('/api/track', { method: 'POST' })
    .then(() => sessionStorage.setItem('hw_tracked', '1'))
    .catch(() => {});
}
