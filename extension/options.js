document.getElementById('grant-mic-permission').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted successfully.');
    } catch (err) {
        console.error('Error accessing microphone:', err);
    }
});
