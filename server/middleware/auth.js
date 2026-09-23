// Legacy JWT middleware (finding #2/#13). The canonical production identity
// is the cookie-based Google session in api/app.js. This module remains only
// for the legacy SQLite boundary guarded by productionBlock; new code must
// not issue or accept these tokens.
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

// Role hierarchy — lean cloth store: only super_admin + admin (editor/order_manager retired)
export const STAFF_ROLES = ['super_admin', 'admin'];

export function verifyRole(allowedRoles) {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (req.user && allowedRoles.includes(req.user.role)) {
        next();
      } else {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient privileges.' });
      }
    });
  };
}

// Staff-only account management (finding #9): only super_admin may
// create/update/delete staff accounts. Editors and order managers are
// explicitly excluded.
export function requireSuperAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Super-admin privileges required.' });
    }
  });
}

// Legacy compat — collapsed to 2 roles
export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    const adminRoles = ['super_admin', 'admin'];
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
