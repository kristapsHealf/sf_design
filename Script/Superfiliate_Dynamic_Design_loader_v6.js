(function() {
  'use strict';

  const DEFAULT_LINK = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const STATS_API_URL = 'https://aiwellbeing.app.n8n.cloud/webhook/aff/stats';

  if (!location.pathname.includes('/portal')) return;

  function detectTier() {
    const nameEl = document.getElementById('sf-campaign-name');
    const revEl = document.getElementById('sf-revenue');
    const name = nameEl?.textContent?.toLowerCase() || '';
    const revenue = parseFloat(revEl?.textContent?.replace(/[^0-9.]/g, '') || '0');
    
    if (name.includes('empower') || revenue >= 2500) return 'empower';
    if (name.includes('radiate') || revenue >= 500) return 'radiate';
    return 'rise';
  }

  function updateProgressBar(tier) {
    const revEl = document.getElementById('sf-revenue');
    const revenue = parseFloat(revEl?.textContent?.replace(/[^0-9.]/g, '') || '0');
    const targets = { rise: 500, radiate: 2500, empower: null };
    const target = targets[tier];
    
    const activeSection = document.querySelector(`[data-tier="${tier}"]`);
    if (!activeSection) return;
    
    const fill = activeSection.querySelector('.progress-bar-fill');
    const text = activeSection.querySelector('.progress-bar-text');
    if (!fill || !text) return;
    
    if (target === null) {
      fill.style.width = '100%';
      text.textContent = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, (revenue / target) * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      fill.style.width = pct + '%';
      text.textContent = `£${revenue} / £${target}`;
    }
  }

  function setupButton(button) {
    if (button.__hxLinked) return;
    
    const code = document.getElementById('sf-code')?.textContent?.trim() || '';
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
        const label = button.querySelector('.hx25-label');
        if (label) {
          const original = label.textContent;
          label.textContent = '✓ Copied!';
          setTimeout(() => label.textContent = original, 1500);
        }
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    });
    
    button.__hxLinked = true;
  }

  function updateTracker() {
    const code = document.getElementById('sf-code')?.textContent?.trim();
    if (!code) return;

    const activeSection = document.querySelector('[data-tier]:not([style*="display: none"])');
    if (!activeSection) return;
    
    const circles = activeSection.querySelectorAll('.hx25-circle');
    const indicator = activeSection.querySelector('.hx25-unlock-indicator');
    if (!circles.length || !indicator) return;

    // Call API to get referral count
    fetch(`${STATS_API_URL}?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        const count = parseInt(data.reffCounts) || 0;
        
        // Update circles
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
        
        // Update indicator
        if (count >= 3) {
          indicator.textContent = '🎟️ Free Ticket!';
          indicator.style.background = 'rgba(255,255,255,.95)';
          indicator.style.color = '#0b2f66';
          indicator.style.animation = 'pulse 2s infinite';
        } else {
          indicator.textContent = `${3 - count} more for free ticket`;
          indicator.style.background = 'rgba(255,255,255,.2)';
          indicator.style.color = '#fff';
          indicator.style.animation = 'none';
        }
      })
      .catch(err => console.warn('API failed:', err));
  }

  function init() {
    const wrapper = document.getElementById('sf-campaign-wrapper');
    if (!wrapper) return;

    // Show correct tier
    const tier = detectTier();
    const allSections = wrapper.querySelectorAll('[data-tier]');
    allSections.forEach(section => {
      section.style.display = section.dataset.tier === tier ? 'block' : 'none';
    });

    // Update progress bar
    updateProgressBar(tier);

    // Setup button for active tier
    const activeSection = wrapper.querySelector(`[data-tier="${tier}"]`);
    if (activeSection) {
      const button = activeSection.querySelector('.hx25-button');
      if (button) setupButton(button);
      
      // Update tracker
      updateTracker();
    }
  }

  // Add pulse keyframes if not already added
  if (!document.getElementById('hx25-pulse-keyframes')) {
    const style = document.createElement('style');
    style.id = 'hx25-pulse-keyframes';
    style.textContent = '@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }';
    document.head.appendChild(style);
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();