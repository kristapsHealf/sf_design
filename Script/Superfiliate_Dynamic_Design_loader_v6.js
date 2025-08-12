(function () {
  'use strict';

  console.log('🚀 HX TIMING FIXED SCRIPT STARTING');
  
  const DEBUG = true;
  const log = (...a) => { if (DEBUG) console.log('[HX25]', ...a); };
  
  // Configuration
  const DEFAULT_LINK = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const STATS_API_URL = 'https://aiwellbeing.app.n8n.cloud/webhook-test/aff/stats';
  const MAX_WAIT_TIME = 10000; // 10 seconds max wait
  const CHECK_INTERVAL = 100; // Check every 100ms

  if (!location.pathname.includes('/portal')) {
    log('❌ Not on portal page, exiting');
    return;
  }

  log('✅ On portal page, starting element wait...');

  // Wait for elements to be available
  function waitForElements() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      function checkElements() {
        const wrapper = document.getElementById('sf-campaign-wrapper');
        const nameEl = document.getElementById('sf-campaign-name');
        const revEl = document.getElementById('sf-revenue');
        const codeEl = document.getElementById('sf-code');
        
        const elapsed = Date.now() - startTime;
        
        log(`⏳ Checking elements at ${elapsed}ms...`);
        log(`- wrapper: ${!!wrapper}, name: ${!!nameEl}, revenue: ${!!revEl}, code: ${!!codeEl}`);
        
        if (wrapper && nameEl && revEl && codeEl) {
          log('✅ All elements found!');
          resolve({ wrapper, nameEl, revEl, codeEl });
          return;
        }
        
        if (elapsed > MAX_WAIT_TIME) {
          log('❌ Timeout waiting for elements');
          reject(new Error('Timeout waiting for elements'));
          return;
        }
        
        setTimeout(checkElements, CHECK_INTERVAL);
      }
      
      checkElements();
    });
  }

  // Main script logic
  async function runScript() {
    try {
      log('🔍 Waiting for template elements...');
      const { wrapper, nameEl, revEl, codeEl } = await waitForElements();
      
      log('🎯 Elements ready, starting main logic...');
      
      // Tier detection
      const rawName = nameEl.textContent?.trim() || '';
      const rawRev = revEl.textContent?.trim() || '';
      const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
      
      log(`📊 Name: "${rawName}", Revenue: ${revenue}`);
      
      const n = rawName.toLowerCase();
      let tier = 'rise';
      if (n.includes('empower') || n.includes('t3') || revenue >= 2500) tier = 'empower';
      else if (n.includes('radiate') || n.includes('t2') || revenue >= 500) tier = 'radiate';
      
      log(`🎪 Detected tier: ${tier}`);
      
      // Show correct tier
      const allSections = wrapper.querySelectorAll('[data-tier]');
      log(`📋 Found ${allSections.length} tier sections`);
      
      allSections.forEach(section => {
        if (section.dataset.tier === tier) {
          section.style.display = 'block';
          section.style.setProperty('display', 'block', 'important');
          log(`✅ Showing ${section.dataset.tier} section`);
        } else {
          section.style.display = 'none';
          log(`❌ Hiding ${section.dataset.tier} section`);
        }
      });
      
      // Update progress bar
      const activeSection = wrapper.querySelector(`[data-tier="${tier}"]`);
      if (activeSection) {
        const fill = activeSection.querySelector('.progress-bar-fill');
        const text = activeSection.querySelector('.progress-bar-text');
        const targets = { rise: 500, radiate: 2500, empower: null };
        const target = targets[tier];
        
        if (fill && text) {
          if (target === null) {
            fill.style.width = '100%';
            text.textContent = `£${revenue} (max tier)`;
          } else {
            let pct = Math.min(100, (revenue / target) * 100);
            if (revenue > 0 && pct < 10) pct = 10;
            fill.style.width = pct + '%';
            text.textContent = `£${revenue} / £${target}`;
          }
          log(`📊 Progress bar updated: ${fill.style.width}`);
        }
        
        // Setup button if it exists
        const button = activeSection.querySelector('.hx25-button');
        if (button && !button.__hxLinked) {
          const code = codeEl.textContent?.trim() || '';
          let link = DEFAULT_LINK;
          
          if (code) {
            link = link.includes('aff=') 
              ? link.replace(/([?&])aff=[^&]*/, `$1aff=${encodeURIComponent(code)}`)
              : `${link}&aff=${encodeURIComponent(code)}`;
          }
          
          button.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
              await navigator.clipboard.writeText(link);
              log('📋 Link copied to clipboard');
              
              const label = button.querySelector('.hx25-label');
              if (label) {
                const original = label.textContent;
                label.textContent = '✓ Copied!';
                setTimeout(() => label.textContent = original, 1500);
              }
            } catch (err) {
              log('❌ Copy failed:', err);
            }
          });
          
          button.__hxLinked = true;
          log('🔗 Button click handler attached');
        }
        
        // Update tracker if it exists
        const circles = activeSection.querySelectorAll('.hx25-circle');
        const indicator = activeSection.querySelector('.hx25-unlock-indicator');
        
        if (circles.length && indicator && codeEl.textContent?.trim()) {
          log('🎯 Updating tracker...');
          
          fetch(`${STATS_API_URL}?code=${encodeURIComponent(codeEl.textContent.trim())}`)
            .then(res => res.json())
            .then(data => {
              const count = parseInt(data.reffCounts) || 0;
              log(`📊 API returned referral count: ${count}`);
              
              circles.forEach((circle, i) => {
                if (i < count) {
                  circle.style.background = 'rgba(255,255,255,.95)';
                  circle.style.borderColor = '#fff';
                  circle.style.transform = 'scale(1.1)';
                  circle.innerHTML = '<span style="font-size: 16px; color: #0b2f66;">✓</span>';
                } else {
                  circle.style.background = 'rgba(255,255,255,.15)';
                  circle.style.borderColor = 'rgba(255,255,255,.3)';
                  circle.style.transform = 'scale(1)';
                  circle.innerHTML = '';
                }
              });
              
              if (count >= 3) {
                indicator.textContent = '🎟️ Free Ticket!';
                indicator.style.background = 'rgba(255,255,255,.95)';
                indicator.style.color = '#0b2f66';
              } else {
                indicator.textContent = `${3 - count} more for free ticket`;
                indicator.style.background = 'rgba(255,255,255,.2)';
                indicator.style.color = '#fff';
              }
              
              log('🎯 Tracker updated successfully');
            })
            .catch(err => log('❌ API failed:', err));
        }
      }
      
      log('🎉 Script completed successfully!');
      
    } catch (error) {
      log('❌ Script failed:', error);
    }
  }

  // Start the script
  runScript();

})();