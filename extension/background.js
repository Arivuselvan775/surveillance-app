// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectContentScript") {
        
        // Find the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                sendResponse({ status: "Error: No active tab found." });
                return;
            }
            
            const activeTabId = tabs[0].id;
            
            // First inject socket.io, then inject our content script
            chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                files: ['socket.io.min.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Script injection failed:", chrome.runtime.lastError);
                    sendResponse({ status: "Error injecting socket.io: " + chrome.runtime.lastError.message });
                    return;
                }
                
                chrome.scripting.executeScript({
                    target: { tabId: activeTabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Script injection failed:", chrome.runtime.lastError);
                        sendResponse({ status: "Error injecting content.js: " + chrome.runtime.lastError.message });
                    } else {
                        console.log("Successfully injected engine into tab", activeTabId);
                        sendResponse({ status: "Success" });
                    }
                });
            });
        });
        
        // Return true to indicate we wish to send a response asynchronously
        return true; 
    }
});
