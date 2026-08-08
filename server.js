const express = require('express');
const cors = require('cors');

const app = express();

// تفعيل Cors و JSON Body Parser
app.use(cors());
app.use(express.json());

// Endpoint الـ Proxy المعالج
app.post('/api/proxy', async (req, res) => {
    try {
        const { targetUrl, payload, token } = req.body;

        if (!targetUrl) {
            return res.status(400).json({ error: "targetUrl is required" });
        }

        // 1. تزوير الـ Headers ليبين الطلب كأنه طالع من متصفح Chrome طبيعي
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Origin': 'https://agents.ichancy100.com',
            'Referer': 'https://agents.ichancy100.com/'
        };

        // إرفاق التوكين بالـ Headers في حال وجوده
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 2. إرسال الطلب للسيرفر الهدف
        const apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: payload ? JSON.stringify(payload) : undefined
        });

        // 3. قراءة الرد كـ Text لحماية السيرفر من الحظر والـ Crash
        const textData = await apiResponse.text();

        try {
            // محاولة تحويل النص القادم لـ JSON
            const jsonData = JSON.parse(textData);
            return res.status(apiResponse.status).json(jsonData);
        } catch (e) {
            // في حال رُفض الطلب ورجعت صفحة HTML (مثلاً Cloudflare Block)
            console.error("الموقع حظر الطلب ورجّع HTML بدل JSON:", textData.substring(0, 200));
            return res.status(400).json({
                error: "iChancy blocked the request and returned HTML",
                preview: textData.substring(0, 150)
            });
        }

    } catch (err) {
        console.error("Proxy Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// تشغيل السيرفر على البورت المطلوب بـ Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
