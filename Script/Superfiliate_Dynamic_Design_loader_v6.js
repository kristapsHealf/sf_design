(function () {
  'use strict';

  console.log('🚀 LOADING DIAGNOSTIC SCRIPT STARTED');
  console.log('⏰ Script load time:', new Date().toISOString());
  console.log('📍 URL:', location.href);
  console.log('📄 Document ready state:', document.readyState);
  console.log('🎯 Script source type:', document.currentScript ? 'External file' : 'Console/Inline');

  // Test 1: Basic environment
  console.log('\n=== ENVIRONMENT TEST ===');
  console.log('- Window object:', typeof window);
  console.log('- Document object:', typeof document);
  console.log('- Console object:', typeof console);
  console.log('- Location pathname:', location.pathname);
  console.log('- Portal check passes:', location.pathname.includes('/portal'));

  // Test 2: DOM state
  console.log('\n=== DOM STATE TEST ===');
  console.log('- Document head:', !!document.head);
  console.log('- Document body:', !!document.body);
  console.log('- Body children count:', document.body?.children?.length || 0);

  // Test 3: Critical elements
  console.log('\n=== ELEMENT TEST ===');
  const wrapper = document.getElementById('sf-campaign-wrapper');
  const nameEl = document.getElementById('sf-campaign-name');
  const revEl = document.getElementById('sf-revenue');
  const codeEl = document.getElementById('sf-code');

  console.log('- sf-campaign-wrapper:', !!wrapper);
  console.log('- sf-campaign-name:', !!nameEl, nameEl?.textContent?.trim());
  console.log('- sf-revenue:', !!revEl, revEl?.textContent?.trim());
  console.log('- sf-code:', !!codeEl, codeEl?.textContent?.trim());

  if (wrapper) {
    const sections = wrapper.querySelectorAll('[data-tier]');
    console.log('- Tier sections found:', sections.length);
    sections.forEach((section, i) => {
      console.log(`  Section ${i}: ${section.dataset.tier}`);
    });
  }

  // Test 4: Try the actual HX script logic
  console.log('\n=== HX SCRIPT SIMULATION ===');
  
  try {
    // Simulate the actual script conditions
    if (!location.pathname.includes('/portal')) {
      console.log('❌ Would exit: pathname check failed');
      return;
    }
    console.log('✅ Pathname check passed');

    const isDisabled = () => (typeof window !== 'undefined' && window['__HX25_DISABLE__'] === true);
    if (isDisabled()) {
      console.log('❌ Would exit: script disabled');
      return;
    }
    console.log('✅ Disabled check passed');

    // Check for elements that the script needs
    if (!wrapper) {
      console.log('❌ Critical: sf-campaign-wrapper not found');
    } else {
      console.log('✅ sf-campaign-wrapper found');
      
      // Try basic tier detection
      const rawName = nameEl?.textContent?.trim() || '';
      const rawRev = revEl?.textContent?.trim() || '';
      const revenue = parseFloat(rawRev.replace(/[^0-9.]/g,'')) || 0;
      
      console.log('- Raw name:', rawName);
      console.log('- Raw revenue:', rawRev);
      console.log('- Parsed revenue:', revenue);
      
      const n = rawName.toLowerCase();
      let tier = 'rise';
      if (n.includes('empower') || n.includes('t3') || revenue >= 2500) tier = 'empower';
      else if (n.includes('radiate') || n.includes('t2') || revenue >= 500) tier = 'radiate';
      
      console.log('- Detected tier:', tier);
      
      // Check if the target section exists
      const targetSection = wrapper.querySelector(`[data-tier="${tier}"]`);
      console.log('- Target section found:', !!targetSection);
      
      if (targetSection) {
        console.log('- Target section current display:', targetSection.style.display);
        console.log('- Target section computed display:', window.getComputedStyle(targetSection).display);
      }
    }

    console.log('✅ HX script simulation completed without errors');

  } catch (error) {
    console.log('❌ Error in HX script simulation:', error);
  }

  // Test 5: Check for conflicting scripts
  console.log('\n=== CONFLICT CHECK ===');
  const existingStyles = document.querySelectorAll('style[id*="hx25"]');
  console.log('- Existing HX25 styles:', existingStyles.length);
  
  const existingScripts = document.querySelectorAll('script[src*="superfiliate"], script[src*="hx25"]');
  console.log('- Existing HX25/Superfiliate scripts:', existingScripts.length);

  // Test 6: Timing test
  console.log('\n=== TIMING TEST ===');
  function checkAfterDelay(delay) {
    setTimeout(() => {
      const wrapperDelayed = document.getElementById('sf-campaign-wrapper');
      console.log(`After ${delay}ms - wrapper exists:`, !!wrapperDelayed);
      if (wrapperDelayed) {
        const sectionsDelayed = wrapperDelayed.querySelectorAll('[data-tier]');
        console.log(`After ${delay}ms - sections found:`, sectionsDelayed.length);
      }
    }, delay);
  }

  checkAfterDelay(100);
  checkAfterDelay(500);
  checkAfterDelay(1000);
  checkAfterDelay(2000);

  console.log('\n🏁 LOADING DIAGNOSTIC COMPLETED');
  console.log('📝 Summary: Check logs above for any ❌ failures');

})();