(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 320;   // ms after first paint
  
  // Check if we're on a portal page
  if (!location.pathname.includes('/portal')) {
    return;
  }

  // Better SPA protection - use a more specific flag per page
  const pageKey = location.pathname;
  const flagKey = `__sfTierLoaded_${pageKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Check if already loaded for this specific page
  if (window[flagKey]) {
    return;
  }
  
  // Set the flag for this specific page
  window[flagKey] = true;
  
  // Clean up old flags when navigating (keep only current page)
  Object.keys(window).forEach(key => {
    if (key.startsWith('__sfTierLoaded_') && key !== flagKey) {
      delete window[key];
    }
  });

  const targets = { rise: 500, radiate: 2500, empower: null };
  
  // Track if we're currently processing to prevent multiple simultaneous runs
  let isProcessing = false;
  let currentObserver = null;
  
  /* wait until React renders the wrapper */
  function whenWrapperReady (cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { 
      cb(w); 
      return; 
    }
    
    // Clean up any existing observer
    if (currentObserver) {
      currentObserver.disconnect();
    }
    
    currentObserver = new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { 
        o.disconnect(); 
        currentObserver = null;
        cb(w2); 
      }
    });
    
    currentObserver.observe(document.body, { childList: true, subtree: true });
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
    if (isProcessing) {
      return; // Prevent multiple simultaneous executions
    }
    
    isProcessing = true;

    // Find all sections with data-tier attribute (more robust)
    const allTierSections = document.querySelectorAll('[data-tier]');
    
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
    }
    
    updateBar(targetSection, tier);
    isProcessing = false;
  }

  /* main work ------------------------------------------------ */
  function boot (wrapper) {
    if (isProcessing) {
      return; // Prevent multiple simultaneous executions
    }
    
    const vars = readVars();
    const tier = pickTier(vars);
    
    showTier(tier, wrapper);
  }

  /* kick‑off ------------------------------------------------- */
  function start () {
    if (isProcessing) {
      return; // Prevent multiple simultaneous executions
    }
    
    whenWrapperReady(wrapper => {
      
      /* initial run */
      wrapper.style.visibility = 'hidden';            // hide to prevent flash
      setTimeout(() => {
        wrapper.style.visibility = 'visible';         // reveal after tier set
        boot(wrapper);
      }, INIT_DELAY);
    });
  }

  // Listen for navigation events (for SPA)
  let lastPathname = location.pathname;
  
  // Check for pathname changes periodically (for SPA navigation)
  setInterval(() => {
    if (location.pathname !== lastPathname) {
      lastPathname = location.pathname;
      
      // Reset processing flag for new page
      isProcessing = false;
      
      // Clean up observer
      if (currentObserver) {
        currentObserver.disconnect();
        currentObserver = null;
      }
      
      // If we're on a portal page, restart the process
      if (location.pathname.includes('/portal')) {
        const newPageKey = location.pathname;
        const newFlagKey = `__sfTierLoaded_${newPageKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Only restart if not already loaded for this page
        if (!window[newFlagKey]) {
          window[newFlagKey] = true;
          start();
        }
      }
    }
  }, 100); // Check every 100ms
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      start();
    }, { once: true });
  } else {
    start();
  }
})();
