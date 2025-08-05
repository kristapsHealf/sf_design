(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 280;   // ms after first paint
  if (!location.pathname.includes('/portal') || window.__sfTierLoaded) {
    return;
  }
  
  window.__sfTierLoaded = true;
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

    const result = { rawName, revenue };
    return result;
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
    
    if (!section) {
      return;
    }
    
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    
    
    if (!fill || !txt) {
      const allDivs = section.querySelectorAll('div');
      allDivs.forEach((div, index) => {
      });
      return;
    }

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
   
  

    // Find all sections with data-tier attribute (more robust)
    const allTierSections = document.querySelectorAll('[data-tier]');
    
    // Log all sections for debugging
    allTierSections.forEach((s, i) => {
    });
    
    // First, hide ALL tier sections
    allTierSections.forEach(s => {
      s.style.display = 'none';
    });
    
    // Then show only the target tier
    const targetSection = document.querySelector(`[data-tier="${tier}"]`);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Force it to be visible with !important
      targetSection.style.setProperty('display', 'block', 'important');
      
      // Additional debugging
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(targetSection);
      }, 100);
    } else {
    }
    
    updateBar(targetSection, tier);
  }

  /* main work ------------------------------------------------ */
  function boot (wrapper) {
    
    const vars = readVars();
    const tier = pickTier(vars);
    
    showTier(tier, wrapper);
    
  }

  /* kick‑off ------------------------------------------------- */
  function start () {
    
    whenWrapperReady(wrapper => {
      
      /* initial run */
      wrapper.style.visibility = 'hidden';            // hide to prevent flash
      setTimeout(() => {
        wrapper.style.visibility = 'visible';         // reveal after tier set
        boot(wrapper);
      }, INIT_DELAY);

      /* re‑run when the builder mutates the DOM */
      // TEMPORARILY DISABLED - focusing on basic functionality first
      
      /*
      let pending = false;
      let lastTier = null;
      console.log('👀 Setting up MutationObserver for DOM changes...');
      
      new MutationObserver((mutations) => {
        if (pending) {
          console.log('⏳ Mutation already pending, skipping...');
          return;
        }
        
        // Check if this mutation was caused by our own script
        const isOwnMutation = mutations.some(mutation => 
          mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'data-tier')
        );
        
        if (isOwnMutation) {
          console.log('🚫 Ignoring own DOM mutation to prevent infinite loop');
          return;
        }
        
        console.log('🔄 DOM mutation detected:', mutations.length, 'changes');
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          setTimeout(() => {
            console.log('⏰ Mutation-triggered boot timeout triggered');
            const currentTier = pickTier(readVars());
            if (currentTier !== lastTier) {
              console.log('🔄 Tier changed from', lastTier, 'to', currentTier);
              lastTier = currentTier;
              boot(wrapper);
            } else {
              console.log('⏭️ Tier unchanged, skipping boot');
            }
          }, MUTATION_DELAY);
        });
      }).observe(wrapper, { childList: true, subtree: true });
      */
      
    });
  }

  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      start();
    }, { once: true });
  } else {
    start();
  }
})();
