(function () {
  'use strict';

  console.log('🚀 SF Portal Design Loader v6 starting...');

  if (!location.pathname.includes('/portal') || window.__sfTierLoaded) {
    console.log('❌ Script skipped - not on portal or already loaded');
    return;
  }
  window.__sfTierLoaded = true;

  const targets = { rise: 500, radiate: 2500, empower: null };

  function whenWrapperReady (cb) {
    console.log('🔍 Looking for sf-campaign-wrapper...');
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { 
      console.log('✅ Wrapper found immediately:', w);
      console.log('📊 Wrapper dataset:', w.dataset);
      cb(w); 
      return; 
    }
    console.log('⏳ Wrapper not found, setting up MutationObserver...');
    new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { 
        console.log('✅ Wrapper found via MutationObserver:', w2);
        console.log('📊 Wrapper dataset:', w2.dataset);
        o.disconnect(); 
        cb(w2); 
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function pickTier (campaignName) {
    console.log('🎯 Picking tier for campaign name:', campaignName);
    const n = campaignName.toLowerCase();
    console.log('🔍 Lowercase name:', n);
    
    if (n.includes('empower') || n.includes('t3')) {
      console.log('🏆 Tier selected: empower');
      return 'empower';
    }
    if (n.includes('radiate') || n.includes('t2')) {
      console.log('⭐ Tier selected: radiate');
      return 'radiate';
    }
    if (n.includes('rise') || n.includes('t1')) {
      console.log('📈 Tier selected: rise');
      return 'rise';
    }
    console.log('📈 Tier selected: rise (default)');
    return 'rise'; // default
  }

  function updateBar (section, tier, revenue) {
    console.log('📊 Updating progress bar for tier:', tier, 'revenue:', revenue);
    if (!section) {
      console.log('❌ No section provided');
      return;
    }
    const fill = section.querySelector('.progress-bar-fill');
    const txt = section.querySelector('.progress-bar-text');
    if (!fill || !txt) {
      console.log('❌ Missing progress bar elements');
      return;
    }

    const target = targets[tier];
    console.log('🎯 Target for tier:', target);

    if (target === null) {
      console.log('🏆 Max tier detected, setting 100% width');
      fill.style.width = '100%';
      txt.textContent = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, revenue / target * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      console.log('📈 Calculated percentage:', pct + '%');
      fill.style.width = pct + '%';
      txt.textContent = `£${revenue} / £${target}`;
    }
  }

  function showTier (tier, wrapper) {
    console.log('🎭 Showing tier:', tier);
    console.log('📦 Wrapper element:', wrapper);
    
    // Only select tier sections, not the wrapper itself
    const allTierSections = document.querySelectorAll('section[data-tier]');
    console.log('🔍 Found tier sections:', allTierSections.length);
    
    allTierSections.forEach((s, i) => {
      console.log(`📋 Section ${i + 1}: data-tier="${s.dataset.tier}", class="${s.className}"`);
    });
    
    allTierSections.forEach(s => {
      s.style.display = 'none';
      console.log('🚫 Hiding section:', s.dataset.tier);
    });
    
    const targetSection = document.querySelector(`section[data-tier="${tier}"]`);
    if (targetSection) {
      targetSection.style.display = 'block';
      console.log('✅ Showing section:', tier);
      targetSection.style.setProperty('display', 'block', 'important');
    } else {
      console.log('❌ Target section not found for tier:', tier);
    }
    
    const revenue = parseInt(wrapper.dataset.revenue) || 0;
    console.log('💰 Revenue from dataset:', revenue);
    updateBar(targetSection, tier, revenue);
  }

  function boot (wrapper) {
    console.log('🚀 Boot function called with wrapper:', wrapper);
    console.log('📊 Wrapper dataset:', wrapper.dataset);
    
    const campaignName = wrapper.dataset.tier || '';
    console.log('🏷️ Campaign name from dataset:', campaignName);
    
    const tier = pickTier(campaignName);
    console.log('🎯 Final tier selection:', tier);
    
    showTier(tier, wrapper);
    console.log('✅ Boot function completed');
  }

  function start () {
    console.log('🎬 Start function called');
    
    whenWrapperReady(wrapper => {
      console.log('🎯 Wrapper ready, starting boot...');
      wrapper.style.visibility = 'hidden';
      
      // Ensure wrapper is visible (it might have display: none)
      wrapper.style.display = 'block';
      wrapper.style.setProperty('display', 'block', 'important');
      console.log('🔧 Forced wrapper to be visible');
      
      wrapper.style.visibility = 'visible';
      boot(wrapper);
    });
  }

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
  
  console.log('🎉 Script initialization completed');
})();
