const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all origins for Express

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for Socket.io
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const SECRET_PASSWORD = process.env.SECRET_PASSWORD || 'admin';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        cb(null, `recording-${timestamp}.webm`);
    }
});
const upload = multer({ storage });

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.json());

// Endpoints
app.post('/upload', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).send('File uploaded successfully.');
});

app.get('/api/recordings', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading uploads directory.');
        }
        // Filter out non-audio files if necessary and sort newest to oldest
        const sortedFiles = files
            .filter(file => file.endsWith('.webm'))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return { filename: file, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime)
            .map(file => file.filename);
        
        res.json(sortedFiles);
    });
});

app.delete('/api/recordings/:filename', (req, res) => {
    const filename = req.params.filename;
    // Sanitize filename to prevent directory traversal
    if (!/^[a-zA-Z0-9.\-_]+$/.test(filename)) {
        return res.status(400).send('Invalid filename.');
    }
    const filePath = path.join(UPLOADS_DIR, filename);
    
    fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('File not found.');
            }
            return res.status(500).send('Error deleting file.');
        }
        res.status(200).send('File deleted successfully.');
    });
});

// Socket.io for real-time signaling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('trigger-start', (payload) => {
        if (payload.password === SECRET_PASSWORD) {
            io.emit('start-recording');
            console.log('Broadcasted start-recording');
        } else {
            console.log('Invalid password for trigger-start');
        }
    });

    socket.on('trigger-stop', (payload) => {
        if (payload.password === SECRET_PASSWORD) {
            io.emit('stop-recording');
            console.log('Broadcasted stop-recording');
        } else {
            console.log('Invalid password for trigger-stop');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
