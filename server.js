const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Google Search API is running',
        endpoints: {
            search: '/api/search?q=your+query',
            health: '/health'
        },
        usage: 'Send GET request to /api/search?q=your_search_query'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: true, message: 'Server is healthy' });
});

// Google Search API endpoint
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.status(400).json({
            status: false,
            error: "Please provide a search query using ?q= parameter"
        });
    }

    try {
        const result = await googlesearch(query);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
});

// Also support POST requests
app.post('/api/search', async (req, res) => {
    const query = req.body.q || req.body.query;
    
    if (!query) {
        return res.status(400).json({
            status: false,
            error: "Please provide a search query in body (q or query)"
        });
    }

    try {
        const result = await googlesearch(query);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
});

async function googlesearch(query) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'api', 'app.py');
        
        const pythonProcess = spawn('python3', [pythonScript, query]);
        
        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[GOOGLE SEARCH] Python error: ${stderr}`);
                return resolve({
                    status: false,
                    error: `Python script failed: ${stderr || 'Unknown error'}`
                });
            }

            try {
                const result = JSON.parse(stdout.trim());
                resolve({
                    status: true,
                    result: result
                });
            } catch (e) {
                console.error(`[GOOGLE SEARCH] JSON parse error: ${e.message}`);
                console.error(`[GOOGLE SEARCH] Raw output: ${stdout}`);
                resolve({
                    status: false,
                    error: "Failed to parse search results"
                });
            }
        });

        setTimeout(() => {
            pythonProcess.kill();
            resolve({
                status: false,
                error: "Search timeout - took too long"
            });
        }, 30000);
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Google Search API running on port ${PORT}`);
    console.log(`🔗 Try: http://localhost:${PORT}/api/search?q=hello+world`);
});
