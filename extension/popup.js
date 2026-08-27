document.getElementById('injectBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "injectContentScript" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
            alert("Failed to start. Check console.");
        } else {
            console.log(response);
            document.getElementById('injectBtn').innerText = "Engine Started!";
            document.getElementById('injectBtn').disabled = true;
        }
    });
});
