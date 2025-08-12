(function () {
  'use strict';

  /* ========= CONFIG ========= */
  const INIT_DELAY        = 320; // ms after first paint
  const STYLE_ID          = 'hx25-horizontal-layout-v6';
  const VIDEO_SRC         = 'https://i.imgur.com/1zJtkCw.mp4';
  const LOGO_SRC          = 'https://cdn.shopify.com/s/files/1/0405/7291/1765/files/Group_10879850.svg?v=1754920813';
  const LABEL_TEXT        = 'Generate your unique referral link';
  const DEFAULT_LINK      = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const DISABLE_FLAG      = '__HX25_DISABLE__';
  const TARGETS           = { rise: 500, radiate: 2500, empower: null };
  const DEBUG             = true;

  // Tracker config
  const TRACKER_CIRCLES   = 3; // Number of referral circles
  const STATS_API_URL     = 'https://aiwellbeing.app.n8n.cloud/webhook/aff/stats';

  const log  = (...a) => { if (DEBUG) try { console.log('[HX25]', ...a); } catch(_){} };
  const warn = (...a) => { if (DEBUG) try { console.warn('[HX25]', ...a); } catch(_){} };
  const err  = (...a) => { if (DEBUG) try { console.error('[HX25]', ...a); } catch(_){} };

  if (!location.pathname.includes('/portal')) return;
  const isDisabled = () => (typeof window !== 'undefined' && window[DISABLE_FLAG] === true);

  /* ========= STYLE ========= */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* Divider under main card (no visible line) */
      .hx25-divider-block{ margin-top:16px; padding-top:0; border-top:0; }
      .hx25-btn-host{}

      /* Base button - slimmer */
      .hx25-button{
        position:relative; display:block; width:100%;
        min-height:48px; border:0; border-radius:14px; overflow:hidden; cursor:pointer;
        background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
        color:#fff; box-shadow:0 6px 22px rgba(11,47,102,.35);
        transition:transform .2s ease, box-shadow .2s ease, filter .2s ease;
        user-select:none; outline:none;
      }
      .hx25-button.hx25-has-video{ 
        background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%); 
      }
      .hx25-button:hover{
        transform:translateY(-1px) scale(1.01);
        box-shadow:0 12px 30px rgba(11,47,102,.48);
      }
      .hx25-button::after{
        content:""; position:absolute; inset:-20%; z-index:3; pointer-events:none;
        background:radial-gradient(closest-side, rgba(255,255,255,.14), rgba(255,255,255,0) 65%);
        opacity:0; transition:opacity .25s ease;
      }
      .hx25-button:hover::after{ opacity:1; }

      /* Video background */
      .hx25-video{
        position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
        z-index:0; pointer-events:none; filter:saturate(1.08) contrast(1.04) brightness(.95);
      }
      .hx25-scrim{
        position:absolute; inset:0; z-index:1; pointer-events:none;
        background:linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.15) 25%, rgba(0,0,0,.15) 75%, rgba(0,0,0,.45));
      }
      .hx25-shine{
        position:absolute; top:-60%; left:-90%; width:120%; height:240%;
        z-index:2; pointer-events:none; mix-blend-mode:screen; opacity:.32; filter:blur(12px);
        background:
          repeating-linear-gradient(115deg,
            rgba(255,255,255,0) 0 14px,
            rgba(255,255,255,.16) 14px 22px,
            rgba(255,255,255,0) 22px 38px),
          radial-gradient(60% 40% at 50% 50%, rgba(255,255,255,.18), rgba(255,255,255,0) 70%);
        transform:translateX(-140%) rotate(-12deg);
        animation:hx25-sheen 5.2s cubic-bezier(.3,.7,.2,1) infinite;
      }
      @keyframes hx25-sheen{ to{ transform:translateX(240%) rotate(-12deg) } }

      /* Foreground - horizontal layout */
      .hx25-layer{
        position:relative; z-index:3;
        display:flex; flex-direction:row; align-items:center; justify-content:space-between;
        padding:10px 16px;
      }
      .hx25-logo{
        display:block; height:45px; width:auto; order:1;
        filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));
      }
      .hx25-label{
        font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size:18px; font-weight:800; line-height:1.2; letter-spacing:.3px;
        text-shadow:0 1px 1px rgba(0,0,0,.25); text-align:center;
        order:2; flex:1;
      }
      @media (max-width:420px){
        .hx25-label{ font-size:16px }
        .hx25-logo{ height:38px }
        .hx25-layer{ padding:8px 12px }
      }

      /* Copy feedback */
      .hx25-copy-flash{
        position:absolute; inset:-15%; border-radius:16px; pointer-events:none; z-index:4;
        background:radial-gradient(closest-side, rgba(255,255,255,.18), rgba(255,255,255,0) 70%);
        opacity:0; animation:hx25-flash .5s ease-out forwards;
      }
      .hx25-copied-note{
        margin-left:8px; font-weight:800; opacity:0; transform:translateY(-4px);
        animation:hx25-note .9s ease forwards;
      }
      @keyframes hx25-flash{ 0%{opacity:0} 15%{opacity:.85} 100%{opacity:0} }
      @keyframes hx25-note{ 0%{opacity:0; transform:translateY(-4px)} 25%{opacity:1; transform:translateY(0)} 70%{opacity:1} 100%{opacity:0; transform:translateY(-4px)} }

      /* Referral Tracker */
      .hx25-tracker{
        margin-top:20px; padding:12px 16px; border-radius:14px; overflow:hidden;
        position:relative; background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
        color:#fff; box-shadow:0 4px 16px rgba(11,47,102,.25);
      }
      .hx25-tracker-scrim{
        position:absolute; inset:0; z-index:1; pointer-events:none;
        background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06) 25%, rgba(255,255,255,.06) 75%, rgba(255,255,255,.10));
      }
      .hx25-tracker-content{
        position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:12px;
      }
      .hx25-tracker-title{
        font-family:'Avenir', sans-serif; font-size:15px; font-weight:700; text-align:center;
      }
      .hx25-tracker-main{
        display:flex; align-items:center; justify-content:center; gap:16px;
      }
      .hx25-tracker-circles{ display:flex; gap:14px; }
      .hx25-circle{
        width:35px; height:35px; border-radius:50%; position:relative;
        background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.3);
        display:flex; align-items:center; justify-content:center;
        transition:all .3s ease;
      }
      .hx25-circle.completed{
        background:rgba(255,255,255,.95); border-color:#fff; transform:scale(1.1);
      }
      .hx25-circle.completed::after{ content:'✓'; font-size:16px; color:#0b2f66; }
      .hx25-unlock-indicator{
        font-family:'Avenir', sans-serif; font-size:12px; font-weight:600;
        background:rgba(255,255,255,.2); padding:6px 12px; border-radius:16px;
        opacity:0; transform:translateX(-10px); transition:all .4s ease;
      }
      .hx25-unlock-indicator.visible{ opacity:1; transform:translateX(0); }
      .hx25-unlock-indicator.unlocked{ background:rgba(255,255,255,.95); color:#0b2f66; animation:hx25-unlock-pulse 2s ease-in-out infinite; }
      @keyframes hx25-unlock-pulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    `;
    document.head.appendChild(s);
  }

  /* ========= HELPERS ========= */
  function getCode(wrapper) {
    const el = wrapper?.querySelector('#sf-code') || document.getElementById('sf-code');
    return el?.textContent?.trim() || window.HX25_CODE || '';
  }

  function callStatsAPI(code, trackerElement) {
    if (!code || !trackerElement) return;
    fetch(`${STATS_API_URL}?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        const count = parseInt(data.reffCounts) || 0;
        updateTrackerWithCount(count, trackerElement);
      })
      .catch(e => warn('Stats API failed:', e));
  }

  function updateTrackerWithCount(count, tracker) {
    if (!tracker) return;
    const circles = tracker.querySelectorAll('.hx25-circle');
    const indicator = tracker.querySelector('.hx25-unlock-indicator');
    circles.forEach((circle, i) => {
      circle.classList.toggle('completed', i < count);
    });
    if (indicator) {
      if (count >= TRACKER_CIRCLES) {
        indicator.textContent = '🎟️ Free Ticket!';
        indicator.classList.add('unlocked');
      } else {
        indicator.textContent = `${TRACKER_CIRCLES - count} more for free ticket`;
        indicator.classList.remove('unlocked');
      }
    }
  }

  function readVars() {
    const nameEl = document.getElementById('sf-campaign-name');
    const revEl = document.getElementById('sf-revenue');
    const rawName = nameEl?.textContent?.trim() || '';
    const rawRev = revEl?.textContent?.trim() || '';
    const revenue = parseFloat(rawRev.replace(/[^0-9.]/g, '')) || 0;
    return { rawName, revenue };
  }

  function pickTier({ rawName, revenue }) {
    const n = rawName.toLowerCase();
    if (n.includes('empower') || n.includes('t3')) return 'empower';
    if (n.includes('radiate') || n.includes('t2')) return 'radiate';
    if (n.includes('rise') || n.includes('t1')) return 'rise';
    if (revenue >= 2500) return 'empower';
    if (revenue >= 500) return 'radiate';
    return 'rise';
  }

  function updateBar(section, tier) {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const revenue = parseFloat((document.getElementById('sf-revenue')||{}).textContent?.replace(/[^0-9.]/g, '') || '0');
    const target = TARGETS[tier];

    if (target === null) {
      fill.style.width = '100%';
      txt.textContent = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, (revenue / target) * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      fill.style.width = pct + '%';
      txt.textContent = `£${revenue} / £${target}`;
    }
  }

  /* ========= UI BUILDERS ========= */
  function ensureVideo(btn) {
    if (btn.querySelector('.hx25-video')) return;
    const vid = document.createElement('video');
    vid.className = 'hx25-video';
    vid.src = VIDEO_SRC;
    vid.muted = true;
    vid.autoplay = true;
    vid.loop = true;
    vid.playsInline = true;
    btn.insertBefore(vid, btn.firstChild);
    const tryPlay = () => vid.play()?.catch(() => {});
    vid.addEventListener('canplay', () => btn.classList.add('hx25-has-video'));
    // Use intersection observer to play/pause video when it's on screen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) tryPlay();
        else vid.pause();
      });
      observer.observe(btn);
    } else {
      tryPlay(); // Fallback for older browsers
    }
  }
  
  function attachLinkAndCopy(btn, wrapper) {
    if (btn.__hxLinked) return; // Prevent attaching multiple listeners
    
    const code = getCode(wrapper);
    let href = DEFAULT_LINK;
    if (code) {
        href = href.includes('aff=')
            ? href.replace(/([?&])aff=[^&]*/, `$1aff=${encodeURIComponent(code)}`)
            : `${href}${href.includes('?') ? '&' : '?'}aff=${encodeURIComponent(code)}`;
    }

    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (btn.__copyLock) return;
        btn.__copyLock = true;
        
        try {
            await navigator.clipboard.writeText(href);
            // Visual feedback
            const noteHost = btn.querySelector('.hx25-label');
            if (noteHost) {
                const existingNote = noteHost.querySelector('.hx25-copied-note');
                if(existingNote) existingNote.remove();

                const note = document.createElement('span');
                note.className = 'hx25-copied-note';
                note.textContent = '✓ Copied!';
                noteHost.appendChild(note);
                setTimeout(() => note.remove(), 900);
            }
        } catch (ex) {
            err('Clipboard write failed:', ex);
        }

        setTimeout(() => { btn.__copyLock = false; }, 1000);
    });

    btn.__hxLinked = true;
  }

  function createTracker(wrapper) {
    const tracker = document.createElement('div');
    tracker.className = 'hx25-tracker';
    tracker.innerHTML = `
      <div class="hx25-tracker-scrim"></div>
      <div class="hx25-tracker-content">
        <div class="hx25-tracker-title">Referral Progress</div>
        <div class="hx25-tracker-main">
          <div class="hx25-tracker-circles">${
            Array(TRACKER_CIRCLES).fill('<div class="hx25-circle"></div>').join('')
          }</div>
          <div class="hx25-unlock-indicator"></div>
        </div>
      </div>
    `;
    updateTrackerWithCount(0, tracker); // Initialize with 0
    setTimeout(() => tracker.querySelector('.hx25-unlock-indicator')?.classList.add('visible'), 300);
    const code = getCode(wrapper);
    callStatsAPI(code, tracker);
    return tracker;
  }

  function ensureButtonAndTracker(section, wrapper) {
    // Clean up any old instances first to prevent duplicates
    section.parentElement.querySelectorAll('.hx25-divider-block').forEach(el => el.remove());

    const block = document.createElement('div');
    block.className = 'hx25-divider-block';

    const host = document.createElement('div');
    host.className = 'hx25-btn-host';
    
    // Create Button
    const btn = document.createElement('button');
    btn.className = 'hx25-button';
    btn.innerHTML = `
        <div class="hx25-scrim"></div>
        <div class="hx25-shine"></div>
        <div class="hx25-layer">
            <img src="${LOGO_SRC}" alt="HX25 Logo" class="hx25-logo">
            <span class="hx25-label">${LABEL_TEXT}</span>
        </div>
    `;
    ensureVideo(btn);
    attachLinkAndCopy(btn, wrapper);
    
    // Create Tracker
    const tracker = createTracker(wrapper);

    host.appendChild(btn);
    host.appendChild(tracker);
    block.appendChild(host);
    
    // Insert the new block after the section
    section.insertAdjacentElement('afterend', block);
  }


  /* ========= TIERING / FLOW ========= */
  let isProcessing = false;
  let currentObserver = null;

  function whenWrapperReady(cb) {
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { cb(w); return; }
    
    if (currentObserver) currentObserver.disconnect();
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

  function showTier(tier, wrapper) {
    log('Showing tier:', tier);
    const allTiers = wrapper.querySelectorAll('[data-tier]');
    let targetSection = null;

    allTiers.forEach(s => {
      if (s.dataset.tier === tier) {
        s.style.display = 'block';
        targetSection = s;
      } else {
        s.style.display = 'none';
      }
    });
    
    if (targetSection) {
      log('Active section is', tier);
      updateBar(targetSection, tier);
      ensureButtonAndTracker(targetSection, wrapper);
    } else {
      err('No target section found for tier:', tier, '. Available:', [...allTiers].map(s => s.dataset.tier));
    }
  }

  function boot(wrapper) {
    log('Booting script...');
    if (isProcessing) return;
    isProcessing = true;

    injectStyles();
    const vars = readVars();
    const tier = pickTier(vars);
    showTier(tier, wrapper);

    isProcessing = false;
    log('Boot complete.');
  }

  function start() {
    if (isDisabled()) {
      warn('Script disabled by flag.');
      return;
    }
    whenWrapperReady(wrapper => {
      log('Wrapper ready.');
      wrapper.style.visibility = 'hidden'; // Hide to prevent FOUC
      setTimeout(() => {
        boot(wrapper);
        wrapper.style.visibility = 'visible'; // Reveal after setup
      }, INIT_DELAY);
    });
  }

  /* ========= SPA NAVIGATION HANDLING ========= */
  let lastPathname = location.pathname;
  function handleNavigationChange() {
    if (location.pathname === lastPathname) return;
    lastPathname = location.pathname;

    // Reset state for new page
    isProcessing = false;
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }
    
    if (location.pathname.includes('/portal')) {
      log('Navigation to new portal page detected. Restarting...');
      setTimeout(start, 250); // Delay to allow SPA to render new page
    }
  }

  // Set up listeners for SPA navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleNavigationChange();
  };
  window.addEventListener('popstate', handleNavigationChange);
  // A simple interval is a good fallback for frameworks that might not use pushState
  setInterval(handleNavigationChange, 200);

  /* ========= INITIAL KICK-OFF ========= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();