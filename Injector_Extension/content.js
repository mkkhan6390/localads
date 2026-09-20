// content.js
// Runs on every page. It only answers the popup's "is the SDK already injected?" question.
// (The old "Test Ad Demo" placeholder + its fallback timers/observer were removed:
// the extension now shows only the real ad served by the SDK.)

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkInjection') {
    // Check if SDK script is already present
    const existingScript = document.querySelector('script[src*="localhost:5000/sdk"]');
    sendResponse({ injected: !!existingScript });
  }
  
  return true; // Keep the message channel open for asynchronous response
});

// --- Show a fresh ad after every page refresh --------------------------------
// The popup injects the SDK into the LIVE page, so a refresh removes it and no new ad
// is requested. The popup saves the settings it used in this tab's sessionStorage; if
// they are there, put the SDK back. The SDK remembers the rotation position in the
// site's localStorage, so every refresh asks for the NEXT ad in the sequence.
// Tabs where you never clicked "Inject Script" are not touched.
(function injectAgainAfterRefresh() {
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem('localads_injector') || 'null');
  } catch (e) {
    return; // storage blocked or corrupted -> do nothing
  }
  if (!saved || !saved.username || !saved.appid || !saved.apikey) return;
  if (document.querySelector('script[src*="localhost:5000/sdk"]')) return; // already there

  const script = document.createElement('script');
  script.async = true;
  script.src = 'http://localhost:5000/sdk';
  ['username', 'appid', 'apikey', 'adtype', 'position', 'pincode'].forEach((name) => {
    if (saved[name]) script.setAttribute(name, saved[name]);
  });
  (document.head || document.documentElement).appendChild(script);
})();

// Optional: Log when content script loads
console.log('Script Injector extension content script loaded');