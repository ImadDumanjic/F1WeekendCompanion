import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  username: 50,
  password: { min: 8, max: 72 },
  email: 255,
};

function signToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '2h' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length > LIMITS.username) {
      return res.status(400).json({ error: `Username must be at most ${LIMITS.username} characters` });
    }
    if (!EMAIL_RE.test(email) || email.length > LIMITS.email) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < LIMITS.password.min || password.length > LIMITS.password.max) {
      return res.status(400).json({ error: `Password must be between ${LIMITS.password.min} and ${LIMITS.password.max} characters` });
    }

    const byUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (byUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const byEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (byEmail.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (username, name, email, password_hash, last_login_at, password_changed_at)
       VALUES ($1, $1, $2, $3, NOW(), NOW())
       RETURNING id, username, email, remember_me, last_login_at, password_changed_at, favorite_driver, favorite_team`,
      [username, email, passwordHash]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user, false), user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (typeof password !== 'string' || password.length > LIMITS.password.max) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (typeof rememberMe !== 'boolean') {
      return res.status(400).json({ error: 'Remember me must be a boolean' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash, remember_me FROM users WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const updateResult = await pool.query(
      `UPDATE users
       SET remember_me = $1,
           last_login_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, remember_me, last_login_at, password_changed_at, favorite_driver, favorite_team`,
      [rememberMe, user.id]
    );

    const safeUser = updateResult.rows[0];
    res.json({ token: signToken(safeUser, rememberMe), user: safeUser });
  } catch (err) {
    next(err);
  }
});

export default router;
