// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const usernameInput = document.getElementById('username');
  const appidInput = document.getElementById('appid');
  const apikeyInput = document.getElementById('apikey');
  const pincodeInput = document.getElementById('pincode');
  const adtypeSelect = document.getElementById('adtype');
  const injectBtn = document.getElementById('injectBtn');
  const status = document.getElementById('status');

  // Load saved values
  chrome.storage.sync.get(['username', 'appid', 'apikey', 'adtype', 'pincode'], function(result) {
    if (result.username) usernameInput.value = result.username;
    if (result.appid) appidInput.value = result.appid;
    if (result.apikey) apikeyInput.value = result.apikey;
    if (result.adtype) adtypeSelect.value = result.adtype;
    if (result.pincode) pincodeInput.value = result.pincode;
  });

  // Save values when they change
  function saveValues() {
    chrome.storage.sync.set({
      username: usernameInput.value,
      appid: appidInput.value,
      apikey: apikeyInput.value,
      adtype: adtypeSelect.value,
      pincode: pincodeInput.value
    });
  }

  usernameInput.addEventListener('input', saveValues);
  appidInput.addEventListener('input', saveValues);
  apikeyInput.addEventListener('input', saveValues);
  pincodeInput.addEventListener('input', saveValues);
  adtypeSelect.addEventListener('change', saveValues);

  // Show status message
  let statusTimer = null;
  function showStatus(message, type, duration = 3000) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.classList.add('hidden');
    }, duration);
  }

  // Tell the user whether a REAL ad actually appeared (instead of a fake test ad).
  // The SDK needs a few seconds: location lookup (up to 5s) + the server call.
  let adCheckId = 0;
  async function waitForAd(tabId) {
    const myId = ++adCheckId; // a newer injection cancels older checks
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (myId !== adCheckId) return;
      try {
        const [res] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => !!document.getElementById('ad-container')
        });
        if (res && res.result) {
          showStatus('Ad is showing on the page', 'success');
          return;
        }
      } catch (e) {
        return; // tab closed / navigated away
      }
    }
    if (myId === adCheckId) {
      showStatus('No ad returned. Check that an active ad exists for this pincode and Ad Type.', 'error', 6000);
    }
  }

  // Inject script button click handler
  injectBtn.addEventListener('click', async function() {
    const username = usernameInput.value.trim();
    const appid = appidInput.value.trim();
    const apikey = apikeyInput.value.trim();
    const pincode = pincodeInput.value.trim();
    const adtype = adtypeSelect.value;

    // Validate inputs
    if (!username || !appid || !apikey) {
      showStatus('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('No active tab found', 'error');
        return;
      }

      // Inject the script into the current page
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectSDKScript,
        args: [username, appid, apikey, adtype, pincode]
      });

      showStatus('Script injected successfully!', 'success');
      waitForAd(tab.id);

    } catch (error) {
      console.error('Injection failed:', error);
      showStatus('Failed to inject script', 'error');
    }
  });
});

// Function that will be injected into the page
function injectSDKScript(username, appid, apikey, adtype, pincode) {
  // Remove any existing SDK script first
  const existingScript = document.querySelector('script[src*="localhost:5000/sdk"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Also remove the ad left on the page by the previous injection. The SDK only
  // builds its ad box (position + size) when none exists yet, so without this,
  // choosing a different Ad Type would keep the old box (or the dim backdrop).
  ['ad-container', 'ad-backdrop'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  // Create and inject the new script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'http://localhost:5000/sdk';
  script.setAttribute('username', username);
  script.setAttribute('appid', appid);
  script.setAttribute('apikey', apikey);
  script.setAttribute('adtype', adtype);
  // The SDK chooses WHICH ads to request from `position` (sidebar | bottom |
  // fullscreen), not from `adtype`. Without this, every injection asked for the
  // right-sidebar slot, so bottom-banner and interstitial ads could never show.
  const POSITION_BY_ADTYPE = { 'bottom-banner': 'bottom', 'right-sidebar': 'sidebar', 'interstitial': 'fullscreen' };
  script.setAttribute('position', POSITION_BY_ADTYPE[adtype] || 'sidebar');
  if (pincode) {
    script.setAttribute('pincode', pincode);
  }
  
  // Append to head
  document.head.appendChild(script);

  // Remember these exact settings for THIS TAB only (sessionStorage is cleared when the
  // tab closes). A page refresh throws the injected SDK away, so content.js reads this
  // and injects the SDK again after every refresh -> a fresh (next) ad each time.
  try {
    sessionStorage.setItem('localads_injector', JSON.stringify({
      username, appid, apikey, adtype, position: script.getAttribute('position'), pincode
    }));
  } catch (e) {
    // The site blocks storage: the ad still shows now, it just won't come back after a refresh.
  }
  
  console.log('SDK script injected with parameters:', { username, appid, apikey, adtype, pincode, position: script.getAttribute('position') });
}