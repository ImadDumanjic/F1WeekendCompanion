import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/results', async (req, res, next) => {
  try {
    const year  = Number(req.query.year);
    const round = Number(req.query.round);
    if (!year || !round) return res.status(400).json({ error: 'year and round are required' });

    const { rows } = await pool.query(
      'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
      [year, round]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    next(err);
  }
});

router.post('/results', async (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count } = req.body ?? {};

    if (!race_year || !race_round || !p1 || !p2 || !p3) {
      return res.status(400).json({ error: 'race_year, race_round, p1, p2, p3 are required' });
    }

    const { rows: [existing] } = await pool.query(
      'SELECT id, scored_at FROM race_results WHERE race_year = $1 AND race_round = $2',
      [race_year, race_round]
    );
    if (existing?.scored_at) {
      return res.status(409).json({ error: 'Race already scored. Delete the result first to re-score.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [result] } = await client.query(
        `INSERT INTO race_results (race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (race_year, race_round) DO UPDATE SET
           p1 = EXCLUDED.p1, p2 = EXCLUDED.p2, p3 = EXCLUDED.p3,
           fastest_lap = EXCLUDED.fastest_lap, safety_car_count = EXCLUDED.safety_car_count
         RETURNING *`,
        [race_year, race_round, p1, p2, p3, fastest_lap ?? null, safety_car_count ?? 0]
      );

      const { rows: predictions } = await client.query(
        'SELECT * FROM predictions WHERE race_year = $1 AND race_round = $2 AND is_locked = TRUE',
        [race_year, race_round]
      );

      for (const pred of predictions) {
        let pts = 0;
        if (pred.p1 === result.p1) pts += 15;
        if (pred.p2 === result.p2) pts += 10;
        if (pred.p3 === result.p3) pts += 8;
        if (pred.fastest_lap && pred.fastest_lap === result.fastest_lap) pts += 5;
        const scDiff = Math.abs((pred.safety_car_count ?? 0) - (result.safety_car_count ?? 0));
        if (scDiff === 0)      pts += 5;
        else if (scDiff === 1) pts += 2;

        await client.query('UPDATE predictions SET points_earned = $1 WHERE id = $2', [pts, pred.id]);
        if (pts > 0) {
          await client.query('UPDATE users SET score = score + $1 WHERE id = $2', [pts, pred.user_id]);
        }
      }

      await client.query('UPDATE race_results SET scored_at = NOW() WHERE id = $1', [result.id]);

      await client.query('COMMIT');
      res.json({ scored: predictions.length, result });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
