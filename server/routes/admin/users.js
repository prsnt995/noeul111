import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../db/database.js';
import { verifyAdmin, requireSuperAdmin } from '../../middleware/auth.js';

const router = express.Router();
// Listing staff remains available to all admin-area roles (read-only).
router.get('/users/staff', verifyAdmin, (req, res) => {
  try {
    const staff = query.all(`
      SELECT id, email, name, phone, role, created_at, updated_at
      FROM users
      WHERE role IN ('super_admin', 'admin', 'editor', 'order_manager')
      ORDER BY id ASC
    `);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ success: false, message: '스태프 목록 조회 실패' });
  }
});

// Add staff member (finding #9): super_admin only. Editors and
// order managers must never create/promote staff accounts.
router.post('/users/staff', requireSuperAdmin, (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: '이메일, 비밀번호, 이름은 필수입니다.' });
    }

    if (String(password).length < 12) {
      return res.status(400).json({ success: false, message: '비밀번호는 최소 12자 이상이어야 합니다.' });
    }

    const existing = query.get('SELECT id FROM users WHERE email = ?', email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 등록된 이메일 계정입니다.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const validRole = ['super_admin', 'admin', 'editor', 'order_manager'].includes(role) ? role : 'editor';

    const result = query.run(`
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `, email.toLowerCase().trim(), password_hash, name.trim(), phone || '', validRole);

    const created = query.get('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '새 관리자 계정이 생성되었습니다.', data: created });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: '관리자 계정 생성 실패' });
  }
});

// Update staff role (finding #9): super_admin only. Protects the last
// super-admin and blocks self-demotion.
router.put('/users/staff/:id', requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, new_password } = req.body;

    const target = query.get('SELECT id, role FROM users WHERE id = ?', Number(id));
    if (!target) {
      return res.status(404).json({ success: false, message: '대상 계정을 찾을 수 없습니다.' });
    }

    const validRole = ['super_admin', 'admin', 'editor', 'order_manager'].includes(role) ? role : 'editor';

    // Protect the final super-admin from demotion/removal.
    if (target.role === 'super_admin' && validRole !== 'super_admin') {
      const remaining = query.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND id != ?",
        Number(id)
      );
      if (Number(remaining?.count || 0) === 0) {
        return res.status(400).json({ success: false, message: '마지막 최고 관리자는 강등할 수 없습니다.' });
      }
      if (Number(id) === req.user.id) {
        return res.status(400).json({ success: false, message: '본인 계정은 강등할 수 없습니다.' });
      }
    }

    if (new_password) {
      if (String(new_password).length < 12) {
        return res.status(400).json({ success: false, message: '비밀번호는 최소 12자 이상이어야 합니다.' });
      }
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(new_password, salt);
      query.run(`
        UPDATE users SET name = ?, phone = ?, role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, name, phone || '', validRole, password_hash, Number(id));
    } else {
      query.run(`
        UPDATE users SET name = ?, phone = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, name, phone || '', validRole, Number(id));
    }

    const updated = query.get('SELECT id, email, name, phone, role, updated_at FROM users WHERE id = ?', Number(id));
    res.json({ success: true, message: '관리자 정보가 수정되었습니다.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '관리자 정보 수정 실패' });
  }
});

// Delete staff member (finding #9): super_admin only, never self, never
// the last super-admin.
router.delete('/users/staff/:id', requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ success: false, message: '현재 로그인 중인 본인 계정은 삭제할 수 없습니다.' });
    }

    const target = query.get('SELECT id, role FROM users WHERE id = ?', Number(id));
    if (!target) {
      return res.status(404).json({ success: false, message: '대상 계정을 찾을 수 없습니다.' });
    }
    if (target.role === 'super_admin') {
      const remaining = query.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND id != ?",
        Number(id)
      );
      if (Number(remaining?.count || 0) === 0) {
        return res.status(400).json({ success: false, message: '마지막 최고 관리자는 삭제할 수 없습니다.' });
      }
    }

    query.run('DELETE FROM users WHERE id = ?', Number(id));
    res.json({ success: true, message: '관리자 계정이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
});

export default router;
