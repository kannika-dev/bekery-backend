const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_bakery_key';

// 1. ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// 2. เชื่อมต่อ MySQL (TiDB Cloud) แบบ Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

db.getConnection((err, connection) => {
  if (err) console.error('❌ เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
  else {
    console.log('⚡ เชื่อมต่อ MySQL (bakery_db) สำเร็จแล้ว!');
    connection.release();
  }
});

// 🔒 Middleware ตรวจสอบ JWT Token (Optional Auth)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    req.user = user;
    next();
  });
};

// --- 🔑 API AUTHENTICATION ---

// 1. API สมัครสมาชิก (Register) - ตัด contact_info ออกตามตารางจริงแล้วค่ะ
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, phone, role } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'กรุณากรอก username, password และ email ให้ครบถ้วน' });
    }

    const validRoles = ['admin', 'seller', 'buyer'];
    const userRole = validRoles.includes(role) ? role : 'buyer';

    // เช็ก Username หรือ Email ซ้ำ
    const checkSql = 'SELECT id FROM users WHERE username = ? OR (email = ? AND role = ?)';
    db.query(checkSql, [username, email, userRole], async (err, results) => {
      if (err) {
        console.error('❌ Check Query Error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', error: err.message });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Username หรือ Email นี้ถูกใช้งานในระบบแล้ว' });
      }

      // เข้ารหัส Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ แก้ไข SQL ให้ตรงกับตารางจริงใน TiDB Cloud (ไม่มี contact_info)
      const insertSql = `INSERT INTO users (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)`;
      db.query(
        insertSql, 
        [username, hashedPassword, email, phone || null, userRole], 
        (err, result) => {
          if (err) {
            console.error('Register SQL Error:', err.message);
            return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
          }
          console.log('✅ สมัครสมาชิกสำเร็จ ID:', result.insertId);
          res.status(201).json({ message: 'สร้างบัญชีผู้ใช้สำเร็จเรียบร้อยแล้วค่ะ!', userId: result.insertId, role: userRole });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. API เข้าสู่ระบบ (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    let sql = `SELECT * FROM users WHERE username = ?`;
    const params = [username];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    db.query(sql, params, async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(401).json({ message: 'ไม่พบผู้ใช้ รหัสผ่านไม่ถูกต้อง หรือประเภทผู้ใช้ไม่ตรงกัน' });
      }

      const user = results[0];

      // เปรียบเทียบ รหัสผ่านด้วย Bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // ส่งกลับโครงสร้างรองรับทั้ง Token และ User Profile
      res.json({
        message: 'เข้าสู่ระบบสำเร็จ!',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        username: user.username,
        role: user.role
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. API ลบบัญชีผู้ใช้
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;

  if (parseInt(req.user.id) !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบบัญชีนี้' });
  }

  const deleteSql = 'DELETE FROM users WHERE id = ?';
  db.query(deleteSql, [userId], (err, result) => {
    if (err) {
      console.error('❌ Delete User Error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้', error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    console.log(`🗑️ ลบบัญชี ID: ${userId} เรียบร้อยแล้ว`);
    res.json({ message: 'ลบบัญชีผู้ใช้เรียบร้อยแล้วค่ะ' });
  });
});

// --- 🥐 API BAKERY ITEMS (CRUD) ---

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
    const { name, category, price, description, image_url, shopName } = req.body;
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

    const safeName = name || '';
    const safeCategory = category || 'General';
    const safePrice = parseFloat(price) || 0;
    const safeDescription = description || '';
    const safeShopName = shopName || null;

    const sql = 'INSERT INTO bakery_items (name, category, price, description, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)';
    
    db.query(sql, [safeName, safeCategory, safePrice, safeDescription, finalImageUrl], (err, result) => {
      if (err) {
        console.error('SQL Error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '✨ เพิ่มเมนูขนมสำเร็จ!', id: result.insertId, image_url: finalImageUrl });
    });
  } catch (error) {
    console.error('Server Catch Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// [UPDATE] แก้ไขข้อมูลขนม
app.put('/api/bakery/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image_url, is_available } = req.body;
  
  const sql = 'UPDATE bakery_items SET name=?, category=?, price=?, description=?, image_url=?, is_available=? WHERE id=?';
  db.query(sql, [name, category, price, description, image_url || '', is_available !== undefined ? is_available : 1, id], (err, result) => {
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