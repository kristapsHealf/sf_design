(function () {
  'use strict';

  const targets = { rise: 500, radiate: 2500, empower: null };

  function readVars() {
    const rawName = document.getElementById('sf-campaign-name')?.textContent.trim() || '';
    const revenue = parseFloat(document.getElementById('sf-revenue')?.textContent.replace(/[^0-9.]/g, '') || 0);
    return { rawName, revenue };
  }

  function pickTier({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    if (n.includes('empower') || n.includes('t3') || revenue >= 2500) return 'empower';
    if (n.includes('radiate') || n.includes('t2') || revenue >= 500) return 'radiate';
    return 'rise';
  }

  function updateBar(section, tier, revenue) {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const target = targets[tier];
    fill.style.width = target ? `${Math.min(100, (revenue / target) * 100)}%` : '100%';
    txt.textContent = target ? `£${revenue} / £${target}` : `£${revenue} (max tier)`;
  }

  function showTier(tier) {
    document.querySelectorAll('.tier-section').forEach(s => s.style.display = 'none');
    const target = document.querySelector(`[data-tier="${tier}"]`);
    if (target) target.style.display = 'block';
    return target;
  }

  function boot() {
    const vars = readVars();
    const tier = pickTier(vars);
    const section = showTier(tier);
    updateBar(section, tier, vars.revenue);
  }

  function setupObserver() {
    const wrapper = document.getElementById('sf-campaign-wrapper');
    if (!wrapper) return;

    boot();  // Run immediately upon wrapper detection

    const observer = new MutationObserver(() => {
      observer.disconnect();  // Avoid loop
      boot();                 // Re-run on changes
      observer.observe(wrapper, { childList: true, subtree: true });
    });

    observer.observe(wrapper, { childList: true, subtree: true });
  }

  function init() {
    if (!location.pathname.includes('/portal')) return;

    new MutationObserver((_, obs) => {
      if (document.getElementById('sf-campaign-wrapper')) {
        obs.disconnect();
        setupObserver();
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
