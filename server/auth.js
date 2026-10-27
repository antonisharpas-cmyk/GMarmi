import jwt from 'jsonwebtoken';
import { one } from './db.js';

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE = 'gm_admin';

// Role permissions
export const PERMS = {
  super_admin: ['content', 'media', 'enquiries', 'chat', 'users', 'settings'],
  content_manager: ['content', 'media', 'settings'],
  staff: ['enquiries', 'chat'],
};

export function signIn(res, user) {
  const token = jwt.sign({ uid: user.id, role: user.role }, SECRET(), { expiresIn: '12h' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 3600 * 1000,
  });
}
export function signOut(res) { res.clearCookie(COOKIE); }

export async function requireAuth(req, res, next) {
  try {
    const t = req.cookies?.[COOKIE];
    if (!t) return res.status(401).json({ error: 'Not signed in' });
    const p = jwt.verify(t, SECRET());
    const u = await one('SELECT id, email, name, role, active FROM users WHERE id=$1', [p.uid]);
    if (!u || !u.active) return res.status(401).json({ error: 'Not signed in' });
    req.user = u;
    next();
  } catch {
    res.status(401).json({ error: 'Not signed in' });
  }
}

export const can = (perm) => (req, res, next) =>
  (PERMS[req.user?.role] || []).includes(perm) ? next() : res.status(403).json({ error: 'Not allowed for your role' });
