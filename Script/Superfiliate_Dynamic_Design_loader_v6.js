(function () {
  'use strict';

  /* tunables — adjust if needed */
  const INIT_DELAY     = 320;   // ms after first paint
  const HX25_STYLE_ID      = 'hx25-btn-styles-video-v3';
  const HX25_VIDEO_SRC     = 'https://i.imgur.com/AwgNIpR.mp4';
  const HX25_LABEL         = 'Generate your HX25 Referral Link';
  const HX25_DEFAULT_LINK  = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const HX25_ALLOW_CREATE  = false; // only enhance existing buttons by default
  
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
  let hxObserver = null;
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

  /* HX25 button helpers -------------------------------------- */
  function injectHXStyles () {
    if (document.getElementById(HX25_STYLE_ID)) {
      return;
    }
    const s = document.createElement('style');
    s.id = HX25_STYLE_ID;
    s.textContent = `
/* Base button */
.hx25-button{
  display:block;width:100%;margin-top:18px;padding:0;border-radius:14px;border:0;
  color:#fff;font-size:18px;font-weight:600;text-align:center;cursor:pointer;
  position:relative;overflow:hidden;user-select:none;outline:none;
  background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
  box-shadow:0 6px 22px rgba(11,47,102,.35), inset 0 0 0 1px rgba(255,255,255,.06);
  transition:transform .15s ease, box-shadow .15s ease, filter .2s ease;
}
.hx25-button:hover{
  transform:translateY(-2px);
  box-shadow:0 12px 30px rgba(11,47,102,.48), inset 0 0 0 1px rgba(255,255,255,.1);
}

/* Label */
.hx25-label{ position:relative; z-index:4; white-space:nowrap; font-size:15px; display:block; padding:16px 24px; }

/* Video background */
.hx25-video{ 
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; z-index:0; pointer-events:none;
  filter:saturate(1.1) contrast(1.05) brightness(.95);
  transform:scale(1);
  transition:filter .25s ease;
}
.hx25-button:hover .hx25-video{ filter:saturate(1.2) brightness(1); }

/* Dark scrim for legibility */
.hx25-scrim{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background:linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.15) 25%, rgba(0,0,0,.15) 75%, rgba(0,0,0,.45));
}

/* Subtle flowing shine layer */
.hx25-shine{
  position:absolute; top:-60%; left:-90%; width:110%; height:240%;
  z-index:2; pointer-events:none; mix-blend-mode:screen; opacity:.35; filter:blur(12px);
  background:
    repeating-linear-gradient(115deg,
      rgba(255,255,255,0) 0 14px,
      rgba(255,255,255,.16) 14px 22px,
      rgba(255,255,255,0) 22px 38px),
    radial-gradient(60% 40% at 50% 50%, rgba(255,255,255,.18), rgba(255,255,255,0) 70%);
  transform:translateX(-140%) rotate(-12deg);
  animation:hx-sheen 5.2s cubic-bezier(.3,.7,.2,1) infinite;
}

/* Hover "light pop" bloom */
.hx25-button::after{
  content:""; position:absolute; inset:-20%; z-index:3; pointer-events:none;
  background:radial-gradient(closest-side, rgba(255,255,255,.14), rgba(255,255,255,0) 65%);
  opacity:0; transition:opacity .25s ease;
}
.hx25-button:hover::after{ opacity:1; }

/* Copied feedback */
.hx25-button.hx25-copied{ transform: translateY(-1px) scale(1.01); box-shadow:0 14px 34px rgba(11,47,102,.5), inset 0 0 0 1px rgba(255,255,255,.12) }
.hx25-copy-flash{ position:absolute; inset:-15%; border-radius:16px; pointer-events:none; z-index:3; background:radial-gradient(closest-side, rgba(255,255,255,.18), rgba(255,255,255,0) 70%); opacity:0; animation:hx25-flash .5s ease-out forwards }
.hx25-label .hx25-copied-note{ margin-left:8px; font-weight:700; opacity:0; transform:translateY(-4px); animation:hx25-note .9s ease forwards }

/* Keyframes */
@keyframes hx-sheen{ to{ transform:translateX(240%) rotate(-12deg) } }
@keyframes hx25-flash{ 0%{opacity:0} 15%{opacity:.85} 100%{opacity:0} }
@keyframes hx25-note{ 0%{opacity:0; transform:translateY(-4px)} 25%{opacity:1; transform:translateY(0)} 70%{opacity:1} 100%{opacity:0; transform:translateY(-4px)} }

/* Motion safety */
@media (prefers-reduced-motion: reduce){
  .hx25-shine{ animation:none }
}
`;
    document.head.appendChild(s);
  }

  function attachLinkAndA11y(btn, host){
    const href = btn.getAttribute('data-hx-link')
      || host.getAttribute('data-hx-link')
      || (typeof window !== 'undefined' && window.HX25_LINK)
      || HX25_DEFAULT_LINK;
    if (!btn.__hxLinked){
      btn.addEventListener('click', async () => {
        // Copy to clipboard; show visual feedback
        const linkToCopy = href || '';
        try { if (linkToCopy && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(String(linkToCopy)); } } catch(_){ }
        // visual feedback
        const flash = document.createElement('span');
        flash.className = 'hx25-copy-flash';
        const label = btn.querySelector('.hx25-label');
        if (label){
          const note = document.createElement('span');
          note.className = 'hx25-copied-note';
          note.textContent = '✓ Copied!';
          label.appendChild(note);
          setTimeout(() => { try { note.remove(); } catch(_){} }, 900);
        }
        btn.classList.add('hx25-copied');
        btn.appendChild(flash);
        setTimeout(() => { btn.classList.remove('hx25-copied'); try { flash.remove(); } catch(_){} }, 600);
      }, { passive: true });
      btn.__hxLinked = true;
    }
    if (btn.tagName !== 'BUTTON'){
      btn.setAttribute('role','button');
      if (!btn.hasAttribute('tabindex')) btn.tabIndex = 0;
      if (!btn.__hxKeys){
        btn.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        });
        btn.__hxKeys = true;
      }
    }
  }

  function setLabel(btn){
    const labelText = HX25_LABEL;
    if (!btn.querySelector('.hx25-label')){
      btn.textContent = '';
      const span = document.createElement('span');
      span.className = 'hx25-label';
      span.textContent = labelText;
      btn.appendChild(span);
    } else {
      btn.querySelector('.hx25-label').textContent = labelText;
    }
  }

  function ensureLayer(btn, cls){
    if (cls === 'hx25-grain') {
      // Do not render grain layer per latest request
      const existing = btn.querySelector('.hx25-grain');
      if (existing) existing.remove();
      return null;
    }
    let el = btn.querySelector('.' + cls);
    if (!el){
      el = document.createElement('span');
      el.className = cls;
      if (cls === 'hx25-shine') {
        btn.appendChild(el);
      } else {
        btn.insertBefore(el, btn.firstChild);
      }
    }
    return el;
  }

  function ensureVideo(btn){
    let vid = btn.querySelector('.hx25-video');
    if (!vid){
      vid = document.createElement('video');
      vid.className = 'hx25-video';
      vid.src = HX25_VIDEO_SRC;
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      btn.insertBefore(vid, btn.firstChild);
    }
    const tryPlay = () => {
      const p = vid.play && vid.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
    };
    tryPlay();
    if (!vid.__io){
      if ('IntersectionObserver' in window){
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => { if (e.isIntersecting){ tryPlay(); } else { vid.pause(); } });
        }, { threshold: 0.1 });
        io.observe(vid);
        vid.__io = io;
      } else {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) vid.pause(); else tryPlay();
        });
      }
    }
    try {
      const mql = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleRM = () => { if (mql.matches) vid.pause(); else tryPlay(); };
      if (mql && !vid.__rm){
        mql.addEventListener ? mql.addEventListener('change', handleRM) : mql.addListener(handleRM);
        handleRM();
        vid.__rm = true;
      }
    } catch(_){ }
  }

  function normalizeHxButtonInSection(section){
    if (!section) return;
    const btn = section.querySelector('.hx25-button');
    if (!btn) return; // only enhance existing .hx25-button; never create or text-match
    btn.classList.add('hx25-button');
    btn.setAttribute('aria-label','HX25 Referral Link');
    if (section.lastElementChild !== btn) section.appendChild(btn);
    ensureVideo(btn);
    ensureLayer(btn,'hx25-scrim');
    ensureLayer(btn,'hx25-shine');
    setLabel(btn);
    attachLinkAndA11y(btn, section);
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

    // Styles + ensure video button layers
    injectHXStyles();

    const activeSection = document.querySelector(`[data-tier="${tier}"]`);
    if (activeSection) {
      normalizeHxButtonInSection(activeSection);
      if (hxObserver) { try { hxObserver.disconnect(); } catch(_){} hxObserver = null; }
      hxObserver = new MutationObserver(() => {
        normalizeHxButtonInSection(document.querySelector(`[data-tier="${tier}"]`));
      });
      try { hxObserver.observe(activeSection, { childList:true, subtree:true }); } catch(_){}
    }
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
    if (hxObserver) {
      try { hxObserver.disconnect(); } catch(_){}
      hxObserver = null;
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
