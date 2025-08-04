(function () {
  'use strict';

  const INIT_DELAY = 600;

  if (!location.pathname.includes('/portal') || window.__sfTierLoaded) return;
  window.__sfTierLoaded = true;

  const targets = { rise: 500, radiate: 2500, empower: null };

  function whenWrapperReady (cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { cb(w); return; }
    new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { o.disconnect(); cb(w2); }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function readVars () {
    const nameElement = document.getElementById('sf-campaign-name');
    const revElement = document.getElementById('sf-revenue');
    const rawName = (nameElement||{}).textContent?.trim() || '';
    const rawRev = (revElement||{}).textContent?.trim() || '';
    const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
    return { rawName, revenue };
  }

  function pickTier ({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    if (n.includes('empower') || n.includes('t3')) return 'empower';
    if (n.includes('radiate') || n.includes('t2')) return 'radiate';
    if (n.includes('rise') || n.includes('t1')) return 'rise';
    if (revenue >= 2500) return 'empower';
    if (revenue >= 500) return 'radiate';
    return 'rise';
  }

  function updateBar (section, tier) {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const revenue = parseFloat((document.getElementById('sf-revenue')||{}).textContent.replace(/[^0-9.]/g,'')) || 0;
    const target = targets[tier];

    if (target === null) {
      fill.style.width = '100%';
      txt.textContent = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, revenue / target * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      fill.style.width = pct + '%';
      txt.textContent = `£${revenue} / £${target}`;
    }
  }

  function showTier (tier, wrapper) {
    const allTierSections = document.querySelectorAll('[data-tier]');
    allTierSections.forEach(s => s.style.display = 'none');
    
    const targetSection = document.querySelector(`[data-tier="${tier}"]`);
    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.style.setProperty('display', 'block', 'important');
    }
    
    updateBar(targetSection, tier);
  }

  function boot (wrapper) {
    const vars = readVars();
    const tier = pickTier(vars);
    showTier(tier, wrapper);
  }

  function start () {
    whenWrapperReady(wrapper => {
      wrapper.style.visibility = 'hidden';
      setTimeout(() => {
        wrapper.style.visibility = 'visible';
        boot(wrapper);
      }, INIT_DELAY);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
