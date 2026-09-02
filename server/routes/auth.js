import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';
import { signToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Customer Register
router.post('/register', (req, res) => {
  try {
    const { email, password, name, phone, postal_code, address, detail_address } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: '이메일, 비밀번호, 이름은 필수 입력 항목입니다.' });
    }

    // Check existing
    const existing = query.get('SELECT id FROM users WHERE email = ?', email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 등록된 이메일 계정입니다.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = query.run(`
      INSERT INTO users (email, password_hash, name, phone, postal_code, address, detail_address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')
    `, email.trim().toLowerCase(), password_hash, name.trim(), phone || '', postal_code || '', address || '', detail_address || '');

    const user = {
      id: Number(result.lastInsertRowid),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone || '',
      postal_code: postal_code || '',
      address: address || '',
      detail_address: detail_address || '',
      role: 'customer',
    };

    const token = signToken(user);
    res.status(201).json({ success: true, token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

// Customer Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const user = query.get('SELECT * FROM users WHERE email = ?', email.trim().toLowerCase());
    if (!user) {
      return res.status(400).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      postal_code: user.postal_code,
      address: user.address,
      detail_address: user.detail_address,
      role: user.role,
    };

    const token = signToken(safeUser);
    res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

// Dedicated Admin Login Handler
const handleAdminLogin = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '관리자 이메일과 비밀번호를 입력해주세요.' });
    }

    const user = query.get('SELECT * FROM users WHERE email = ?', email.trim().toLowerCase());
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ success: false, message: '관리자 권한이 없거나 계정 정보가 일치하지 않습니다.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(403).json({ success: false, message: '관리자 권한이 없거나 계정 정보가 일치하지 않습니다.' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    const token = signToken(safeUser);
    res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: '관리자 로그인 처리 중 오류가 발생했습니다.' });
  }
};

router.post('/admin-login', handleAdminLogin);
router.post('/admin/login', handleAdminLogin);

// Get Current User Profile
router.get('/me', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update Customer Profile & Korean Address
router.put('/profile', verifyToken, (req, res) => {
  try {
    const { name, phone, postal_code, address, detail_address } = req.body;

    query.run(`
      UPDATE users
      SET name = ?, phone = ?, postal_code = ?, address = ?, detail_address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, name || req.user.name, phone || '', postal_code || '', address || '', detail_address || '', req.user.id);

    const updatedUser = query.get('SELECT id, email, name, phone, postal_code, address, detail_address, role FROM users WHERE id = ?', req.user.id);
    res.json({ success: true, user: updatedUser, message: '회원 정보가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '회원 정보 수정 중 오류가 발생했습니다.' });
  }
});

export default router;
