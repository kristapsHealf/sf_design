(function () {
  'use strict';

  /* --------- config --------- */
  const targets = { rise: 500, radiate: 2500, empower: null };

  /* --------- tiny helpers --------- */
  const $ = id => document.getElementById(id);

  const pickTier = ({ name, revenue }) => {
    const n = name.toLowerCase();
    if (n.includes('empower') || n.includes('t3') || revenue >= 2500) return 'empower';
    if (n.includes('radiate') || n.includes('t2') || revenue >=  500) return 'radiate';
    if (n.includes('rise')    || n.includes('t1')) return 'rise';
    return null; // No tier found
  };

  const updateBar = (section, tier, revenue) => {
    if (!section) return;
    const fill = section.querySelector('.progress-bar-fill');
    const txt  = section.querySelector('.progress-bar-text');
    if (!fill || !txt) return;

    const target = targets[tier];
    const pct    = target ? Math.min(100, (revenue / target) * 100) : 100;
    fill.style.width = pct + '%';
    txt.textContent  = target ? `£${revenue} / £${target}` : `£${revenue} (max tier)`;
  };

  const render = () => {
    const nameEl = $('sf-campaign-name');
    const revEl  = $('sf-revenue');
    const wrap   = $('sf-campaign-wrapper');
    if (!nameEl || !revEl || !wrap) return;                 // not ready yet

    const revenue = +revEl.textContent.replace(/[^0-9.]/g, '') || 0;
    const tier    = pickTier({ name: nameEl.textContent || '', revenue });

    // If no tier found, terminate script
    if (!tier) {
      console.log('❌ No tier found for campaign, terminating script');
      return;
    }

    document.querySelectorAll('.tier-section').forEach(s => s.style.display = 'none');
    const section = document.querySelector(`[data-tier="${tier}"]`);
    if (section) section.style.display = 'block';

    updateBar(section, tier, revenue);
    wrap.style.visibility = 'visible';                      // remove flash
  };

  /* --------- bootstrap --------- */
  const shouldRun = location.pathname.startsWith('/portal/');
  if (!shouldRun) return;

  // Hide wrapper immediately → no flash of wrong content
  (function hideEarly () {
    const w = $('sf-campaign-wrapper');
    if (w) w.style.visibility = 'hidden';
    else requestAnimationFrame(hideEarly);
  })();

  // Poll until the three key nodes exist, then render once
  const poll = setInterval(() => {
    if ($('sf-campaign-name') && $('sf-revenue') && $('sf-campaign-wrapper')) {
      clearInterval(poll);
      render();
      // Lightweight observer to re-render if React swaps nodes later
      new MutationObserver(render)
        .observe($('sf-campaign-wrapper'), { childList: true, subtree: true });
    }
  }, 50);   // 20 fps; fast, cheap, stops automatically
})();
