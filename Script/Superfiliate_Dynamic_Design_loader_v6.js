(function () {
  'use strict';

  /* ========= CONFIG ========= */
  const INIT_DELAY        = 320;
  const STYLE_ID          = 'hx25-button-tracker-v1';
  const BTN_SELECTOR      = '.hx25-button, .hx25-btn, [data-hx25-btn], #hx25-button';
  const VIDEO_SRC         = 'https://i.imgur.com/1zJtkCw.mp4';
  const LOGO_SRC          = 'https://cdn.shopify.com/s/files/1/0405/7291/1765/files/Group_10879850.svg?v=1754920813';
  const LABEL_TEXT        = 'Generate your unique referral link';
  const DEFAULT_LINK      = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?aff=482504953';
  const DISABLE_FLAG      = '__HX25_DISABLE__';
  const TARGETS           = { rise: 500, radiate: 2500, empower: null };
  const DEBUG             = true; // Force enable extensive logging for testing
  const VERBOSE           = true; // Extra detailed logging for testing
  
  // Tracker config
  const TRACKER_CIRCLES   = 3; // Number of referral circles
  const MOCK_REFERRALS    = 0; // Mock data - completed referrals (0-3)
  const STATS_API_URL     = 'https://aiwellbeing.app.n8n.cloud/webhook-test/aff/stats';

  const log  = (...a) => { if (DEBUG) try { console.log('[HX25]', ...a); } catch(_){} };
  const warn = (...a) => { if (DEBUG) try { console.warn('[HX25]', ...a); } catch(_){} };
  const err  = (...a) => { if (DEBUG) try { console.error('[HX25]', ...a); } catch(_){} };
  const verbose = (...a) => { if (VERBOSE) try { console.log('[HX25-VERBOSE]', ...a); } catch(_){} };

  if (!location.pathname.includes('/portal')) return;
  const isDisabled = () => (typeof window !== 'undefined' && window[DISABLE_FLAG] === true);

  // Timing and safety constants
  const MAX_WAIT_TIME = 10000; // 10 seconds max wait for elements
  const CHECK_INTERVAL = 100; // Check every 100ms
  
  // Wait for critical elements to be available
  function waitForElements() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      function checkElements() {
        const wrapper = document.getElementById('sf-campaign-wrapper');
        const nameEl = document.getElementById('sf-campaign-name');
        const revEl = document.getElementById('sf-revenue');
        const codeEl = document.getElementById('sf-code');
        
        const elapsed = Date.now() - startTime;
        
        verbose(`⏳ Checking elements at ${elapsed}ms...`);
        verbose(`- wrapper: ${!!wrapper}, name: ${!!nameEl}, revenue: ${!!revEl}, code: ${!!codeEl}`);
        
        if (wrapper && nameEl && revEl) { // codeEl is optional
          log('✅ Critical elements found!');
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

  /* ========= STYLE ========= */
  function injectStyles() {
    log('🎨 Injecting styles...');
    if (document.getElementById(STYLE_ID)) {
      log('✅ Styles already injected');
      return;
    }
    const s = document.createElement('style');
    s.id = STYLE_ID;
    log('📝 Creating style element with ID:', STYLE_ID);
    s.textContent = `
/* Divider under main card (no visible line) */
.hx25-divider-block{ margin-top:16px; padding-top:0; border-top:0; }
.hx25-btn-host{}

/* Base button - slimmer */
.hx25-button, .hx25-btn{
  position:relative; display:block; width:100%;
  min-height:48px; border:0; border-radius:14px; overflow:hidden; cursor:pointer;
  background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
  color:#fff; box-shadow:0 6px 22px rgba(11,47,102,.35);
  transition:transform .2s ease, box-shadow .2s ease, filter .2s ease;
  user-select:none; outline:none;
}
.hx25-button.hx25-has-video, .hx25-btn.hx25-has-video{ background:transparent; }
.hx25-button:hover, .hx25-btn:hover{
  transform:translateY(-1px) scale(1.01);
  box-shadow:0 12px 30px rgba(11,47,102,.48);
}
/* Hover bloom */
.hx25-button::after, .hx25-btn::after{
  content:""; position:absolute; inset:-20%; z-index:3; pointer-events:none;
  background:radial-gradient(closest-side, rgba(255,255,255,.14), rgba(255,255,255,0) 65%);
  opacity:0; transition:opacity .25s ease;
}
.hx25-button:hover::after, .hx25-btn:hover::after{ opacity:1; }

/* Video background */
.hx25-video{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  z-index:0; pointer-events:none; filter:saturate(1.08) contrast(1.04) brightness(.95);
}

/* Legibility + brightness overlay */
.hx25-scrim{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.15), rgba(255,255,255,.08) 25%, rgba(255,255,255,.08) 75%, rgba(255,255,255,.12));
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
  padding:10px 16px; /* slimmer padding */
}
.hx25-logo{
  display:block; height:45px; width:auto; order:1; /* left side */
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));
}
.hx25-label{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:18px; font-weight:800; line-height:1.2; letter-spacing:.3px;
  text-shadow:0 1px 1px rgba(0,0,0,.25); text-align:center;
  order:2; flex:1; /* center, takes remaining space */
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

@media (prefers-reduced-motion: reduce){
  .hx25-shine{ animation:none }
}

/* Referral Tracker - 20% shorter */
.hx25-tracker{
  margin-top:20px; padding:12px 16px; border-radius:14px; overflow:hidden;
  position:relative; background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
  color:#fff; box-shadow:0 4px 16px rgba(11,47,102,.25);
}
.hx25-tracker-video{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  z-index:0; pointer-events:none; filter:saturate(1.08) contrast(1.04) brightness(.95);
}
.hx25-tracker-scrim{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06) 25%, rgba(255,255,255,.06) 75%, rgba(255,255,255,.10));
}
.hx25-tracker-content{
  position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:12px;
}
.hx25-tracker-title{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:15px; font-weight:700; text-align:center; letter-spacing:.2px;
  text-shadow:0 1px 1px rgba(0,0,0,.25); margin-bottom:2px;
}
.hx25-tracker-main{
  display:flex; align-items:center; justify-content:center; gap:16px;
}
.hx25-tracker-circles{
  display:flex; gap:14px; align-items:center; justify-content:center;
}
.hx25-circle{
  width:35px; height:35px; border-radius:50%; position:relative;
  background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.3);
  display:flex; align-items:center; justify-content:center;
  transition:all .3s cubic-bezier(.4,0,.2,1);
}
.hx25-circle.completed{
  background:rgba(255,255,255,.95); border-color:#fff;
  transform:scale(1.1); box-shadow:0 3px 8px rgba(255,255,255,.3);
}
.hx25-circle.completed::after{
  content:'✓'; font-size:16px; font-weight:bold; 
  color:#0b2f66; text-shadow:none;
}
.hx25-circle:not(.completed){
  background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.2);
}
.hx25-unlock-indicator{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:12px; font-weight:600; text-align:left; letter-spacing:.2px;
  background:rgba(255,255,255,.2); padding:6px 12px; border-radius:16px;
  text-shadow:0 1px 1px rgba(0,0,0,.25); white-space:nowrap;
  opacity:0; transform:translateX(-10px); transition:all .4s ease;
}
.hx25-unlock-indicator.visible{
  opacity:1; transform:translateX(0);
}
.hx25-unlock-indicator.unlocked{
  background:rgba(255,255,255,.95); color:#0b2f66; text-shadow:none;
  animation:hx25-unlock-pulse 2s ease-in-out infinite;
}
@keyframes hx25-unlock-pulse{
  0%, 100%{ transform:scale(1) }
  50%{ transform:scale(1.05) }
}
@media (max-width:420px){
  .hx25-tracker{ padding:10px 12px; margin-top:16px }
  .hx25-tracker-title{ font-size:14px }
  .hx25-tracker-main{ gap:12px }
  .hx25-tracker-circles{ gap:10px }
  .hx25-circle{ width:30px; height:30px }
  .hx25-circle.completed::after{ font-size:14px }
  .hx25-unlock-indicator{ font-size:11px; padding:5px 10px }
}
`;
    document.head.appendChild(s);
    log('✅ Styles injected successfully');
  }

  /* ========= HELPERS ========= */
  const withQueryParam = (url, key, value) => {
    if (!url || !key || value == null || value === '') return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
  };

  function getCode(wrapper){
    try {
      const scoped = wrapper?.querySelector?.('#sf-code');
      const el = scoped || document.getElementById('sf-code');
      const text = el?.textContent?.trim() || '';
      if (text) return text;
    } catch(_){}
    try { if (window.HX25_CODE) return String(window.HX25_CODE); } catch(_){}
    return '';
  }

  // Simple webhook call that updates tracker
  function callStatsAPI(code) {
    try {
      log('📊 Calling stats API with code:', code);
      const url = `${STATS_API_URL}?code=${encodeURIComponent(code)}`;
      fetch(url).then(res => res.json()).then(data => {
        log('✅ Stats API response:', data);
        
        // Update tracker with reffCounts
        const reffCounts = parseInt(data.reffCounts) || 0;
        log('🎯 Updating tracker with reffCounts:', reffCounts);
        updateTrackerWithCount(reffCounts);
        
      }).catch(err => {
        warn('❌ Stats API failed:', err);
      });
    } catch(e) {
      err('❌ Stats API call error:', e);
    }
  }

  // Update existing tracker with new count
  function updateTrackerWithCount(count) {
    const tracker = document.querySelector('.hx25-tracker');
    if (!tracker) {
      warn('⚠️ No tracker found to update');
      return;
    }

    const circles = tracker.querySelectorAll('.hx25-circle');
    const indicator = tracker.querySelector('.hx25-unlock-indicator');
    
    log('🔄 Updating', circles.length, 'circles with count:', count);
    
    // Update circles
    circles.forEach((circle, index) => {
      if (index < count) {
        circle.classList.add('completed');
      } else {
        circle.classList.remove('completed');
      }
    });

    // Update indicator
    if (indicator) {
      if (count >= TRACKER_CIRCLES) {
        indicator.textContent = '🎟️ Free Ticket!';
        indicator.classList.add('unlocked');
      } else {
        const remaining = TRACKER_CIRCLES - count;
        indicator.textContent = `${remaining} more for free ticket`;
        indicator.classList.remove('unlocked');
      }
    }
    
    log('✅ Tracker updated successfully');
  }

  function readVars(){
    const nameEl = document.getElementById('sf-campaign-name');
    const revEl  = document.getElementById('sf-revenue');
    const rawName = nameEl?.textContent?.trim() || '';
    const rawRev  = revEl?.textContent?.trim()  || '';
    const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
    return { rawName, revenue };
  }

  function pickTier({ rawName, revenue }){
    const n = rawName.toLowerCase();    
    if (n.includes('empower') || n.includes('t3')) return 'empower';
    if (n.includes('radiate') || n.includes('t2')) return 'radiate';
    if (n.includes('rise')    || n.includes('t1')) return 'rise';
    if (revenue >= 2500) return 'empower';
    if (revenue >=  500) return 'radiate';
      return 'rise';
  }

  function updateBar(section, tier){
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;
    const revEl = document.getElementById('sf-revenue');
    const revenue = parseFloat(revEl?.textContent?.replace(/[^0-9.]/g,'') || '0') || 0;
    const target  = TARGETS[tier];
    if (target === null) {
      fill.style.width = '100%';
      txt.textContent  = `£${revenue} (max tier)`;
    } else {
      let pct = Math.min(100, (revenue / target) * 100);
      if (revenue > 0 && pct < 10) pct = 10;
      if (revenue === 0) pct = 0;
      fill.style.width = pct + '%';
      txt.textContent  = `£${revenue} / £${target}`;
    }
  }

  /* ========= BUTTON (video, fg, a11y, copy) ========= */
  function ensureVideo(btn){
    verbose('🎬 Ensuring video for button:', btn);
    let vid = btn.querySelector('.hx25-video');
    if (!vid){
      log('📹 Creating new video element');
      vid = document.createElement('video');
      vid.className = 'hx25-video';
      vid.muted = true; vid.setAttribute('muted','');
      vid.autoplay = true; vid.setAttribute('autoplay','');
      vid.loop = true;
      vid.playsInline = true; vid.setAttribute('playsinline','');
      vid.preload = 'auto';
      const src = document.createElement('source');
      src.src = VIDEO_SRC; src.type = 'video/mp4';
      vid.appendChild(src);
      btn.insertBefore(vid, btn.firstChild);
      log('✅ Video element created and inserted');
    } else {
      verbose('✅ Video element already exists');
    }
    const tryPlay = () => {
      verbose('▶️ Attempting to play video...');
      const p = vid.play && vid.play();
      if (p && p.then) {
        p.then(() => {
          log('✅ Video playing successfully');
          btn.classList.add('hx25-has-video');
        }).catch((e) => {
          warn('❌ Video play blocked:', e);
        });
      }
    };
    vid.addEventListener('loadeddata', () => {
      log('📊 Video loadeddata event fired');
      btn.classList.add('hx25-has-video');
    });
    vid.addEventListener('canplay', () => {
      log('▶️ Video canplay event fired');
      btn.classList.add('hx25-has-video');
    });
    vid.addEventListener('playing', () => {
      log('🎬 Video playing event fired');
      btn.classList.add('hx25-has-video');
    });
    vid.addEventListener('error', () => {
      err('❌ Video error event fired');
      btn.classList.remove('hx25-has-video');
    });

    ['pointerenter','click','touchstart','keydown'].forEach(evt => {
      btn.addEventListener(evt, tryPlay, { once:true, passive:true });
    });

    if ('IntersectionObserver' in window && !vid.__io){
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting){ tryPlay(); } else { vid.pause(); } });
      }, { threshold: 0.1 });
      io.observe(vid); vid.__io = io;
    } else {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) vid.pause(); else tryPlay();
      }, { passive:true });
    }
    tryPlay();
  }

  function ensureLayer(parent, cls){
    let el = parent.querySelector('.' + cls);
    if (!el){
      el = document.createElement('span');
      el.className = cls;
      parent.appendChild(el);
    }
    return el;
  }

  function ensureForeground(btn){
    verbose('🎯 Ensuring foreground elements for button:', btn);
    let layer = btn.querySelector('.hx25-layer');
    if (!layer){
      log('📦 Creating new layer element');
      layer = document.createElement('div');
      layer.className = 'hx25-layer';
      btn.appendChild(layer);
    } else {
      verbose('✅ Layer element already exists');
    }

    // Remove any old multi-line structure
    const oldLines = layer.querySelector('.hx25-lines');
    if (oldLines) {
      log('🗑️ Removing old two-line structure');
      oldLines.remove();
    }
    const oldLabels = layer.querySelectorAll('.hx25-label-1, .hx25-label-2');
    oldLabels.forEach(label => label.remove());

    // Logo (left side)
    let logo = layer.querySelector('.hx25-logo');
    if (!logo){
      log('🖼️ Creating logo element (45px, left corner)');
      logo = document.createElement('img');
      logo.className = 'hx25-logo';
      logo.alt = 'HX25';
      logo.decoding = 'async';
      logo.loading  = 'eager';
      logo.src = LOGO_SRC;
      logo.addEventListener('load', () => log('✅ Logo loaded successfully'));
      logo.addEventListener('error', () => err('❌ Logo failed to load'));
      layer.appendChild(logo);
    }

    // Single-line label (center)
    let label = layer.querySelector('.hx25-label');
    if (!label){
      log('🏷️ Creating single-line label with Avenir font:', LABEL_TEXT);
      label = document.createElement('span');
      label.className = 'hx25-label';
      layer.appendChild(label);
    }
    label.textContent = LABEL_TEXT;
    
    log('✅ Foreground elements complete - horizontal layout');
  }

  function attachLinkAndA11y(btn, host){
    log('🔗 Attaching link and accessibility for button:', btn);
    
    let href = btn.getAttribute('data-hx-link')
      || host.getAttribute('data-hx-link')
      || window.HX25_LINK
      || DEFAULT_LINK;
    
    verbose('📄 Button data-hx-link:', btn.getAttribute('data-hx-link'));
    verbose('📄 Host data-hx-link:', host.getAttribute('data-hx-link'));
    verbose('🌐 Window HX25_LINK:', window.HX25_LINK);
    verbose('🔗 Base href before code:', href);

    const code = getCode(host.closest('#sf-campaign-wrapper')) || 'DEFAULT_CODE';
    href = withQueryParam(href, 'aff', code);
    
    log('🎯 Code found:', code);
    log('🔗 Final href with code:', href);

    log('🔍 Checking if button needs linking. __hxLinked:', btn.__hxLinked);
    if (!btn.__hxLinked){
      log('🆕 Adding click event listener to button');
      btn.addEventListener('click', async (e) => {
        if (e.__isTest) {
          log('✅ TEST CLICK DETECTED - Click handler is working!');
          return;
        }
        
        log('🖱️ BUTTON CLICKED! Starting copy process...');
        e.stopPropagation(); e.preventDefault();
        
        if (btn.__copyLock) {
          warn('🔒 Copy already in progress, ignoring click');
          return;
        }
        
        log('🔓 Setting copy lock');
        btn.__copyLock = true;

        // Step 1: Copy to clipboard
        try { 
          if (href && navigator.clipboard?.writeText) {
            log('📋 Attempting to copy to clipboard:', href);
            await navigator.clipboard.writeText(String(href));
            log('✅ Successfully copied to clipboard!');
          } else {
            warn('❌ Clipboard API not available or no href');
          }
        } catch(ex){
          err('❌ Clipboard write failed:', ex);
        }

        // Step 2: Clean up existing feedback
        log('🧹 Cleaning up existing feedback elements...');
        try { 
          const existingElements = btn.querySelectorAll('.hx25-copy-flash, .hx25-copied-note');
          log('Found', existingElements.length, 'existing feedback elements');
          existingElements.forEach((n, i) => {
            try { 
              log('Removing element', i, ':', n.className);
              n.remove(); 
            } catch(e){
              warn('Failed to remove element', i, ':', e);
            }
          }); 
        } catch(e){
          warn('Failed during cleanup:', e);
        }

        // Step 3: Create flash effect
        log('✨ Creating flash effect...');
        try {
          const flash = document.createElement('span');
          flash.className = 'hx25-copy-flash';
          log('Flash element created, appending to button...');
          btn.appendChild(flash);
          log('✅ Flash element appended successfully');
          
          // Auto-cleanup flash
          setTimeout(() => { 
            log('🕐 Flash timeout triggered, removing...');
            try { 
              if (flash.parentNode) {
                flash.remove();
                log('✅ Flash removed successfully');
              } else {
                log('⚠️ Flash has no parent node');
              }
            } catch(e){
              warn('❌ Failed to remove flash:', e);
            } 
          }, 600);
        } catch(ex){
          err('❌ Flash creation failed:', ex);
        }

        // Step 4: Create checkmark note
        log('✓ Creating checkmark note...');
        try {
          const noteHost = btn.querySelector('.hx25-label') ||
                          btn.querySelector('.hx25-layer') ||
                          btn;
          
          log('Note host found:', noteHost?.className || 'button itself');
          
          if (noteHost) {
            const note = document.createElement('span');
            note.className = 'hx25-copied-note';
            note.textContent = '✓ Copied!';
            note.style.position = 'relative';
            note.style.display = 'inline-block';
            note.style.color = '#ffffff';
            note.style.fontWeight = 'bold';
            note.style.fontSize = '12px';
            log('Note element created, appending to host...');
            noteHost.appendChild(note);
            log('✅ Note appended successfully');
            
            // Auto-cleanup note
            setTimeout(() => { 
              log('🕐 Note timeout triggered, removing...');
              try { 
                if (note.parentNode) {
                  note.remove();
                  log('✅ Note removed successfully');
                } else {
                  log('⚠️ Note has no parent node');
                }
              } catch(e){
                warn('❌ Failed to remove note:', e);
              } 
            }, 900);
          } else {
            err('❌ No note host found!');
          }
        } catch(ex){
          err('❌ Note creation failed:', ex);
        }

        // Step 5: Reset lock
        log('🔓 Setting timeout to reset copy lock...');
        setTimeout(() => { 
          btn.__copyLock = false;
          log('✅ Copy lock reset');
        }, 1000);
      }, { passive:false });

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
      btn.__hxLinked = true;
      log('✅ Button linked successfully');
      
      // Test click handler
      setTimeout(() => {
        log('🧪 Testing click handler attachment...');
        const testEvent = new Event('click', { bubbles: true, cancelable: true });
        testEvent.__isTest = true;
        btn.dispatchEvent(testEvent);
      }, 100);
      
    } else {
      warn('⚠️ Button already linked, skipping click handler attachment');
      
      // Still test if existing handler works
      setTimeout(() => {
        log('🧪 Testing existing click handler...');
        const testEvent = new Event('click', { bubbles: true, cancelable: true });
        testEvent.__isTest = true;
        btn.dispatchEvent(testEvent);
      }, 100);
    }
  }

  /* ========= REFERRAL TRACKER ========= */
  function ensureTrackerVideo(tracker){
    verbose('🎬 Ensuring tracker video:', tracker);
    let vid = tracker.querySelector('.hx25-tracker-video');
    if (!vid){
      log('📹 Creating tracker video element');
      vid = document.createElement('video');
      vid.className = 'hx25-tracker-video';
      vid.muted = true; vid.setAttribute('muted','');
      vid.autoplay = true; vid.setAttribute('autoplay','');
      vid.loop = true;
      vid.playsInline = true; vid.setAttribute('playsinline','');
      vid.preload = 'auto';
      const src = document.createElement('source');
      src.src = VIDEO_SRC; src.type = 'video/mp4';
      vid.appendChild(src);
      tracker.insertBefore(vid, tracker.firstChild);
      log('✅ Tracker video created');
    }
    
    const tryPlay = () => {
      const p = vid.play && vid.play();
      if (p && p.then) p.then(() => log('✅ Tracker video playing')).catch(() => {});
    };
    
    vid.addEventListener('loadeddata', tryPlay);
    vid.addEventListener('canplay', tryPlay);
    tryPlay();
  }

  function createTracker(completedReferrals = MOCK_REFERRALS){
    log('🎯 Creating referral tracker with', completedReferrals, 'completed referrals');
    
    const tracker = document.createElement('div');
    tracker.className = 'hx25-tracker';
    
    // Background video
    ensureTrackerVideo(tracker);
    
    // Scrim overlay
    const scrim = document.createElement('div');
    scrim.className = 'hx25-tracker-scrim';
    tracker.appendChild(scrim);
    
    // Content container
    const content = document.createElement('div');
    content.className = 'hx25-tracker-content';
    tracker.appendChild(content);
    
    // Title
    const title = document.createElement('div');
    title.className = 'hx25-tracker-title';
    title.textContent = 'Referral Progress';
    content.appendChild(title);
    
    // Main container (circles + indicator)
    const main = document.createElement('div');
    main.className = 'hx25-tracker-main';
    content.appendChild(main);
    
    // Circles container
    const circles = document.createElement('div');
    circles.className = 'hx25-tracker-circles';
    main.appendChild(circles);
    
    // Create circles
    for (let i = 0; i < TRACKER_CIRCLES; i++) {
      const circle = document.createElement('div');
      circle.className = 'hx25-circle';
      if (i < completedReferrals) {
        circle.classList.add('completed');
      }
      circles.appendChild(circle);
    }
    
    // Unlock indicator (to the right of circles)
    const indicator = document.createElement('div');
    indicator.className = 'hx25-unlock-indicator';
    
    if (completedReferrals >= TRACKER_CIRCLES) {
      indicator.textContent = '🎟️ Free Ticket!';
      indicator.classList.add('unlocked');
    } else {
      const remaining = TRACKER_CIRCLES - completedReferrals;
      indicator.textContent = `${remaining} more for free ticket`;
    }
    
    main.appendChild(indicator);
    
    // Animate in
    setTimeout(() => {
      indicator.classList.add('visible');
    }, 300);
    
    return tracker;
  }

  /* ========= PLACE BUTTON BELOW CARD ========= */
  function ensureButtonBlockBelow(section){
    log('🏗️ Ensuring button block below section:', section?.getAttribute('data-tier') || 'unknown');
    if (!section || !section.parentNode) {
      err('❌ No section or parent node provided');
      return null;
    }

    let block = section.nextElementSibling && section.nextElementSibling.classList?.contains('hx25-divider-block')
      ? section.nextElementSibling
      : null;

    if (block) {
      verbose('✅ Found existing block next to section');
    } else {
      log('🔍 No block found next to section, searching for existing block...');
      block = document.querySelector('.hx25-divider-block[data-tier-owner="true"]');
      if (block) {
        log('📦 Found existing block elsewhere, moving it...');
        if (block.previousElementSibling !== section) {
          section.insertAdjacentElement('afterend', block);
          log('✅ Block moved to correct position');
        }
      }
    }
    
    if (!block){
      log('🆕 Creating new divider block...');
      block = document.createElement('div');
      block.className = 'hx25-divider-block';
      block.setAttribute('data-tier-owner','true');
      section.insertAdjacentElement('afterend', block);
      log('✅ New block created and positioned');
    }

    let host = block.querySelector('.hx25-btn-host');
    if (!host){
      log('🏠 Creating button host container...');
      host = document.createElement('div');
      host.className = 'hx25-btn-host';
      block.appendChild(host);
    } else {
      verbose('✅ Button host already exists');
    }

    log('🔍 Looking for existing button...');
    let btn = host.querySelector(BTN_SELECTOR) || section.querySelector(BTN_SELECTOR);
    if (btn && btn.parentElement !== host) {
      log('📦 Moving existing button to host...');
      host.appendChild(btn);
    }
    if (!btn){
      log('🆕 Creating new button element...');
      btn = document.createElement('button');
      btn.id = 'hx25-button';
      host.appendChild(btn);
      log('✅ New button created');
    } else {
      log('✅ Using existing button:', btn.id || btn.className);
    }

    log('🏷️ Adding button classes and attributes...');
    btn.classList.add('hx25-button','hx25-btn');
    btn.setAttribute('aria-label','HX25 Referral Link');

    log('🎬 Setting up button components...');
    ensureVideo(btn);
    ensureLayer(btn, 'hx25-scrim');
    ensureLayer(btn, 'hx25-shine');
    ensureForeground(btn);
    attachLinkAndA11y(btn, section);

    // Add tracker below button
    let tracker = host.querySelector('.hx25-tracker');
    if (!tracker) {
      log('🎯 Adding referral tracker below button...');
      tracker = createTracker();
      host.appendChild(tracker);
    } else {
      verbose('✅ Tracker already exists');
    }

    log('✅ Button block and tracker setup complete');
    return { block, btn, tracker };
  }

  /* ========= TIERING / FLOW ========= */
  let isProcessing = false;
  let currentObserver = null;
  let hxObserver = null;

  function whenWrapperReady(cb){
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { 
      log('✅ Wrapper immediately available');
      cb(w); 
      return; 
    }
    
    log('⏳ Waiting for wrapper to appear...');
    if (currentObserver) currentObserver.disconnect();
    
    // Timeout safety for wrapper appearance
    const timeoutId = setTimeout(() => {
      warn('❌ Timeout waiting for wrapper to appear');
      if (currentObserver) {
        currentObserver.disconnect();
        currentObserver = null;
      }
    }, MAX_WAIT_TIME);
    
    currentObserver = new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { 
        clearTimeout(timeoutId);
        o.disconnect(); 
        currentObserver = null; 
        log('✅ Wrapper appeared via mutation observer');
        cb(w2); 
      }
    });
    currentObserver.observe(document.body, { childList:true, subtree:true });
  }

  function showTier(tier, wrapper){
    if (isProcessing) return;
    isProcessing = true;
    const all = wrapper.querySelectorAll('[data-tier]');
    all.forEach(s => { s.style.display = 'none'; });
    const target = wrapper.querySelector(`[data-tier="${tier}"]`);
    if (target) {
      target.style.display = 'block';
      target.style.setProperty('display','block','important');
    } else {
      all.forEach(s => s.style.removeProperty('display'));
    }
    updateBar(target || null, tier);
    isProcessing = false;
  }

  async function boot(wrapper){
    log('🚀 Starting boot process...');
    if (isProcessing) {
      warn('⚠️ Already processing, skipping boot');
      return;
    }
    isProcessing = true;
    
    try {
      // Wait for all elements to be ready
      log('🔍 Waiting for template elements...');
      const { wrapper: readyWrapper, nameEl, revEl, codeEl } = await waitForElements();
      
      log('🎯 Elements ready, starting main logic...');
      
      // Use the confirmed ready wrapper
      wrapper = readyWrapper;
      
      const vars = readVars();
      log('📊 Variables read:', vars);
      const tier = pickTier(vars);
      log('🎯 Selected tier:', tier);
      
      // Inject styles FIRST before any DOM manipulation
      injectStyles();
      
      // Call stats API on page load
      const code = getCode(wrapper);
      if (code) {
        callStatsAPI(code);
      }
      
      showTier(tier, wrapper);

      const active = wrapper.querySelector(`[data-tier="${tier}"]`) || wrapper.querySelector('[data-tier]');
      log('🎪 Active section found:', active?.getAttribute('data-tier') || 'none');
      
      if (active) {
        log('🔧 Setting up button for active section...');
        const result = ensureButtonBlockBelow(active);
        log('🎯 Button setup result:', result ? 'success' : 'failed');

        if (hxObserver) { 
          log('🔄 Disconnecting existing observer...');
          try { hxObserver.disconnect(); } catch(_){} 
          hxObserver = null; 
        }
        
        log('👀 Setting up mutation observer...');
        hxObserver = new MutationObserver(() => {
          verbose('🔄 Mutation detected, checking if button needs re-ensuring...');
          const sec = wrapper.querySelector(`[data-tier="${tier}"]`) || wrapper.querySelector('[data-tier]');
          if (sec) {
            // Only re-ensure if button or tracker doesn't exist
            const existingBtn = sec.nextElementSibling?.querySelector('.hx25-button');
            const existingTracker = sec.nextElementSibling?.querySelector('.hx25-tracker');
            if (!existingBtn || !existingTracker) {
              log('🔧 Button or tracker missing, re-ensuring...');
              ensureButtonBlockBelow(sec);
            } else {
              verbose('✅ Button and tracker still exist, skipping re-ensure');
            }
          }
        });
        try { 
          hxObserver.observe(wrapper, { childList:true, subtree:true }); 
          log('✅ Mutation observer active');
        } catch(e){
          err('❌ Failed to start mutation observer:', e);
        }
      } else {
        err('❌ No active section found!');
      }
      
      log('✅ Boot process complete');
      
    } catch (error) {
      err('❌ Boot process failed:', error);
    } finally {
      isProcessing = false;
    }
  }

  function start(){
    log('🌟 START called');
    if (isProcessing) {
      warn('⚠️ Already processing, aborting start');
      return;
    }
    if (isDisabled()) {
      warn('⚠️ Script disabled, aborting start');
      return;
    }
    
    log('⏳ Waiting for wrapper to be ready...');
    // Inject styles early to ensure they're available
    injectStyles();
    
    whenWrapperReady(async (wrapper) => {
      log('✅ Wrapper ready, hiding and starting boot sequence...');
      wrapper.style.visibility = 'hidden';
      setTimeout(async () => {
        log('👁️ Making wrapper visible and booting...');
        wrapper.style.visibility = 'visible';
        await boot(wrapper);
      }, INIT_DELAY);
    });
  }

  /* ========= SPA NAV ========= */
  if (!window.__sfNavigationTracker) {
    window.__sfNavigationTracker = { currentPage: location.pathname, visitedPages: new Set(), lastProcessedPage: null };
  }
  const tracker = window.__sfNavigationTracker;
  tracker.visitedPages.add(location.pathname);

  const shouldProcessPage = (pathname) => {
    if (!tracker.visitedPages.has(pathname)) return true;
    if (tracker.currentPage !== pathname) return true;
    if (tracker.lastProcessedPage !== pathname) return true;
    return false;
  };

  let lastPathname = location.pathname;
  let navigationTimeout = null;
  
  function handleNavigationChange(newPathname){
    if (newPathname === lastPathname) return;
    if (navigationTimeout) clearTimeout(navigationTimeout);

    tracker.currentPage = newPathname;
    tracker.visitedPages.add(newPathname);
    isProcessing = false;
    
    if (currentObserver) { currentObserver.disconnect(); currentObserver = null; }
    if (hxObserver)       { try { hxObserver.disconnect(); } catch(_){} hxObserver = null; }

    lastPathname = newPathname;
    
    if (newPathname.includes('/portal')) {
      navigationTimeout = setTimeout(() => {
        if (shouldProcessPage(newPathname)) {
          tracker.lastProcessedPage = newPathname;
          start();
        }
      }, 180);
    }
  }

  setInterval(() => { handleNavigationChange(location.pathname); }, 120);
  window.addEventListener('popstate', () => setTimeout(() => handleNavigationChange(location.pathname), 60));
  const _ps = history.pushState; const _rs = history.replaceState;
  history.pushState = function(...args){ _ps.apply(this, args); setTimeout(() => handleNavigationChange(location.pathname), 60); };
  history.replaceState = function(...args){ _rs.apply(this, args); setTimeout(() => handleNavigationChange(location.pathname), 60); };

  /* ========= BOOT ========= */
  log('🎬 Script initialization starting...');
  log('📍 Current pathname:', location.pathname);
  log('📄 Document ready state:', document.readyState);
  
  if (document.readyState === 'loading') {
    log('⏳ Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => { 
      log('✅ DOMContentLoaded fired');
      if (!isDisabled()) {
        log('🚀 Starting application...');
        start(); 
      } else {
        warn('❌ Application disabled, not starting');
      }
    }, { once:true });
  } else {
    log('✅ Document already ready');
    if (!isDisabled()) {
      log('🚀 Starting application immediately...');
      start();
    } else {
      warn('❌ Application disabled, not starting');
    }
  }

  /* ========= ROLLBACK ========= */
  try {
    window.HX25_rollback = function(){
      const styleEl = document.getElementById(STYLE_ID);
      if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl);
      const wrapper = document.getElementById('sf-campaign-wrapper');
      if (!wrapper) return;
      const blocks = wrapper.querySelectorAll('.hx25-divider-block');
      blocks.forEach(b => b.remove());
      window[DISABLE_FLAG] = true;
    };
    
    // Test function to manually trigger button click
    window.HX25_testButton = function(){
      log('🧪 Manual button test triggered');
      const btn = document.querySelector('.hx25-button');
      if (btn) {
        log('✅ Button found, triggering click...');
        btn.click();
      } else {
        err('❌ No button found!');
      }
    };
    
    // Debug function to inspect button state
    window.HX25_debugButton = function(){
      const btn = document.querySelector('.hx25-button');
      if (btn) {
        log('🔍 Button debug info:');
        log('- ID:', btn.id);
        log('- Classes:', btn.className);
        log('- __hxLinked:', btn.__hxLinked);
        log('- Event listeners:', getEventListeners ? getEventListeners(btn) : 'DevTools needed');
        log('- Parent:', btn.parentElement?.className);
        log('- Next sibling:', btn.nextElementSibling?.className);
      } else {
        err('❌ No button found!');
      }
    };
    
    // Test function to update tracker with different referral counts
    window.HX25_updateTracker = function(count = 2){
      log('🧪 Updating tracker with', count, 'referrals');
      const tracker = document.querySelector('.hx25-tracker');
      if (tracker) {
        tracker.remove();
        const host = document.querySelector('.hx25-btn-host');
        if (host) {
          const newTracker = createTracker(count);
          host.appendChild(newTracker);
          log('✅ Tracker updated');
        }
      } else {
        err('❌ No tracker found!');
      }
    };
  } catch(_){}
})();
