const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let globalCookie = 'PHPSESSID_3a07edcde6f57a008f3251235df79776a424dd7623e40d4250e37e4f1f15fadf=f6010385d9c7a01965b002bbc9e759de';

app.post('/api/update-cookie', (req, res) => {
    const { newCookie } = req.body;
    if (newCookie) {
        if (newCookie.startsWith('PHPSESSID_')) {
            globalCookie = newCookie;
        } else {
            globalCookie = `PHPSESSID_3a07edcde6f57a008f3251235df79776a424dd7623e40d4250e37e4f1f15fadf=${newCookie}`;
        }
        return res.json({ success: true, cookie: globalCookie });
    }
    return res.status(400).json({ success: false, error: "Invalid cookie" });
});

app.post('/api/proxy', async (req, res) => {
    let { targetUrl, token, payload, customHeaders } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: "targetUrl is required" });
    }

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': globalCookie,
        'Referer': 'https://agents.ichancy100.com/reports/productsReport/users',
        'Origin': 'https://agents.ichancy100.com',
        'X-Requested-With': 'XMLHttpRequest',
        ...(customHeaders || {})
    };

    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload || {}),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
