(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 600;   // ms after first paint
  const MUTATION_DELAY = 150;   // ms debounce on DOM changes

  if (!location.pathname.includes('/portal') || window.__sfTierLoaded) {
    return;
  }
  
  window.__sfTierLoaded = true;

  /* anti-flash guard: keep wrapper invisible until boot() finishes */
  const flashGuard = document.createElement('style');
  flashGuard.textContent = '#sf-campaign-wrapper{visibility:hidden}';
  document.head.appendChild(flashGuard);

  const targets = { rise: 500, radiate: 2500, empower: null };

  /* wait until React renders the wrapper */
  function whenWrapperReady (cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { 
      cb(w); 
      return; 
    }
    new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { 
        o.disconnect(); 
        cb(w2); 
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* helpers -------------------------------------------------- */
  function readVars () {
    const nameElement = document.getElementById('sf-campaign-name');
    const revElement = document.getElementById('sf-revenue');
    
    const rawName = (nameElement||{}).textContent?.trim() || '';
    const rawRev  = (revElement||{}).textContent?.trim() || '';
    
    const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
    
    return { rawName, revenue };
  }

  function pickTier ({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    
    if (n.includes('empower') || n.includes('t3')) {
      return 'empower';
    }
    if (n.includes('radiate') || n.includes('t2')) {
      return 'radiate';
    }
    if (n.includes('rise')    || n.includes('t1')) {
      return 'rise';
    }
    
    if (revenue >= 2500) {
      return 'empower';
    }
    if (revenue >=  500) {
      return 'radiate';
    }
    
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
    // Find all sections with data-tier attribute
    const allTierSections = document.querySelectorAll('[data-tier]');
    
    // First, hide ALL tier sections
    allTierSections.forEach(s => {
      s.style.display = 'none';
    });
    
    // Then show only the target tier
    const targetSection = document.querySelector(`[data-tier="${tier}"]`);
    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.style.setProperty('display', 'block', 'important');
    }
    
    updateBar(targetSection, tier);
  }

  /* main work ------------------------------------------------ */
  function boot (wrapper) {
    const vars = readVars();
    const tier = pickTier(vars);
    showTier(tier, wrapper);
    flashGuard.remove();          // reveal finished design

  }

  /* kick‑off ------------------------------------------------- */
  function start () {
    whenWrapperReady(wrapper => {
      /* initial run */
      const t0 = Date.now();
      const poll = setInterval(() => {
        const { rawName, revenue } = readVars();
        const dataReady = rawName && !isNaN(revenue);
        const waited = Date.now() - t0 >= INIT_DELAY;

        if (dataReady || waited) {
          clearInterval(poll);                        // stop polling
          boot(wrapper);                              // run once
          wrapper.style.visibility = '';       // reveal
        }
      }, 50);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
