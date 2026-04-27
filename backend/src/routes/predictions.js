import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const year  = Number(req.query.year);
    const round = Number(req.query.round);
    if (!year || !round) return res.status(400).json({ error: 'year and round are required' });

    const { rows } = await pool.query(
      'SELECT * FROM predictions WHERE user_id = $1 AND race_year = $2 AND race_round = $3',
      [req.user.id, year, round]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count } = req.body ?? {};

    if (!race_year || !race_round)    return res.status(400).json({ error: 'race_year and race_round are required' });
    if (!p1 || !p2 || !p3)           return res.status(400).json({ error: 'All three podium positions are required' });
    if (safety_car_count == null)     return res.status(400).json({ error: 'safety_car_count is required' });
    if (new Set([p1, p2, p3]).size !== 3) return res.status(400).json({ error: 'Podium drivers must be unique' });

    const { rows: existing } = await pool.query(
      'SELECT is_locked FROM predictions WHERE user_id = $1 AND race_year = $2 AND race_round = $3',
      [req.user.id, race_year, race_round]
    );
    if (existing[0]?.is_locked) return res.status(409).json({ error: 'Prediction is locked and cannot be changed' });

    const { rows } = await pool.query(
      `INSERT INTO predictions (user_id, race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, race_year, race_round) DO UPDATE SET
         p1 = EXCLUDED.p1,
         p2 = EXCLUDED.p2,
         p3 = EXCLUDED.p3,
         fastest_lap = EXCLUDED.fastest_lap,
         safety_car_count = EXCLUDED.safety_car_count,
         submitted_at = NOW()
       RETURNING *`,
      [req.user.id, race_year, race_round, p1, p2, p3, fastest_lap ?? null, safety_car_count]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/lock', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'UPDATE predictions SET is_locked = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [Number(req.params.id), req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Prediction not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
