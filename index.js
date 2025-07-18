// index.js
const express = require('express');
const { PornHub } = require('pornhub.js');
const mumaker = require('mumaker');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Text generation available types
const availableTypes = [
  'metallic', 'ice', 'snow', 'impressive', 'matrix',
  'light', 'neon', 'devil', 'purple', 'thunder',
  'leaves', '1917', 'arena', 'hacker', 'sand',
  'blackpink', 'glitch', 'fire'
];

// API endpoints

// Video info endpoint
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


// Text generation endpoint
app.all('/api/text-generate', async (req, res) => {
  try {
    const { text, type } = req.method === 'GET' ? req.query : req.body;

    if (!text || !type) {
      return res.status(400).json({
        success: false,
        message: "Required parameters missing: 'text' and 'type'",
        availableTypes: availableTypes
      });
    }

    if (!availableTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type specified",
        availableTypes: availableTypes
      });
    }

    let result;
    switch (type) {
      case 'ice':
        result = await mumaker.ephoto("https://en.ephoto360.com/ice-text-effect-online-101.html", text);
        break;
      case 'metallic':
        result = await mumaker.ephoto("https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html", text);
        break;
      case 'neon':
        result = await mumaker.ephoto("https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html", text);
        break;
      default:
        result = await mumaker.ephoto(`https://en.ephoto360.com/${type}-text-effect.html`, text);
    }

    if (!result?.image) {
      throw new Error('Failed to generate image');
    }

    res.json({
      success: true,
      imageUrl: result.image,
      text: text,
      type: type
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
