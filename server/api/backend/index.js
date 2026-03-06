import axios from 'axios';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import openaiRoutes from './routes/openai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/ai', openaiRoutes);

let db; 

app.get('/', (req, res) => {
  res.send('서버 작동 중!');
});

app.get('/api/cafe24/products', async (req, res) => {
  try {
    const mallId = process.env.CAFE24_MALL_ID;
    const token = process.env.CAFE24_ACCESS_TOKEN;

    if (!mallId || !token) {
      return res.status(500).json({ message: 'CAFE24 env missing' });
    }

    const { data } = await axios.get(
      `https://${mallId}.cafe24api.com/api/v2/admin/products`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          limit: 20,
          offset: 0,
        },
      }
    );

    res.json(data);
  } catch (err) {
    console.error('❌ Cafe24 API 오류:', err.response?.data || err.message);
    res.status(500).json({ message: 'Cafe24 products fetch failed' });
  }
});

async function startServer() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ DB 연결 성공');

    app.listen(PORT, () => {
      console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중`);
    });
  } catch (err) {
    console.error('❌ DB 연결 실패:', err);
    process.exit(1);
  }
}

startServer();
