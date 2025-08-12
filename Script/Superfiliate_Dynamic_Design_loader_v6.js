(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 320;   // ms after first paint
  
  // Check if we're on a portal page
  if (!location.pathname.includes('/portal')) {
    return;
  }

  // Better SPA protection - track navigation state more robustly
  const pageKey = location.pathname;
  const flagKey = `__sfTierLoaded_${pageKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Track if we're currently processing to prevent multiple simultaneous runs
  let isProcessing = false;
  let currentObserver = null;
  let navigationHistory = new Set();
  
  // Initialize navigation tracking
  if (!window.__sfNavigationTracker) {
    window.__sfNavigationTracker = {
      currentPage: pageKey,
      visitedPages: new Set(),
      lastProcessedPage: null
    };
  }
  
  const tracker = window.__sfNavigationTracker;
  tracker.visitedPages.add(pageKey);
  
  // Check if we need to process this page
  const shouldProcessPage = () => {
    // Always process if this is a new page
    if (!tracker.visitedPages.has(pageKey)) {
      return true;
    }
    
    // Process if we're returning to a page after navigating away
    if (tracker.currentPage !== pageKey) {
      return true;
    }
    
    // Process if this page hasn't been processed yet
    if (tracker.lastProcessedPage !== pageKey) {
      return true;
    }
    
    return false;
  };
  
  if (!shouldProcessPage()) {
    return;
  }
  
  // Update tracker state
  tracker.currentPage = pageKey;
  tracker.lastProcessedPage = pageKey;
  
  const targets = { rise: 500, radiate: 2500, empower: null };
  
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

  // Enhanced navigation detection for complex SPA routing
  let lastPathname = location.pathname;
  let navigationTimeout = null;
  
  // Function to handle navigation changes
  function handleNavigationChange(newPathname) {
    if (newPathname === lastPathname) {
      return;
    }
    
    // Clear any pending timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
    }
    
    // Update tracker
    tracker.currentPage = newPathname;
    tracker.visitedPages.add(newPathname);
    
    // Reset processing flag for new page
    isProcessing = false;
    
    // Clean up observer
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }
    
    // Update last pathname
    lastPathname = newPathname;
    
    // If we're on a portal page, restart the process after a short delay
    if (newPathname.includes('/portal')) {
      navigationTimeout = setTimeout(() => {
        // Check if we should process this page
        if (shouldProcessPage()) {
          tracker.lastProcessedPage = newPathname;
          start();
        }
      }, 150); // Slightly longer delay to ensure DOM is ready
    }
  }
  
  // Check for pathname changes periodically (for SPA navigation)
  setInterval(() => {
    handleNavigationChange(location.pathname);
  }, 100); // Check every 100ms
  
  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      handleNavigationChange(location.pathname);
    }, 50);
  });
  
  // Listen for pushstate/replacestate (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(() => {
      handleNavigationChange(location.pathname);
    }, 50);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => {
      handleNavigationChange(location.pathname);
    }, 50);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      start();
    }, { once: true });
  } else {
    start();
  }
})();
