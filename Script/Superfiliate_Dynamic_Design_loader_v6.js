(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 600;   // ms after first paint
  const MUTATION_DELAY = 150;   // ms debounce on DOM changes

  console.log('🚀 SF Portal Design Loader v6 starting...');
  console.log('📍 Current pathname:', location.pathname);
  console.log('🔍 Checking if already loaded:', window.__sfTierLoaded);

  if (!location.pathname.includes('/portal/home') || window.__sfTierLoaded) {
    console.log('❌ Script skipped - not on portal/home or already loaded');
    return;
  }
  
  window.__sfTierLoaded = true;
  console.log('✅ Script initialization complete');

  const targets = { rise: 500, radiate: 2500, empower: null };
  console.log('🎯 Tier targets configured:', targets);

  /* wait until React renders the wrapper */
  function whenWrapperReady (cb) {
    console.log('🔍 Looking for sf-campaign-wrapper...');
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { 
      console.log('✅ Wrapper found immediately');
      cb(w); 
      return; 
    }
    console.log('⏳ Wrapper not found, setting up MutationObserver...');
    new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { 
        console.log('✅ Wrapper found via MutationObserver');
        o.disconnect(); 
        cb(w2); 
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* helpers -------------------------------------------------- */
  function readVars () {
    console.log('📖 Reading campaign variables...');
    
    const nameElement = document.getElementById('sf-campaign-name');
    const revElement = document.getElementById('sf-revenue');
    
    console.log('🏷️ Campaign name element:', nameElement);
    console.log('💰 Revenue element:', revElement);
    
    const rawName = (nameElement||{}).textContent?.trim() || '';
    const rawRev  = (revElement||{}).textContent?.trim() || '';
    
    console.log('📝 Raw campaign name:', `"${rawName}"`);
    console.log('💵 Raw revenue text:', `"${rawRev}"`);
    
    const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
    console.log('🔢 Parsed revenue:', revenue);
    
    const result = { rawName, revenue };
    console.log('📊 Final variables:', result);
    return result;
  }

  function pickTier ({ rawName, revenue }) {
    console.log('🎯 Picking tier for:', { rawName, revenue });
    
    const n = rawName.toLowerCase();
    console.log('🔍 Checking name for tier keywords:', n);
    
    if (n.includes('empower') || n.includes('t3')) {
      console.log('🏆 Tier selected: empower (by name)');
      return 'empower';
    }
    if (n.includes('radiate') || n.includes('t2')) {
      console.log('⭐ Tier selected: radiate (by name)');
      return 'radiate';
    }
    if (n.includes('rise')    || n.includes('t1')) {
      console.log('📈 Tier selected: rise (by name)');
      return 'rise';
    }
    
    console.log('💰 Checking revenue-based tier selection...');
    if (revenue >= 2500) {
      console.log('🏆 Tier selected: empower (by revenue ≥ £2500)');
      return 'empower';
    }
    if (revenue >=  500) {
      console.log('⭐ Tier selected: radiate (by revenue ≥ £500)');
      return 'radiate';
    }
    
    console.log('📈 Tier selected: rise (default)');
    return 'rise';
  }

  function updateBar (section, tier) {
    console.log('📊 Updating progress bar for tier:', tier);
    console.log('📍 Section element:', section);
    
    if (!section) {
      console.log('❌ No section provided, skipping bar update');
      return;
    }
    
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    
    console.log('🎨 Progress bar fill element:', fill);
    console.log('📝 Progress bar text element:', txt);
    
    if (!fill || !txt) {
      console.log('❌ Missing progress bar elements, checking for alternatives...');
      const allDivs = section.querySelectorAll('div');
      console.log('📋 All divs in section:', allDivs.length);
      allDivs.forEach((div, index) => {
        console.log(`📋 Div ${index + 1}:`, div.className, div.textContent?.substring(0, 50));
      });
      return;
    }

    const revenue = parseFloat((document.getElementById('sf-revenue')||{}).textContent.replace(/[^0-9.]/g,'')) || 0;
    const target  = targets[tier];
    
    console.log('💰 Current revenue:', revenue);
    console.log('🎯 Target for tier:', target);

    if (target === null) {
      console.log('🏆 Max tier detected, setting 100% width');
      fill.style.width = '100%';
      txt.textContent  = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, revenue / target * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      
      console.log('📈 Calculated percentage:', pct + '%');
      fill.style.width = pct + '%';
      txt.textContent  = `£${revenue} / £${target}`;
    }
    
    console.log('✅ Progress bar updated successfully');
  }

  function showTier (tier, wrapper) {
    console.log('🎭 Showing tier:', tier);
    console.log('📦 Wrapper element:', wrapper);
    
    const tierSections = wrapper.querySelectorAll('.tier-section');
    console.log('🔍 Found tier sections:', tierSections.length);
    
    if (tierSections.length === 0) {
      console.log('❌ No tier sections found! Checking for alternative selectors...');
      const allSections = wrapper.querySelectorAll('section');
      console.log('📋 All sections found:', allSections.length);
      allSections.forEach((sec, index) => {
        console.log(`📋 Section ${index + 1}:`, sec.className, sec.dataset);
      });
      return;
    }
    
    tierSections.forEach((sec, index) => {
      const sectionTier = sec.dataset.tier;
      const on = sectionTier === tier;
      console.log(`📋 Section ${index + 1}: tier="${sectionTier}", showing: ${on}`);
      console.log(`📋 Section ${index + 1} before:`, sec.style.display);
      
      // Simple approach: remove inline styles and set display
      if (on) {
        console.log(`🔧 Section ${index + 1} - Removing style attribute...`);
        sec.removeAttribute('style'); // Remove inline style="display:none;"
        console.log(`🔧 Section ${index + 1} - Setting display to block...`);
        sec.style.display = 'block';
        console.log(`🔧 Section ${index + 1} - Final style:`, sec.getAttribute('style'));
      } else {
        sec.style.display = 'none';
      }
      
      console.log(`📋 Section ${index + 1} after:`, sec.style.display);
      
      // Check if it worked
      const computedStyle = window.getComputedStyle(sec);
      console.log(`📋 Section ${index + 1} computed display:`, computedStyle.display);
      console.log(`📋 Section ${index + 1} is visible:`, sec.offsetParent !== null);
    });
    
    const targetSection = wrapper.querySelector(`[data-tier="${tier}"]`);
    console.log('🎯 Target section for progress bar:', targetSection);
    updateBar(targetSection, tier);
    
    console.log('✅ Tier display updated successfully');
  }

  /* main work ------------------------------------------------ */
  function boot (wrapper) {
    console.log('🚀 Boot function called with wrapper:', wrapper);
    
    const vars = readVars();
    const tier = pickTier(vars);
    
    console.log('🎯 Final tier selection:', tier);
    showTier(tier, wrapper);
    
    console.log('✅ Boot function completed');
  }

  /* kick‑off ------------------------------------------------- */
  function start () {
    console.log('🎬 Start function called');
    
    whenWrapperReady(wrapper => {
      console.log('🎯 Wrapper ready, setting up initial boot...');
      
      /* initial run */
      setTimeout(() => {
        console.log('⏰ Initial boot timeout triggered');
        boot(wrapper);
      }, INIT_DELAY);

      /* re‑run when the builder mutates the DOM */
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
      
      console.log('✅ Start function setup completed');
    });
  }

  console.log('📄 Document ready state:', document.readyState);
  
  if (document.readyState === 'loading') {
    console.log('⏳ Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📋 DOMContentLoaded event fired');
      start();
    }, { once: true });
  } else {
    console.log('✅ Document already loaded, starting immediately');
    start();
  }
  
  console.log('🎉 Script initialization sequence completed');
})();