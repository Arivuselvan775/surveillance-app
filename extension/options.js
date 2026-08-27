document.getElementById('grantBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the tracks immediately so it doesn't keep recording on the options page
        stream.getTracks().forEach(track => track.stop());
        
        document.getElementById('grantBtn').style.display = 'none';
        document.getElementById('successMsg').style.display = 'block';
        
        // Reload the extension to restart the offscreen document now that it has permission
        setTimeout(() => {
            chrome.runtime.reload();
        }, 2000);
    } catch (err) {
        alert('Microphone access was denied. Please allow it to use this extension.');
        console.error('Error accessing microphone:', err);
    }
});
