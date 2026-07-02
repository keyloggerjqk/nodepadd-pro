const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Vui lòng thêm MONGODB_URI vào biến môi trường');
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
}

module.exports = { connectToDatabase };
