// index.js
const express = require('express');
const { PornHub } = require('pornhub.js');
const mumaker = require('mumaker');
const cors = require('cors');
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Headers manually (optional, since cors() handles it too)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ========== PornHub Video Info API ==========
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

// ========== Text-Photo Generator API ==========
async function maker(url, texts) {
  if (/https?:\/\/(ephoto360|photooxy|textpro)\.(com|me)/i.test(url)) throw new Error("URL Invalid");

  try {
    let a = await axios.get(url, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "User-Agent": "Mozilla/5.0",
        "Origin": (new URL(url)).origin,
        "Referer": url,
      }
    });

    let $ = cheerio.load(a.data);

    let server = $('#build_server').val();
    let serverId = $('#build_server_id').val();
    let token = $('#token').val();
    let submit = $('#submit').val();

    let types = [];
    $('input[name="radio0[radio]"]').each((i, elem) => {
      types.push($(elem).attr("value"));
    });

    let post = {
      submit,
      token,
      build_server: server,
      build_server_id: Number(serverId)
    };

    if (types.length > 0) {
      post['radio0[radio]'] = types[Math.floor(Math.random() * types.length)];
    }

    let form = new FormData();
    for (let i in post) form.append(i, post[i]);
    for (let text of texts) form.append("text[]", text);

    let b = await axios.post(url, form, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Origin": (new URL(url)).origin,
        "Referer": url,
        "Cookie": a.headers['set-cookie']?.join('; ') || "",
        ...form.getHeaders()
      }
    });

    $ = cheerio.load(b.data);
    let out = ($('#form_value').first().text() || $('#form_value_input').first().text() || $('#form_value').first().val() || $('#form_value_input').first().val());

    let c = await axios.post((new URL(url)).origin + "/effect/create-image", JSON.parse(out), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Referer": url,
        "Origin": (new URL(url)).origin,
        "Cookie": a.headers['set-cookie']?.join('; ') || "",
      }
    });

    return {
      status: c.data?.success,
      image: server + (c.data?.fullsize_image || c.data?.image || ""),
      session: c.data?.session_id
    };
  } catch (e) {
    throw e;
  }
}

app.get('/api/text-photo', async (req, res) => {
  try {
    const { url, ...queryParams } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    const texts = [];
    for (const key in queryParams) {
      if (key.startsWith('text')) texts.push(queryParams[key]);
    }

    if (texts.length === 0) return res.status(400).json({ error: 'At least one text parameter is required' });

    const result = await maker(url, texts);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating the text image', details: error.message });
  }
});

// ========== Health Check ==========
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
