const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let playbackState = {
    status: 'idle', 
    currentVideo: null
};

app.get('/status', (req, res) => {
    res.json(playbackState);
});

app.post('/play', (req, res) => {
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }
    playbackState = {
        status: 'playing',
        currentVideo: videoId
    };
    res.json({ message: `Playback started for ${videoId}`, state: playbackState });
});

app.post('/stop', (req, res) => {
    playbackState = {
        status: 'idle',
        currentVideo: null
    };
    res.json({ message: 'Playback stopped', state: playbackState });
});

const videoFileMapping = {
    'video.mp4': 'D:\\JOB\\winnow_testeng\\videos\\videoplayback.mp4',
};

app.get('/videos/:filename', (req, res) => {
    const filenName = req.params.filename;
    const filePath = videoFileMapping[filenName];
    if (!filePath) {
        return res.status(404).send('File was not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        const chunkSize = (end - start) + 1;

        const file = fs.createReadStream(filePath, { start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }

 })

 app.listen(3000, () => {
    console.log('Server is listening on port 3000')
 })


