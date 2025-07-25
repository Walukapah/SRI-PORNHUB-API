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
    const params = req.method === 'GET' ? req.query : req.body;
    const { text, text2, url } = params;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Required parameter missing: 'url'"
      });
    }

    if (!text && !text2) {
      return res.status(400).json({
        success: false,
        message: "At least one of 'text' or 'text2' parameters is required"
      });
    }

    // Validate the URL format (basic validation)
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|'+ // domain name
      'localhost|'+ // localhost
      '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|'+ // IP address
      '\\[?[a-f\\d:]+\\]?)'+ // IPv6
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format"
      });
    }

    // Combine text and text2 if both exist
    const finalText = text2 ? `${text} ${text2}` : text;

    let result = await mumaker.ephoto(url, finalText);

    if (!result?.image) {
      throw new Error('Failed to generate image');
    }

    res.json({
      success: true,
      imageUrl: result.image,
      text: finalText
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
