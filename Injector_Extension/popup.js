// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const usernameInput = document.getElementById('username');
  const appidInput = document.getElementById('appid');
  const apikeyInput = document.getElementById('apikey');
  const adtypeSelect = document.getElementById('adtype');
  const injectBtn = document.getElementById('injectBtn');
  const status = document.getElementById('status');

  // Load saved values
  chrome.storage.sync.get(['username', 'appid', 'apikey', 'adtype'], function(result) {
    if (result.username) usernameInput.value = result.username;
    if (result.appid) appidInput.value = result.appid;
    if (result.apikey) apikeyInput.value = result.apikey;
    if (result.adtype) adtypeSelect.value = result.adtype;
  });

  // Save values when they change
  function saveValues() {
    chrome.storage.sync.set({
      username: usernameInput.value,
      appid: appidInput.value,
      apikey: apikeyInput.value,
      adtype: adtypeSelect.value
    });
  }

  usernameInput.addEventListener('input', saveValues);
  appidInput.addEventListener('input', saveValues);
  apikeyInput.addEventListener('input', saveValues);
  adtypeSelect.addEventListener('change', saveValues);

  // Show status message
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  }

  // Inject script button click handler
  injectBtn.addEventListener('click', async function() {
    const username = usernameInput.value.trim();
    const appid = appidInput.value.trim();
    const apikey = apikeyInput.value.trim();
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
        args: [username, appid, apikey, adtype]
      });

      showStatus('Script injected successfully!', 'success');
      
    } catch (error) {
      console.error('Injection failed:', error);
      showStatus('Failed to inject script', 'error');
    }
  });
});

// Function that will be injected into the page
function injectSDKScript(username, appid, apikey, adtype) {
  // Remove any existing SDK script first
  const existingScript = document.querySelector('script[src*="localhost:5000/sdk"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and inject the new script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'http://localhost:5000/sdk';
  script.setAttribute('username', username);
  script.setAttribute('appid', appid);
  script.setAttribute('apikey', apikey);
  script.setAttribute('adtype', adtype);
  
  // Append to head
  document.head.appendChild(script);
  
  console.log('SDK script injected with parameters:', { username, appid, apikey, adtype });
}