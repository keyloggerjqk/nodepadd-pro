const { connectToDatabase } = require('./_db');

function generateId(length = 5) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = async (req, res) => {
    // Cho phép CORS nếu cần thiết
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Lấy nội dung từ POST body hoặc GET query
    let text = '';
    if (req.method === 'POST') {
        text = req.body && req.body.text;
    } else if (req.method === 'GET') {
        text = req.query.text;
    }

    if (!text) {
        return res.status(400).json({ error: 'Thiếu tham số "text". Vui lòng truyền nội dung qua body (POST) hoặc query (GET)' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('notepad'); // Tên DB là notepad
        const collection = db.collection('notes');

        // Tạo ID 5 ký tự duy nhất
        let id;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            id = generateId(5);
            const existing = await collection.findOne({ _id: id });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ error: 'Không thể tạo ID duy nhất.' });
        }

        // Lưu vào MongoDB
        await collection.insertOne({
            _id: id,
            text: text,
            createdAt: new Date()
        });

        // Xác định host của ứng dụng hiện tại để build link gốc
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
        
        const originalUrl = `${protocol}://${host}/${id}`;
        
        // Gọi API của duongdz.space để rút gọn link
        let finalShortUrl = originalUrl;
        try {
            // Cần dùng fetch (Node 18+ mặc định hỗ trợ)
            const shortenRes = await fetch('https://duongdz.space/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalUrl })
            });
            const shortenData = await shortenRes.json();
            if (shortenData && shortenData.success && shortenData.shortUrl) {
                finalShortUrl = shortenData.shortUrl;
            }
        } catch (shortenErr) {
            console.error('Lỗi khi gọi duongdz.space API:', shortenErr);
            // Nếu lỗi, vẫn fallback về originalUrl
        }
        
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalShortUrl)}`;

        res.status(200).json({
            success: true,
            short_url: finalShortUrl,
            qr_code_url: qrCodeUrl
        });

    } catch (err) {
        console.error('Lỗi hệ thống:', err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ: ' + err.message });
    }
};
