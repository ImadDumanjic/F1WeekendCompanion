import { Router } from 'express';
import pool from '../db.js';
import { loadRaceForPrediction, normalizeRaceKey, raceLockPayload } from '../predictionLock.js';
import { applyScoring } from '../scoring.js';
import { fetchRaceData } from '../groqClient.js';
import { fetchRaceResults } from '../ergastResults.js';

const router = Router();

router.get('/prediction-status', async (req, res, next) => {
  try {
    const raceKey = normalizeRaceKey(req.query);
    if (!raceKey.raceYear || !raceKey.raceRound) {
      return res.status(400).json({ error: 'year and round are required' });
    }

    const race = await loadRaceForPrediction(raceKey);
    if (!race) return res.status(404).json({ error: 'Race not found' });

    res.json(raceLockPayload(race));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/prediction-status', async (req, res, next) => {
  try {
    const raceId = Number(req.params.id);
    if (!raceId) return res.status(400).json({ error: 'Valid race id is required' });

    const race = await loadRaceForPrediction({ raceId });
    if (!race) return res.status(404).json({ error: 'Race not found' });

    res.json(raceLockPayload(race));
  } catch (err) {
    next(err);
  }
});

router.get('/results', async (req, res, next) => {
  try {
    const year  = Number(req.query.year);
    const round = Number(req.query.round);
    if (!year || !round) return res.status(400).json({ error: 'year and round are required' });

    const { rows } = await pool.query(
      'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
      [year, round]
    );
    if (rows[0]) return res.json(rows[0]);

    const raceData = await fetchRaceData(year, round);
    console.log(`[results] ${year}/${round} fetchRaceData:`, raceData ? `p1=${raceData.results[0]?.code} p2=${raceData.results[1]?.code} p3=${raceData.results[2]?.code}` : 'null');

    let p1            = raceData?.results[0]?.code ?? null;
    let p2            = raceData?.results[1]?.code ?? null;
    let p3            = raceData?.results[2]?.code ?? null;
    let fastest_lap   = raceData?.fastestLapCode ?? null;
    const safety_car_count = raceData?.safetyCars ?? 0;

    if (!p1 || !p2 || !p3) {
      const ergast = await fetchRaceResults(year, round);
      console.log(`[results] ${year}/${round} ergast fallback:`, ergast ? `p1=${ergast.p1} p2=${ergast.p2} p3=${ergast.p3}` : 'null');
      if (!ergast) return res.json(raceData ? { p1, p2, p3, fastest_lap, safety_car_count } : null);
      p1          = ergast.p1;
      p2          = ergast.p2;
      p3          = ergast.p3;
      fastest_lap = ergast.fastest_lap ?? fastest_lap;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: [saved] } = await client.query(
        `INSERT INTO race_results (race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (race_year, race_round) DO NOTHING
         RETURNING *`,
        [year, round, p1, p2, p3, fastest_lap, safety_car_count]
      );
      if (saved) {
        await applyScoring(client, year, round);
        await client.query('UPDATE race_results SET scored_at = NOW() WHERE id = $1', [saved.id]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const { rows: [final] } = await pool.query(
      'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
      [year, round]
    );
    res.json(final ?? { p1, p2, p3, fastest_lap, safety_car_count });
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

      const scored = await applyScoring(client, race_year, race_round);

      await client.query('UPDATE race_results SET scored_at = NOW() WHERE id = $1', [result.id]);

      await client.query('COMMIT');
      const { rows: [finalResult] } = await pool.query('SELECT * FROM race_results WHERE id = $1', [result.id]);
      res.json({ scored, result: finalResult });
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

router.post('/rescore', async (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { race_year, race_round, safety_car_count } = req.body ?? {};
    if (!race_year || !race_round) {
      return res.status(400).json({ error: 'race_year and race_round are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (safety_car_count != null) {
        await client.query(
          'UPDATE race_results SET safety_car_count = $1 WHERE race_year = $2 AND race_round = $3',
          [safety_car_count, race_year, race_round]
        );
      }

      const { rows: [result] } = await client.query(
        'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
        [race_year, race_round]
      );
      if (!result) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Race result not found' });
      }

      const { rows: predictions } = await client.query(
        'SELECT * FROM predictions WHERE race_year = $1 AND race_round = $2 AND is_locked = TRUE',
        [race_year, race_round]
      );

      const { calculatePoints } = await import('../scoring.js');
      let rescored = 0;
      for (const pred of predictions) {
        const oldPts = pred.points_earned ?? 0;
        const newPts = calculatePoints(pred, result);
        const delta  = newPts - oldPts;
        await client.query('UPDATE predictions SET points_earned = $1 WHERE id = $2', [newPts, pred.id]);
        if (delta !== 0) {
          await client.query('UPDATE users SET score = score + $1 WHERE id = $2', [delta, pred.user_id]);
        }
        rescored++;
      }

      await client.query('UPDATE race_results SET scored_at = NOW() WHERE id = $1', [result.id]);
      await client.query('COMMIT');

      res.json({ rescored, safety_car_count: result.safety_car_count });
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
