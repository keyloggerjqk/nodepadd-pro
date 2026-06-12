const LZString = require('lz-string');

module.exports = async (req, res) => {
    // Chỉ chấp nhận GET request cho API này theo yêu cầu
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Chỉ hỗ trợ phương thức GET' });
    }

    const text = req.query.text;
    if (!text) {
        return res.status(400).json({ error: 'Thiếu tham số "text". Vui lòng truyền nội dung qua query (VD: ?text=Xin_Chao)' });
    }

    try {
        // Nén dữ liệu bằng LZString
        const compressed = LZString.compressToEncodedURIComponent(text);
        
        // Xác định host của ứng dụng hiện tại để build link gốc
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
        const fullUrl = `${protocol}://${host}/?data=${compressed}`;

        // Kiểm tra độ dài URL (giới hạn tương đối khoảng 5000 ký tự)
        if (fullUrl.length > 5000) {
            return res.status(400).json({ error: 'Nội dung quá dài, URL tạo ra vượt giới hạn an toàn.' });
        }

        // Ưu tiên 1: Rút gọn qua spoo.me
        let shortUrl = fullUrl;
        
        try {
            const spooParams = new URLSearchParams({ url: fullUrl });
            const spooRes = await fetch('https://spoo.me/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: spooParams
            });
            
            if (spooRes.ok) {
                const spooData = await spooRes.json();
                if (spooData && spooData.short_url) {
                    shortUrl = spooData.short_url;
                }
            } else {
                // Dự phòng 2: Gọi trực tiếp TinyURL (phía server không lo CORS)
                const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
                if (tinyRes.ok) {
                    const tinyData = await tinyRes.text();
                    if (tinyData && tinyData.startsWith('http')) {
                        shortUrl = tinyData;
                    }
                }
            }
        } catch (apiErr) {
            console.error('API Rút gọn lỗi:', apiErr);
            // Vẫn giữ lại original_url làm shortUrl nếu tất cả api đều tèo
        }

        // Tạo QR Code
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;

        res.status(200).json({
            success: true,
            short_url: shortUrl,
            original_url: fullUrl,
            qr_code_url: qrCodeUrl
        });

    } catch (err) {
        console.error('Lỗi hệ thống:', err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
};
