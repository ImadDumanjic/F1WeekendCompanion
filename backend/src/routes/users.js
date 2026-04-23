import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  username: 50,
  name: 100,
  email: 255,
  password: { min: 8, max: 72 },
};

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, name, email, score FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { username, name, email, newPassword } = req.body ?? {};
    const userId = req.user.id;

    if (username !== undefined && username.length > LIMITS.username) {
      return res.status(400).json({ error: `Username must be at most ${LIMITS.username} characters` });
    }
    if (name !== undefined && name.length > LIMITS.name) {
      return res.status(400).json({ error: `Name must be at most ${LIMITS.name} characters` });
    }
    if (email !== undefined) {
      if (!EMAIL_RE.test(email) || email.length > LIMITS.email) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    if (newPassword !== undefined && newPassword !== '') {
      if (newPassword.length < LIMITS.password.min || newPassword.length > LIMITS.password.max) {
        return res.status(400).json({ error: `Password must be between ${LIMITS.password.min} and ${LIMITS.password.max} characters` });
      }
    }

    if (username !== undefined) {
      const { rows } = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (rows.length > 0) return res.status(409).json({ error: 'Username is already taken' });
    }

    if (email !== undefined) {
      const { rows } = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (rows.length > 0) return res.status(409).json({ error: 'Email is already in use' });
    }

    const sets = [];
    const values = [];
    let i = 1;

    if (username !== undefined) { sets.push(`username = $${i++}`);     values.push(username); }
    if (name !== undefined)     { sets.push(`name = $${i++}`);         values.push(name); }
    if (email !== undefined)    { sets.push(`email = $${i++}`);        values.push(email); }
    if (newPassword)            {
      sets.push(`password_hash = $${i++}`);
      values.push(await bcrypt.hash(newPassword, 12));
    }

    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(userId);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, username, name, email, score`,
      values
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
