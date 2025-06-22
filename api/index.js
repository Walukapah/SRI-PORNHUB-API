// api/index.js
import express from 'express';
import { PornHub } from 'pornhub.js';

const app = express();
const port = process.env.PORT || 8000;

const pornhub = new PornHub();

app.get('/api/video', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing video URL (use ?url=)' });
  }

  try {
    const video = await pornhub.video(url);
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Pornhub Video Info API is running. Use /api/video?url=...');
});

// ✅ This line MUST exist to keep the server alive
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
