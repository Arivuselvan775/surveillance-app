// background.js

let creating;
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['USER_MEDIA'], 
      justification: 'Background processing and recording'
    });
    await creating;
    creating = null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectContentScript") {
        setupOffscreenDocument('offscreen.html').then(() => {
            // Tell the offscreen document to start the engine
            chrome.runtime.sendMessage({ action: "startEngine" });
            sendResponse({ status: "Success" });
        }).catch(err => {
            console.error("Failed to create offscreen document:", err);
            sendResponse({ status: "Error: " + err.message });
        });
        
        return true; // async response
    }
});
