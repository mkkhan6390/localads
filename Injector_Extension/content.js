// content.js
// This script runs on every page and can be used for additional functionality
// Currently, it's minimal but can be extended as needed

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkInjection') {
    // Check if SDK script is already present
    const existingScript = document.querySelector('script[src*="localhost:5000/sdk"]');
    sendResponse({ injected: !!existingScript });
  }
  
  return true; // Keep the message channel open for asynchronous response
});

// Optional: Log when content script loads
console.log('Script Injector extension content script loaded');