(function () {
  'use strict';

  /* ========= CONFIG ========= */
  const INIT_DELAY        = 320;
  const STYLE_ID          = 'hx25-button-tracker-v1';
  const BTN_SELECTOR      = '.hx25-button, .hx25-btn, [data-hx25-btn], #hx25-button';
  const VIDEO_SRC         = 'https://i.imgur.com/1zJtkCw.mp4';
  const LOGO_SRC          = 'https://cdn.shopify.com/s/files/1/0405/7291/1765/files/Group_10879850.svg?v=1754920813';
  const STOREFRONT_LOGO   = 'https://i.imgur.com/I8q0MKx.png';
  const STOREFRONT_LABEL  = 'Click here to edit your storefront';
  const LABEL_TEXT        = 'Copy your referral link';
  const DEFAULT_LINK      = 'https://www.eventbrite.com/e/healf-experience-tickets-1545147591039?';
  const DISABLE_FLAG      = '__HX25_DISABLE__';

  const TARGETS = { rise: 500, radiate: 2500, empower: null, practitioner: null, vip: null }; // --- NEW: VIP
  const DEBUG             = true; // Force enable extensive logging
  const VERBOSE           = false; // Extra detailed logging

  // Tracker config
  const TRACKER_CIRCLES   = 3; // Number of referral circles
  const MOCK_REFERRALS    = 0; // Mock data - completed referrals (0-3)
  const STATS_API_URL     = 'https://aiwellbeing.app.n8n.cloud/webhook/aff/stats';
  const SSO_API_URL       = 'https://aiwellbeing.app.n8n.cloud/webhook/cc/sso';

  // Theme tokens (match your tier card gradients)
  const TIER_THEMES = {
    rise:     { grad: 'linear-gradient(90deg, #F97644 8%, #EA3507 91.77%)',  sh: 'rgba(234,53,7,.35)',  shH: 'rgba(234,53,7,.48)' },
    radiate:  { grad: 'linear-gradient(90deg, #EDB278 8%, #DA701B 91.77%)', sh: 'rgba(218,112,27,.35)', shH: 'rgba(218,112,27,.48)' },
    empower:  { grad: 'linear-gradient(90deg, #9BB7DC 8%, #3B77BB 91.77%)', sh: 'rgba(59,119,187,.35)', shH: 'rgba(59,119,187,.48)' },
    vip:      { grad: 'linear-gradient(90deg, #498A6D 8%, #0E4027 91.77%)', sh: 'rgba(14,64,39,.35)',  shH: 'rgba(14,64,39,.48)' }
  };

  const log  = (...a) => { if (DEBUG) try { console.log('[HX25]', ...a); } catch(_){} };
  const warn = (...a) => { if (DEBUG) try { console.warn('[HX25]', ...a); } catch(_){} };
  const err  = (...a) => { if (DEBUG) try { console.error('[HX25]', ...a); } catch(_){} };
  const verbose = (...a) => { if (VERBOSE) try { console.log('[HX25-VERBOSE]', ...a); } catch(_){} };

  const isLocalhost = (() => {
    try { return /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname); } catch(_){ return false; }
  })();
  if (!location.pathname.includes('/portal') && !isLocalhost) return;
  const isDisabled = () => (typeof window !== 'undefined' && window[DISABLE_FLAG] === true);

  /* ========= STYLE ========= */
  function injectStyles() {
    log('🎨 Injecting styles...');
    let s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.head.appendChild(s);
    }
    s.textContent = `
/* Divider under main card (no visible line) */
.hx25-divider-block{ margin-top:16px; padding-top:0; border-top:0; }
.hx25-btn-host{}

/* Base button - slimmer */
.hx25-button, .hx25-btn{
  position:relative; display:block; width:100%;
  min-height:36px; border:1px solid rgba(255,255,255,.75); border-radius:9999px; overflow:hidden; cursor:pointer;
  background:rgba(255,255,255,.8);
  color:#0b2f66; box-shadow:0 3px 10px rgba(0,0,0,.12);
  backdrop-filter: blur(10px) saturate(1.02);
  transition:transform .16s ease, box-shadow .16s ease, background .16s ease, filter .16s ease;
  user-select:none; outline:none;
}
.hx25-button:focus-visible{ outline:2px solid rgba(255,255,255,.85); outline-offset:2px; box-shadow:0 0 0 2px rgba(11,47,102,.45) inset; }
.hx25-button.hx25-has-video, .hx25-btn.hx25-has-video{ background:rgba(255,255,255,.92); }
.hx25-button:hover, .hx25-btn:hover{
  transform:translateY(-1px) scale(1.01);
  box-shadow:0 10px 22px rgba(0,0,0,.20);
  background:#ffffff;
}
.hx25-button:active, .hx25-btn:active{ transform:translateY(0) scale(1.005); }
/* Hover bloom */
/* Disable hover bloom to prevent large white oval */
.hx25-button::after, .hx25-btn::after{ content:none !important; display:none !important; }

/* Video background */
.hx25-video{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  z-index:0; pointer-events:none; filter:saturate(1.08) contrast(1.04) brightness(.95);
}

/* Button placement inside main card */
.hx25-tracker .hx25-button{ margin:8px 10px 6px auto; max-width:320px; }
/* CTA row alignment (promo + button on same line) */
.hx25-cta-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin:44px 0 8px; }
.hx25-cta-row .hx25-button{ margin:0 16px 0 auto; height:36px; }

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

/* Foreground - horizontal layout (inside button) */
.hx25-layer{
  position:relative; z-index:3;
  display:flex; flex-direction:row; align-items:center; justify-content:center; gap:8px;
  padding:8px 12px;
}
/* Card header logo (outside button) */
.hx25-card-header{ display:flex; align-items:left; justify-content:left; gap:8px; margin-top:2px; }
.hx25-card-logo{ display:block; height:50px; width:auto; filter:drop-shadow(0 1px 1px rgba(0,0,0,.2)); opacity:.95; }
.hx25-card-subtle{ font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; font-weight:700; letter-spacing:.2px; opacity:.9; }
.hx25-label{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:17px; font-weight:500; line-height:1.2; letter-spacing:.2px;
  text-shadow:none; text-align:center;
  order:2; flex:0 1 auto;
}
.hx25-button .hx25-label{ color:#0b2f66; }
@media (max-width:420px){
  .hx25-label{ font-size:16px }
  .hx25-logo{ height:20px }
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

/* Storefront Button — themable by tier */
.hx25-storefront-button{
  position:relative; display:block !important; width:100%;
  min-height:48px !important; border:0 !important; border-radius:14px !important; overflow:hidden; cursor:pointer;
  background:#FF4438 !important; /* fallback, gets overridden by tier class */
  color:#fff !important; box-shadow:0 6px 22px rgba(255,68,56,.35);
  transition:transform .2s ease, box-shadow .2s ease, filter .2s ease;
  user-select:none; outline:none;
  margin-top:12px;
}
.hx25-storefront-button:hover{
  transform:translateY(-1px) scale(1.01);
  box-shadow:0 12px 30px rgba(255,68,56,.48);
}
.hx25-storefront-layer{
  position:relative; z-index:3;
  display:flex; flex-direction:row; align-items:center; justify-content:space-between;
  padding:8px 12px; gap:8px;
}
.hx25-storefront-logo{
  display:block; height:20px; width:100px; max-height:20px; max-width:100px; order:1;
  flex:0 0 100px; object-fit:contain;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));
}
.hx25-storefront-label{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:14px; font-weight:400; line-height:1.2; letter-spacing:.3px;
  text-align:center; color:#fff; order:2; flex:1;
}
@media (max-width:420px){
  .hx25-storefront-label{ font-size:16px }
  .hx25-storefront-layer{ padding:6px 10px }
  .hx25-storefront-logo{ height:32px; width:140px; max-height:32px; max-width:140px; flex:0 0 140px }
}

/* --- THEME VARIANTS: match tier cards --- */
.hx25-storefront-button.tier-rise{
  background: linear-gradient(90deg, #F97644 8%, #EA3507 91.77%) !important;
  box-shadow: 0 6px 22px rgba(234,53,7,.35);
}
.hx25-storefront-button.tier-rise:hover{
  box-shadow: 0 12px 30px rgba(234,53,7,.48);
}
.hx25-storefront-button.tier-radiate{
  background: linear-gradient(90deg, #EDB278 8%, #DA701B 91.77%) !important;
  box-shadow: 0 6px 22px rgba(218,112,27,.35);
}
.hx25-storefront-button.tier-radiate:hover{
  box-shadow: 0 12px 30px rgba(218,112,27,.48);
}
.hx25-storefront-button.tier-empower{
  background: linear-gradient(90deg, #9BB7DC 8%, #3B77BB 91.77%) !important;
  box-shadow: 0 6px 22px rgba(59,119,187,.35);
}
.hx25-storefront-button.tier-empower:hover{
  box-shadow: 0 12px 30px rgba(59,119,187,.48);
}
.hx25-storefront-button.tier-vip{
  background: linear-gradient(90deg, #498A6D 8%, #0E4027 91.77%) !important;
  box-shadow: 0 6px 22px rgba(14,64,39,.35);
}
.hx25-storefront-button.tier-vip:hover{
  box-shadow: 0 12px 30px rgba(14,64,39,.48);
}
.hx25-storefront-button.tier-practitioner{ /* --- NEW: Practitioner */
  background: linear-gradient(90deg, #AAABC0 8%, #6D6C96 91.77%) !important;
  box-shadow: 0 6px 22px rgba(109,108,150,.35);
}
.hx25-storefront-button.tier-practitioner:hover{ /* --- NEW: Practitioner */
  box-shadow: 0 12px 30px rgba(109,108,150,.48);
}

/* Referral Tracker - 20% shorter */
.hx25-tracker{
  margin-top:10px; padding:8px 10px; border-radius:14px; overflow:hidden;
  position:relative; background:linear-gradient(135deg,#0b2f66 0%,#164a7f 28%,#2c6aa3 55%,#5b9bd5 78%,#a8c7e6 100%);
  color:#fff; box-shadow:none;
}
.hx25-corner-logo{
  position:absolute; top:10px; left:10px; height:38px; width:auto;
  z-index:3; opacity:.95; pointer-events:none;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));
}
.hx25-inline-promo{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:14px; font-weight:500; letter-spacing:.2px; color:#fff; opacity:.98;
  text-align:left; background:rgba(0,0,0,.22);
  padding:10px 12px; border-radius:14px; display:block; line-height:1.25;
  white-space:pre-line; max-width:220px;
}
.hx25-tracker-video{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  z-index:0; pointer-events:none; filter:saturate(1.05) contrast(1.02) brightness(.9) blur(2px);
}
.hx25-tracker-scrim{
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background:rgba(255,255,255,.08);
}
.hx25-tracker-content{
  position:relative; z-index:2; display:flex; flex-direction:column; align-items:stretch; gap:6px;
}
.hx25-tracker-title{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:15px; font-weight:800; text-align:left; letter-spacing:.2px;
  text-shadow:0 1px 1px rgba(0,0,0,.2); margin-bottom:0;
  opacity:.95;
}
.hx25-tracker-main{
  display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; gap:8px;
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

/* Rewards table (replaces circles) */
.hx25-rewards-table{
  width:100%; display:flex; flex-direction:column; gap:6px; margin-top:2px;
}
.hx25-reward-row{
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 12px; border-radius:10px;
  background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18);
  backdrop-filter:saturate(1.02);
}
.hx25-reward-name{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:14px; font-weight:700; letter-spacing:.2px;
}
.hx25-reward-amount{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:16px; font-weight:900;
}
.hx25-wallet-note{
  font-family:'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size:12px; font-weight:600; text-align:center; letter-spacing:.2px;
  background:rgba(255,255,255,.2); padding:6px 12px; border-radius:16px;
  text-shadow:0 1px 1px rgba(0,0,0,.25); margin-top:8px;
  opacity:0; transform:translateY(-4px); transition:all .4s ease;
}
.hx25-wallet-note{ align-self:flex-start; text-align:left; }
.hx25-wallet-note.visible{ opacity:1; transform:translateY(0); }
`;
    log('✅ Styles injected/updated successfully');
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

  function getEmail(wrapper){
    try {
      const scoped = wrapper?.querySelector?.('#sf-email'); // ✅ fixed: use #sf-email
      const el = scoped || document.getElementById('sf-email');
      const text = el?.textContent?.trim() || '';
      if (text) return text;
    } catch(_){ }
    try { if (window.SF_EMAIL) return String(window.SF_EMAIL); } catch(_){ }
    return '';
  }

  // Simple webhook call that updates tracker - using simple GET to avoid CORS preflight
  function callStatsAPI(code) {
    try {
      log('📊 Calling stats API with code:', code);
      const url = `${STATS_API_URL}?code=${encodeURIComponent(code)}`;

      fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      }).then(data => {
        log('✅ Stats API response:', data);
        const reffCounts = parseInt(data.reffCounts) || 0;
        updateTrackerWithCount(reffCounts);
      }).catch(err => {
        warn('❌ Stats API failed:', err);
        updateTrackerWithCount(0);
      });
    } catch(e) {
      err('❌ Stats API call error:', e);
      updateTrackerWithCount(0);
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

    circles.forEach((circle, index) => {
      if (index < count) circle.classList.add('completed');
      else circle.classList.remove('completed');
    });

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
    if (n.includes('vip') || n.includes('green')) return 'vip';
    if (n.includes('practitioner')) return 'practitioner';    
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
    let vid = btn.querySelector('.hx25-video');
    if (!vid){
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
    }
    const tryPlay = () => {
      const p = vid.play && vid.play();
      if (p && p.then) {
        p.then(() => { btn.classList.add('hx25-has-video'); }).catch(() => {});
      }
    };
    vid.addEventListener('loadeddata', () => btn.classList.add('hx25-has-video'));
    vid.addEventListener('canplay', () => btn.classList.add('hx25-has-video'));
    vid.addEventListener('playing', () => btn.classList.add('hx25-has-video'));
    vid.addEventListener('error', () => btn.classList.remove('hx25-has-video'));

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
    let layer = btn.querySelector('.hx25-layer');
    if (!layer){
      layer = document.createElement('div');
      layer.className = 'hx25-layer';
      btn.appendChild(layer);
    }

    const oldLines = layer.querySelector('.hx25-lines');
    if (oldLines) oldLines.remove();
    const oldLabels = layer.querySelectorAll('.hx25-label-1, .hx25-label-2');
    oldLabels.forEach(label => label.remove());

    // Ensure no logo inside the button (logo now lives in card header)
    const embeddedLogo = layer.querySelector('.hx25-logo');
    if (embeddedLogo) embeddedLogo.remove();

    // Single-line label (center)
    let label = layer.querySelector('.hx25-label');
    if (!label){
      label = document.createElement('span');
      label.className = 'hx25-label';
      layer.appendChild(label);
    }
    label.textContent = LABEL_TEXT;
  }

  function attachLinkAndA11y(btn, host){
    let href = btn.getAttribute('data-hx-link')
      || host.getAttribute('data-hx-link')
      || window.HX25_LINK
      || DEFAULT_LINK;

    const code = getCode(host.closest('#sf-campaign-wrapper')) || 'DEFAULT_CODE';
    href = withQueryParam(href, 'aff', code);

    if (!btn.__hxLinked){
      btn.addEventListener('click', async (e) => {
        if (e.__isTest) return;
        e.stopPropagation(); e.preventDefault();

        if (btn.__copyLock) return;
        btn.__copyLock = true;

        try { 
          if (href && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(String(href));
          }
        } catch(ex){}

        try { 
          const existingElements = btn.querySelectorAll('.hx25-copy-flash, .hx25-copied-note');
          existingElements.forEach(n => n.remove());
        } catch(_){}

        try {
          const flash = document.createElement('span');
          flash.className = 'hx25-copy-flash';
          btn.appendChild(flash);
          setTimeout(() => { try { flash.remove(); } catch(_){ } }, 600);
        } catch(_){}

        try {
          const noteHost = btn.querySelector('.hx25-label') || btn.querySelector('.hx25-layer') || btn;
          if (noteHost) {
            const note = document.createElement('span');
            note.className = 'hx25-copied-note';
            note.textContent = '✓ Copied!';
            note.style.position = 'relative';
            note.style.display = 'inline-block';
            note.style.color = '#0b2f66';
            note.style.fontWeight = '700';
            note.style.fontSize = '12px';
            note.style.textShadow = 'none';
            note.style.marginLeft = '6px';
            note.style.zIndex = '5';
            noteHost.appendChild(note);
            setTimeout(() => { try { note.remove(); } catch(_){ } }, 900);
          }
        } catch(_){}

        setTimeout(() => { btn.__copyLock = false; }, 1000);
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

      setTimeout(() => {
        const testEvent = new Event('click', { bubbles: true, cancelable: true });
        testEvent.__isTest = true;
        btn.dispatchEvent(testEvent);
      }, 100);
    } else {
      setTimeout(() => {
        const testEvent = new Event('click', { bubbles: true, cancelable: true });
        testEvent.__isTest = true;
        btn.dispatchEvent(testEvent);
      }, 100);
    }
  }

  /* ========= REFERRAL TRACKER ========= */
  function resolveAbsoluteUrl(raw){
    try {
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return String(raw);
      if (/^\/\//.test(raw)) return location.protocol + raw;
      return new URL(String(raw), location.href).toString();
    } catch(_){ return ''; }
  }

  async function fetchSSOUrlWith(method, email){
    const url = `${SSO_API_URL}` + (method === 'GET' ? `?${new URLSearchParams({ email }).toString()}` : '');
    const opts = {
      method,
      mode: 'cors',
      cache: 'no-cache',
    };
    if (method === 'POST') {
      opts.body = new URLSearchParams({ email });
    }
    const res = await fetch(url, opts);
    if (res.redirected && res.url) {
      return res.url;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    let data;
    try { data = await res.json(); }
    catch(_) { data = await res.text(); }
    const targetUrl = typeof data === 'string' ? data : (data?.url || data?.redirect || data?.link || data?.location);
    return targetUrl || '';
  }

  async function callSSOApi(email){
    try {
      const target = await fetchSSOUrlWith('POST', email);
      return resolveAbsoluteUrl(target);
    } catch(e){
      err('❌ SSO API failed:', e);
      return '';
    }
  }

  // Apply correct theme class to the storefront button based on section tier
  function themeStorefrontButton(btn, sectionOrTier){
    const tier = (typeof sectionOrTier === 'string' ? sectionOrTier : (sectionOrTier?.getAttribute?.('data-tier') || '')).toLowerCase();
    btn.classList.remove('tier-rise','tier-radiate','tier-empower','tier-practitioner','tier-vip');
    if (tier === 'empower')      btn.classList.add('tier-empower');
    else if (tier === 'radiate') btn.classList.add('tier-radiate');
    else if (tier === 'practitioner') btn.classList.add('tier-practitioner');
    else if (tier === 'vip')     btn.classList.add('tier-vip');
    else                         btn.classList.add('tier-rise'); // default
  }

  function attachStorefrontHandler(btn, wrapper){
    if (btn.__hxSSO) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.__ssoLock) return;
      const email = getEmail(wrapper);
      if (!email) { warn('⚠️ No sf_email found for SSO'); return; }
      const WIN_NAME = 'hx25_storefront_sso_' + Date.now();
      let pendingWin = null;
      try { pendingWin = window.open('', WIN_NAME); } catch(_){ }
      btn.__ssoLock = true;
      const labelEl = btn.querySelector('.hx25-storefront-label');
      const prevText = labelEl?.textContent || '';
      try {
        if (labelEl) labelEl.textContent = 'Connecting…';
        btn.classList.add('is-loading');
        btn.style.opacity = '0.85';
        btn.disabled = true;
        btn.setAttribute('aria-busy','true');
      } catch(_){ }
      const target = await callSSOApi(email);
      try {
        if (labelEl) labelEl.textContent = prevText;
        btn.classList.remove('is-loading');
        btn.style.opacity = '';
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      } catch(_){ }
      btn.__ssoLock = false;
      if (target && /^https?:/i.test(target)) {
        const navigate = () => {
          if (pendingWin) {
            try {
              try { pendingWin.opener = null; } catch(_){ }
              pendingWin.location.replace(target);
              try { pendingWin.focus && pendingWin.focus(); } catch(_){ }
            } catch(_){
              window.open(target, '_blank', 'noopener,noreferrer');
            }
          } else {
            window.open(target, '_blank', 'noopener,noreferrer');
          }
        };
        setTimeout(navigate, 150);
      } else {
        try {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = SSO_API_URL;
          form.style.display = 'none';
          form.target = pendingWin ? WIN_NAME : '_blank';
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'email';
          input.value = email;
          form.appendChild(input);
          document.body.appendChild(form);
          warn('⚠️ Using POST form fallback to SSO webhook');
          form.submit();
          if (!pendingWin) { try { document.body.removeChild(form); } catch(_){ } }
        } catch(ex){
          err('❌ Failed POST form fallback:', ex);
          if (pendingWin) { try { pendingWin.close(); } catch(_){ } }
        }
      }
    }, { passive:false });
    btn.__hxSSO = true;
  }

  function createStorefrontButton(){
    const btn = document.createElement('button');
    btn.className = 'hx25-storefront-button';
    btn.setAttribute('aria-label', 'Click here to customise your storefront');
    btn.type = 'button';
    // Keep sizing guardrails, but DO NOT force background/color inline (let theme classes win)
    try {
      btn.style.setProperty('display', 'block', 'important');
      btn.style.setProperty('width', '100%', 'important');
      btn.style.setProperty('min-height', '48px', 'important');
      btn.style.setProperty('border', '0', 'important');
      btn.style.setProperty('border-radius', '14px', 'important');
      // background / color intentionally omitted so tier class can control them
      btn.style.setProperty('margin-top', '12px', 'important');
    } catch(_){}

    const layer = document.createElement('div');
    layer.className = 'hx25-storefront-layer';
    btn.appendChild(layer);

    const logo = document.createElement('img');
    logo.className = 'hx25-storefront-logo';
    logo.alt = 'Storefront';
    logo.decoding = 'async';
    logo.loading = 'eager';
    logo.src = STOREFRONT_LOGO;
    try {
      logo.style.setProperty('height', '40px', 'important');
      logo.style.setProperty('width', '150px', 'important');
      logo.style.setProperty('max-height', '40px', 'important');
      logo.style.setProperty('max-width', '150px', 'important');
      logo.style.setProperty('flex', '0 0 200px', 'important');
      logo.style.setProperty('object-fit', 'contain', 'important');
      logo.style.setProperty('display', 'inline-block', 'important');
    } catch(_){ }
    layer.appendChild(logo);

    const label = document.createElement('span');
    label.className = 'hx25-storefront-label';
    label.textContent = STOREFRONT_LABEL;
    layer.appendChild(label);

    return btn;
  }

  function ensureTrackerVideo(tracker){
    let vid = tracker.querySelector('.hx25-tracker-video');
    if (!vid){
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
    }
    const tryPlay = () => {
      const p = vid.play && vid.play();
      if (p && p.then) p.then(() => {}).catch(() => {});
    };
    vid.addEventListener('loadeddata', tryPlay);
    vid.addEventListener('canplay', tryPlay);
    tryPlay();
  }

  function createTracker(){
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

    // Corner logo (top-left of the card)
    const cornerLogo = document.createElement('img');
    cornerLogo.className = 'hx25-corner-logo';
    cornerLogo.alt = 'HX25';
    cornerLogo.decoding = 'async';
    cornerLogo.loading  = 'eager';
    cornerLogo.src = LOGO_SRC;
    tracker.appendChild(cornerLogo);

    // CTA row: promo (left) + button (right)
    const ctaRow = document.createElement('div');
    ctaRow.className = 'hx25-cta-row';
    // Note: button will be appended to this row later; promo comes second
    const promo = document.createElement('div');
    promo.className = 'hx25-inline-promo';
    promo.textContent = 'Share code HX10\nfor 10% off all tickets';
    ctaRow.appendChild(promo);
    content.appendChild(ctaRow);

    // Title
    const title = document.createElement('div');
    title.className = 'hx25-tracker-title';
    title.textContent = 'Referral Rewards';
    content.appendChild(title);

    // Main container (rewards table)
    const main = document.createElement('div');
    main.className = 'hx25-tracker-main';
    content.appendChild(main);

    const table = document.createElement('div');
    table.className = 'hx25-rewards-table';
    main.appendChild(table);

    const chips = [
      { text: 'Explorer Pass', amount: '£50 reward' },
      { text: 'Enhanced Pass', amount: '£100 reward' },
      { text: 'VIP Pass', amount: '£250 reward' }
    ];

    chips.forEach(({ text, amount }) => {
      const row = document.createElement('div');
      row.className = 'hx25-reward-row';

      const label = document.createElement('div');
      label.className = 'hx25-reward-name';
      label.textContent = text;

      const val = document.createElement('div');
      val.className = 'hx25-reward-amount';
      val.textContent = amount;

      row.appendChild(label);
      row.appendChild(val);
      table.appendChild(row);
    });

    // Removed wallet note per design update

    return tracker;
  }

  /* ========= PLACE BUTTON BELOW CARD ========= */
  function ensureButtonBlockBelow(section){
    if (!section || !section.parentNode) return null;

    let block = section.nextElementSibling && section.nextElementSibling.classList?.contains('hx25-divider-block')
      ? section.nextElementSibling
      : null;

    if (!block){
      block = document.querySelector('.hx25-divider-block[data-tier-owner="true"]');
      if (block) {
        if (block.previousElementSibling !== section) {
          section.insertAdjacentElement('afterend', block);
        }
      }
    }

    if (!block){
      block = document.createElement('div');
      block.className = 'hx25-divider-block';
      block.setAttribute('data-tier-owner','true');
      section.insertAdjacentElement('afterend', block);
    }

    let host = block.querySelector('.hx25-btn-host');
    if (!host){
      host = document.createElement('div');
      host.className = 'hx25-btn-host';
      block.appendChild(host);
    }

    let btn = host.querySelector(BTN_SELECTOR) || section.querySelector(BTN_SELECTOR);
    if (btn && btn.parentElement !== host) host.appendChild(btn);
    if (!btn){
      btn = document.createElement('button');
      btn.id = 'hx25-button';
      host.appendChild(btn);
    }

    btn.classList.add('hx25-button','hx25-btn');
    btn.setAttribute('aria-label','HX25 Referral Link');

    // Keep button minimal/glassy; no per-button video/sheen layers
    ensureForeground(btn);
    attachLinkAndA11y(btn, section);

    // Ensure tracker card exists, then place the button inside it (single extended card)
    let tracker = host.querySelector('.hx25-tracker');
    if (!tracker) {
      tracker = createTracker();
      host.appendChild(tracker);
    }
    try {
      const contentEl = tracker.querySelector('.hx25-tracker-content');
      const ctaRow = contentEl && contentEl.querySelector('.hx25-cta-row');
      if (ctaRow && btn.parentElement !== ctaRow) {
        ctaRow.insertBefore(btn, ctaRow.firstChild);
      }
    } catch(_){ }

    // Add storefront button below tracker
    let storefrontBtn = host.querySelector('.hx25-storefront-button');
    if (!storefrontBtn) {
      storefrontBtn = createStorefrontButton();
      if (tracker && tracker.parentNode === host) {
        host.insertBefore(storefrontBtn, tracker.nextSibling);
      } else {
        host.appendChild(storefrontBtn);
      }
    } else {
      // Ensure storefront button appears after tracker
      if (tracker && storefrontBtn.previousElementSibling !== tracker) {
        host.insertBefore(storefrontBtn, tracker.nextSibling);
      }
    }

    // ✅ THEME the storefront button to match this section's tier
    themeStorefrontButton(storefrontBtn, section);

    // Attach SSO click handler
    const wrapperEl = document.getElementById('sf-campaign-wrapper');
    if (storefrontBtn && wrapperEl) attachStorefrontHandler(storefrontBtn, wrapperEl);

    return { block, btn, tracker, storefrontBtn };
  }

  /* ========= TIERING / FLOW ========= */
  let isProcessing = false;
  let currentObserver = null;
  let hxObserver = null;

  function whenWrapperReady(cb){
    const w = document.getElementById('sf-campaign-wrapper');
    if (w) { cb(w); return; }
    if (currentObserver) currentObserver.disconnect();
    currentObserver = new MutationObserver((_, o) => {
      const w2 = document.getElementById('sf-campaign-wrapper');
      if (w2) { o.disconnect(); currentObserver = null; cb(w2); }
    });
    currentObserver.observe(document.body, { childList:true, subtree:true });
  }

  function whenTierReady(cb){
    if (document.querySelector('[data-tier]')) return cb();
    const mo = new MutationObserver(() => {
      if (document.querySelector('[data-tier]')) { mo.disconnect(); cb(); }
    });
    mo.observe(document.body, { childList:true, subtree:true });
  }

  function showTier(tier, wrapper){
    if (isProcessing) return;
    isProcessing = true;
    const all = document.querySelectorAll('[data-tier]');
    all.forEach(s => { s.style.display = 'none'; });
    const target = document.querySelector(`[data-tier="${tier}"]`);
    if (target) {
      target.style.display = 'block';
      target.style.setProperty('display','block','important');
    } else {
      all.forEach(s => s.style.removeProperty('display'));
    }
    updateBar(target || null, tier);
    isProcessing = false;
  }

  function boot(wrapper){
    if (isProcessing) return;

    const vars = readVars();
    const tier = pickTier(vars);

    // Inject styles FIRST
    injectStyles();

    // Stats API for tracker
    const code = getCode(wrapper);
    if (code) callStatsAPI(code);

    // Show the right tier
    showTier(tier, wrapper);

    const active = document.querySelector(`[data-tier="${tier}"]`) || document.querySelector('[data-tier]');
    if (active) {
      const result = ensureButtonBlockBelow(active);

      if (hxObserver) { try { hxObserver.disconnect(); } catch(_){} hxObserver = null; }

      // Observe for SPA re-renders; keep storefront button themed
      hxObserver = new MutationObserver(() => {
        const sec = document.querySelector(`[data-tier="${tier}"]`) || document.querySelector('[data-tier]');
        if (sec) {
          const existingBtn = sec.nextElementSibling?.querySelector('.hx25-button');
          const existingTracker = sec.nextElementSibling?.querySelector('.hx25-tracker');
          const existingStorefront = sec.nextElementSibling?.querySelector('.hx25-storefront-button');
          if (!existingBtn || !existingTracker || !existingStorefront) {
            ensureButtonBlockBelow(sec);
          } else {
            // Re-apply theme just in case something changed
            themeStorefrontButton(existingStorefront, sec);
          }
        }
      });
      try { 
        hxObserver.observe(wrapper, { childList:true, subtree:true }); 
      } catch(_){}
    }
  }

  function start(){
    if (isProcessing || isDisabled()) return;

    // Inject styles early
    injectStyles();

    whenWrapperReady(wrapper => {
      injectStyles();
      whenTierReady(() => {
        setTimeout(() => boot(wrapper), INIT_DELAY);
      });
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (!isDisabled()) start(); }, { once:true });
  } else {
    if (!isDisabled()) start();
  }

  /* ========= ROLLBACK / DEBUG ========= */
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

    window.HX25_testButton = function(){
      const btn = document.querySelector('.hx25-button');
      if (btn) btn.click();
    };

    window.HX25_debugButton = function(){
      const btn = document.querySelector('.hx25-button');
      if (btn) {
        console.log('[HX25] Button debug -> id:', btn.id, 'classes:', btn.className, '__hxLinked:', btn.__hxLinked);
      }
    };

    window.HX25_updateTracker = function(count = 2){
      const tracker = document.querySelector('.hx25-tracker');
      if (tracker) {
        tracker.remove();
        const host = document.querySelector('.hx25-btn-host');
        if (host) host.appendChild(createTracker(count));
      }
    };
  } catch(_){}
})();
