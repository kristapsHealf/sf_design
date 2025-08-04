(function () {
  'use strict';

  if (!location.pathname.includes('/portal/home') || window.__sfTierLoaded) return;
  window.__sfTierLoaded = true;

  const targets = { rise: 500, radiate: 2500, empower: null };

  let cachedNameElement, cachedRevElement;

  function whenWrapperReady(cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) return cb(w);
    const observer = new MutationObserver(() => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { observer.disconnect(); cb(w2); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function readVars () {
    cachedNameElement ||= document.getElementById('sf-campaign-name');
    cachedRevElement  ||= document.getElementById('sf-revenue');
    const rawName = cachedNameElement?.textContent.trim() || '';
    const revenue = parseFloat(cachedRevElement?.textContent.replace(/[^0-9.]/g, '') || 0);
    return { rawName, revenue };
  }

  function pickTier ({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    if (n.includes('empower') || n.includes('t3') || revenue >= 2500) return 'empower';
    if (n.includes('radiate') || n.includes('t2') || revenue >= 500) return 'radiate';
    return 'rise';
  }

  function updateBar (section, tier, revenue) {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const target = targets[tier];
    if (target === null) {
      fill.style.width = '100%';
      txt.textContent  = `£${revenue} (max tier)`;
    } else {
      const pct = Math.min(100, (revenue / target) * 100);
      fill.style.width = `${pct}%`;
      txt.textContent  = `£${revenue} / £${target}`;
    }
  }

  function showTier (tier) {
    document.querySelectorAll('.tier-section').forEach(s => s.style.display = 'none');
    const target = document.querySelector(`[data-tier="${tier}"]`);
    if (target) target.style.display = 'block';
    return target;
  }

  function boot () {
    const vars = readVars();
    const tier = pickTier(vars);
    const section = showTier(tier);
    updateBar(section, tier, vars.revenue);
  }

  function start () {
    whenWrapperReady(() => boot());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
