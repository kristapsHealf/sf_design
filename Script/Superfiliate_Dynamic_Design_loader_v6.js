(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 600;   // ms after first paint
  const MUTATION_DELAY = 150;   // ms debounce on DOM changes

  if (!location.pathname.includes('/portal/home') || window.__sfTierLoaded) return;
  window.__sfTierLoaded = true;

  const targets = { rise: 500, radiate: 2500, empower: null };

  /* wait until React renders the wrapper */
  function whenWrapperReady (cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { cb(w); return; }
    new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { o.disconnect(); cb(w2); }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* helpers -------------------------------------------------- */
  function readVars () {
    const rawName = (document.getElementById('sf-campaign-name')||{}).textContent?.trim() || '';
    const rawRev  = (document.getElementById('sf-revenue')      ||{}).textContent?.trim() || '';
    return { rawName, revenue: parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0 };
  }

  function pickTier ({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    if (n.includes('empower') || n.includes('t3')) return 'empower';
    if (n.includes('radiate') || n.includes('t2')) return 'radiate';
    if (n.includes('rise')    || n.includes('t1')) return 'rise';
    if (revenue >= 2500) return 'empower';
    if (revenue >=  500) return 'radiate';
    return 'rise';
  }

  function updateBar (section, tier) {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const revenue = parseFloat((document.getElementById('sf-revenue')||{}).textContent.replace(/[^0-9.]/g,'')) || 0;
    const target  = targets[tier];

    if (target === null) {
      fill.style.width = '100%';
      txt.textContent  = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, revenue / target * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      fill.style.width = pct + '%';
      txt.textContent  = `£${revenue} / £${target}`;
    }
  }

  function showTier (tier, wrapper) {
    wrapper.querySelectorAll('.tier-section').forEach(sec => {
      const on = sec.dataset.tier === tier;
      sec.style.setProperty('display', on ? 'block' : 'none', 'important');
    });
    updateBar(wrapper.querySelector(`[data-tier="${tier}"]`), tier);
  }

  /* main work ------------------------------------------------ */
  function boot (wrapper) {
    showTier(pickTier(readVars()), wrapper);
  }

  /* kick‑off ------------------------------------------------- */
  function start () {
    whenWrapperReady(wrapper => {
      /* initial run */
      setTimeout(() => boot(wrapper), INIT_DELAY);

      /* re‑run when the builder mutates the DOM */
      let pending = false;
      new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          setTimeout(() => boot(wrapper), MUTATION_DELAY);
        });
      }).observe(wrapper, { childList: true, subtree: true });
    });
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
})();