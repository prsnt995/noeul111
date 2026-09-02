import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { query } from '../db/database.js';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'customer',
      name: user.name,
    },
    CONFIG.JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRES_IN }
  );
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = query.get('SELECT id, email, name, phone, postal_code, address, detail_address, role FROM users WHERE id = ?', decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export const verifyAuth = verifyToken;

export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    const adminRoles = ['super_admin', 'admin', 'editor', 'order_manager'];
    if (req.user && adminRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = query.get('SELECT id, email, name, phone, postal_code, address, detail_address, role FROM users WHERE id = ?', decoded.id);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}
