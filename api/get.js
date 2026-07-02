const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // Cho phép CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Chỉ hỗ trợ GET' });
    }

    const id = req.query.id;
    if (!id) {
        return res.status(400).json({ error: 'Thiếu tham số "id"' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('notepad');
        const collection = db.collection('notes');

        const note = await collection.findOne({ _id: id });

        if (!note) {
            return res.status(404).json({ error: 'Không tìm thấy nội dung' });
        }

        res.status(200).json({
            success: true,
            text: note.text
        });

    } catch (err) {
        console.error('Lỗi hệ thống:', err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
};
