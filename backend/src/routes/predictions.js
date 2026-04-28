import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePredictionsOpen } from '../predictionLock.js';

const router = Router();

function handlePredictionWriteError(err, res) {
  if (err?.message?.startsWith('Predictions are locked for race')) {
    return res.status(403).json({
      error: 'PREDICTIONS_LOCKED',
      message: 'Predictions are locked because qualifying has started for this race.',
    });
  }

  if (err?.message?.startsWith('Race not found for prediction')) {
    return res.status(404).json({ error: 'Race not found' });
  }

  return null;
}

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

router.post('/', requireAuth, requirePredictionsOpen, async (req, res, next) => {
  try {
    const { race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count } = req.body ?? {};

    if (!race_year || !race_round)    return res.status(400).json({ error: 'race_year and race_round are required' });
    if (!p1 || !p2 || !p3)           return res.status(400).json({ error: 'All three podium positions are required' });
    if (safety_car_count == null)     return res.status(400).json({ error: 'safety_car_count is required' });
    if (new Set([p1, p2, p3]).size !== 3) return res.status(400).json({ error: 'Podium drivers must be unique' });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: lockedRace } = await client.query(
        `SELECT id,
                qualifying_start_at,
                qualifying_start_at IS NOT NULL AND clock_timestamp() >= qualifying_start_at AS is_locked
         FROM races
         WHERE id = $1
         FOR UPDATE`,
        [req.race.id]
      );

      if (lockedRace.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Race not found' });
      }

      if (lockedRace[0].is_locked) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'PREDICTIONS_LOCKED',
          message: 'Predictions are locked because qualifying has started for this race.',
          qualifyingStartAt: new Date(lockedRace[0].qualifying_start_at).toISOString(),
        });
      }

      const { rows: existing } = await client.query(
        'SELECT is_locked FROM predictions WHERE user_id = $1 AND race_year = $2 AND race_round = $3',
        [req.user.id, race_year, race_round]
      );
      if (existing[0]?.is_locked) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Prediction is locked and cannot be changed' });
      }

      const { rows } = await client.query(
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

      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      const handled = handlePredictionWriteError(err, res);
      if (handled) return;
      throw err;
    } finally {
      client.release();
    }
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
