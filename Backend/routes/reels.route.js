import express from 'express';
import axios from 'axios';
import cors from 'cors';

const router = express.Router();

const PEXELS_API_KEY = '1IkZLBzUD6QrzOPYeXlr440KqEGl17JygudBaCiw0YPKD8qbGtEA4NJK';
const PEXELS_API_URL = 'https://api.pexels.com/videos/popular';

// Use CORS middleware to allow cross-origin requests
router.use(cors());

router.get('/random', async (req, res) => {
    try {
        const response = await axios.get(PEXELS_API_URL, {
            headers: { Authorization: PEXELS_API_KEY },
        });

        // Filter videos with potentially higher-quality formats
        const videos = response.data.videos.map((video) => {
            const videoFile = video.video_files.find(file => file.quality === 'hd'); // Prefer HD quality
            return {
                id: video.id,
                videoUrl: videoFile ? videoFile.link : video.video_files[0].link,
                user: video.user.name,
            };
        });

        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Error fetching videos' });
    }
});

export default router;
