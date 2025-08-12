(function() {
  'use strict';

  // Basic config
  const VIDEO_SRC = 'https://i.imgur.com/1zJtkCw.mp4';
  const LOGO_SRC = 'https://cdn.shopify.com/s/files/1/0405/7291/1765/files/Group_10879850.svg?v=1754920813';
  const DEFAULT_LINK = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const STATS_API_URL = 'https://aiwellbeing.app.n8n.cloud/webhook/aff/stats';

  if (!location.pathname.includes('/portal')) return;

  // Simple CSS injection
  function injectStyles() {
    if (document.getElementById('hx25-simple-styles')) return;
    const style = document.createElement('style');
    style.id = 'hx25-simple-styles';
    style.textContent = `
      .hx25-button {
        position: relative; display: block; width: 100%; min-height: 48px;
        border: 0; border-radius: 14px; overflow: hidden; cursor: pointer;
        background: linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
        color: #fff; box-shadow: 0 6px 22px rgba(11,47,102,.35);
        transition: transform .2s ease, box-shadow .2s ease;
      }
      .hx25-button:hover {
        transform: translateY(-1px) scale(1.01);
        box-shadow: 0 12px 30px rgba(11,47,102,.48);
      }
      .hx25-video {
        position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        z-index: 0; pointer-events: none;
      }
      .hx25-content {
        position: relative; z-index: 2; display: flex; align-items: center; 
        justify-content: space-between; padding: 10px 16px;
      }
      .hx25-logo { height: 45px; width: auto; }
      .hx25-label { 
        font-family: 'Avenir', sans-serif; font-size: 18px; font-weight: 800; 
        text-align: center; flex: 1; text-shadow: 0 1px 1px rgba(0,0,0,.25);
      }
      .hx25-tracker {
        margin-top: 20px; padding: 12px 16px; border-radius: 14px;
        background: linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
        color: #fff; box-shadow: 0 4px 16px rgba(11,47,102,.25);
      }
      .hx25-tracker-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .hx25-tracker-title { font-size: 15px; font-weight: 700; text-align: center; }
      .hx25-tracker-main { display: flex; align-items: center; gap: 16px; }
      .hx25-tracker-circles { display: flex; gap: 14px; }
      .hx25-circle {
        width: 35px; height: 35px; border-radius: 50%;
        background: rgba(255,255,255,.15); border: 2px solid rgba(255,255,255,.3);
        display: flex; align-items: center; justify-content: center;
        transition: all .3s ease;
      }
      .hx25-circle.completed {
        background: rgba(255,255,255,.95); border-color: #fff; transform: scale(1.1);
      }
      .hx25-circle.completed::after { content: '✓'; font-size: 16px; color: #0b2f66; }
      .hx25-unlock-indicator {
        font-size: 12px; font-weight: 600; background: rgba(255,255,255,.2);
        padding: 6px 12px; border-radius: 16px; white-space: nowrap;
      }
      .hx25-unlock-indicator.unlocked { 
        background: rgba(255,255,255,.95); color: #0b2f66; 
        animation: pulse 2s infinite;
      }
      @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    `;
    document.head.appendChild(style);
  }

  // Simple tier detection
  function detectTier() {
    const nameEl = document.getElementById('sf-campaign-name');
    const revEl = document.getElementById('sf-revenue');
    const name = nameEl?.textContent?.toLowerCase() || '';
    const revenue = parseFloat(revEl?.textContent?.replace(/[^0-9.]/g, '') || '0');
    
    if (name.includes('empower') || revenue >= 2500) return 'empower';
    if (name.includes('radiate') || revenue >= 500) return 'radiate';
    return 'rise';
  }

  // Simple button setup
  function setupButton(button, wrapper) {
    // Add content if empty
    if (!button.innerHTML.trim()) {
      button.innerHTML = `
        <video class="hx25-video" src="${VIDEO_SRC}" muted autoplay loop playsinline></video>
        <div class="hx25-content">
          <img src="${LOGO_SRC}" alt="HX25" class="hx25-logo">
          <span class="hx25-label">Generate your unique referral link</span>
        </div>
      `;
    }

    // Add click handler if not already added
    if (!button.__hxLinked) {
      const code = wrapper.querySelector('#sf-code')?.textContent?.trim() || '';
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
  }

  // Simple tracker setup
  function setupTracker(container, wrapper) {
    const code = wrapper.querySelector('#sf-code')?.textContent?.trim();
    if (!code) return;

    container.innerHTML = `
      <div class="hx25-tracker">
        <div class="hx25-tracker-content">
          <div class="hx25-tracker-title">Referral Progress</div>
          <div class="hx25-tracker-main">
            <div class="hx25-tracker-circles">
              <div class="hx25-circle"></div>
              <div class="hx25-circle"></div>
              <div class="hx25-circle"></div>
            </div>
            <div class="hx25-unlock-indicator">3 more for free ticket</div>
          </div>
        </div>
      </div>
    `;

    // Call API to update tracker
    fetch(`${STATS_API_URL}?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        const count = parseInt(data.reffCounts) || 0;
        const circles = container.querySelectorAll('.hx25-circle');
        const indicator = container.querySelector('.hx25-unlock-indicator');
        
        circles.forEach((circle, i) => {
          circle.classList.toggle('completed', i < count);
        });
        
        if (indicator) {
          if (count >= 3) {
            indicator.textContent = '🎟️ Free Ticket!';
            indicator.classList.add('unlocked');
          } else {
            indicator.textContent = `${3 - count} more for free ticket`;
          }
        }
      })
      .catch(err => console.warn('API failed:', err));
  }

  // Main initialization
  function init() {
    const wrapper = document.getElementById('sf-campaign-wrapper');
    if (!wrapper) return;

    injectStyles();
    
    // Show correct tier
    const tier = detectTier();
    const allSections = wrapper.querySelectorAll('[data-tier]');
    allSections.forEach(section => {
      section.style.display = section.dataset.tier === tier ? 'block' : 'none';
    });

    // Setup button and tracker for active tier
    const activeSection = wrapper.querySelector(`[data-tier="${tier}"]`);
    if (activeSection) {
      const button = activeSection.querySelector('.hx25-button');
      const trackerContainer = activeSection.querySelector('.hx25-tracker-container');
      
      if (button) setupButton(button, wrapper);
      if (trackerContainer) setupTracker(trackerContainer, wrapper);
    }
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();