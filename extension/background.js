// background.js

// Function to create the offscreen document
async function createOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    
    // Check if the offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });
    
    if (existingContexts.length > 0) {
        return;
    }
    
    // Create the offscreen document
    await chrome.offscreen.createDocument({
        url: offscreenUrl,
        reasons: ['USER_MEDIA'],
        justification: 'Recording audio from the microphone in the background'
    });
}

// When the extension is installed or starts up, create the offscreen document
chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.openOptionsPage();
    createOffscreenDocument();
});
chrome.runtime.onStartup.addListener(createOffscreenDocument);
