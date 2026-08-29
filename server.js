const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. ตั้งค่า Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// 2. เชื่อมต่อ MySQL (TiDB Cloud)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
      rejectUnauthorized: true
    }
});

db.connect((err) => {
    if (err) console.error('❌ เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
    else console.log('⚡ เชื่อมต่อ MySQL (bakery_db) สำเร็จแล้ว!');
});

// --- API ROUTES (CRUD) ---

// [READ] ดึงรายการเบเกอรี่ทั้งหมด
app.get('/api/bakery', (req, res) => {
    const sql = 'SELECT * FROM bakery_items ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// [CREATE] เพิ่มขนมใหม่
app.post('/api/bakery', upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, description, image_url } = req.body;
        let finalImageUrl = image_url || '';

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'bakery_items' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            finalImageUrl = result.secure_url;
        }

        const sql = 'INSERT INTO bakery_items (name, category, price, description, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)';
        db.query(sql, [name, category, price, description, finalImageUrl], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: '✨ เพิ่มเมนูขนมสำเร็จ!', id: result.insertId, image_url: finalImageUrl });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// [UPDATE] แก้ไขข้อมูลขนม (เพิ่ม image_url เรียบร้อยแล้ว ✨)
// [UPDATE] แก้ไขข้อมูลขนม
app.put('/api/bakery/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, price, description, image_url, is_available } = req.body;
    
    const sql = 'UPDATE bakery_items SET name=?, category=?, price=?, description=?, image_url=?, is_available=? WHERE id=?';
    db.query(sql, [name, category, price, description, image_url || '', is_available || 1, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✏️ แก้ไขข้อมูลสำเร็จ!' });
    });
});
// [DELETE] ลบเมนูขนม
app.delete('/api/bakery/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM bakery_items WHERE id=?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '🗑️ ลบเมนูสำเร็จ!' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ร้านเบเกอรี่วิ่งอยู่ที่ http://localhost:${PORT}`));