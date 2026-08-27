// offscreen.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startEngine") {
        console.log("Starting engine in offscreen document");
        
        // This is where you can initialize your socket connection and media recording.
        // For example:
        // const socket = io("http://localhost:3000");
        // socket.on("connect", () => console.log("Socket connected!"));
        
        sendResponse({ status: "Engine started" });
    }
});
