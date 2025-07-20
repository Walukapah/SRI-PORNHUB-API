// index.js
const express = require('express');
const cors = require('cors');
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");
const { PornHub } = require('pornhub.js');

const app = express();
app.use(cors());
app.use(express.json());

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

// Function to generate text images
async function maker(url, texts) {
   if (/https?:\/\/(ephoto360|photooxy|textpro)\.(com|me)/i.test(url)) throw new Error("URL Invalid");
   try {
      let a = await axios.get(url, {
         headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Origin": (new URL(url)).origin,
            "Referer": url,
            "User -Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188"
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

      let post;
      if (types.length != 0) {
         post = {
            'radio0[radio]': types[Math.floor(Math.random() * types.length)],
            'submit': submit,
            'token': token,
            'build_server': server,
            'build_server_id': Number(serverId)
         };
      }
      else {
         post = {
            'submit': submit,
            'token': token,
            'build_server': server,
            'build_server_id': Number(serverId)
         }
      }

      let form = new FormData();
      for (let i in post) {
         form.append(i, post[i]);
      }
      
      // Add all text parameters to the form
      for (let text of texts) {
         form.append("text[]", text);
      }

      let b = await axios.post(url, form, {
         headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Origin": (new URL(url)).origin,
            "Referer": url,
            "User -Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188", 
            "Cookie": a.headers.get("set-cookie")?.join("; ") || "",
            ...form.getHeaders()
         }
      });

      $ = cheerio.load(b.data);
      let out = ($('#form_value').first().text() || $('#form_value_input').first().text() || $('#form_value').first().val() || $('#form_value_input').first().val());

      let c = await axios.post((new URL(url)).origin + "/effect/create-image", JSON.parse(out), {
         headers: {
            "Accept": "*/*",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": (new URL(url)).origin,
            "Referer": url,
            "User -Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
            "Cookie": a.headers.get("set-cookie")?.join("; ") || ""
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

// API endpoint for text generation
app.get('/api/text-generate', async (req, res) => {
   try {
      const { url, ...queryParams } = req.query;
      
      if (!url) {
         return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Extract all text parameters (text, text2, text3, etc.)
      const texts = [];
      for (const key in queryParams) {
         if (key.startsWith('text')) {
            texts.push(queryParams[key]);
         }
      }

      if (texts.length === 0) {
         return res.status(400).json({ error: 'At least one text parameter is required' });
      }

      const result = await maker(url, texts);
      res.json(result);
   } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while generating the text image', details: error.message });
   }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
