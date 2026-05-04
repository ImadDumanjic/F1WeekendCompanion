import pool from './db.js';
import { fetchRaceResults } from './ergastResults.js';
import { fetchRaceFromScheduleApi } from './f1Schedule.js';
import { applyScoring } from './scoring.js';

const INTERVAL_MS       = Number(process.env.AUTO_SCORE_INTERVAL_MS) || 15 * 60 * 1000;
const RACE_END_BUFFER_MS = 3 * 60 * 60 * 1000;

async function tryScoreRace(raceYear, raceRound) {
  try {
    const { rows: [existing] } = await pool.query(
      'SELECT scored_at FROM race_results WHERE race_year = $1 AND race_round = $2',
      [raceYear, raceRound]
    );
    if (existing?.scored_at) return;

    const race = await fetchRaceFromScheduleApi({ raceYear, raceRound });
    if (race?.race_start_at) {
      const raceEnd = new Date(new Date(race.race_start_at).getTime() + RACE_END_BUFFER_MS);
      if (new Date() < raceEnd) return;
    }

    const results = await fetchRaceResults(raceYear, raceRound);
    if (!results) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [check] } = await client.query(
        'SELECT scored_at FROM race_results WHERE race_year = $1 AND race_round = $2',
        [raceYear, raceRound]
      );
      if (check?.scored_at) { await client.query('ROLLBACK'); return; }

      await client.query(
        `INSERT INTO race_results (race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count)
         VALUES ($1, $2, $3, $4, $5, $6, 0)
         ON CONFLICT (race_year, race_round) DO UPDATE SET
           p1 = EXCLUDED.p1, p2 = EXCLUDED.p2, p3 = EXCLUDED.p3,
           fastest_lap = EXCLUDED.fastest_lap`,
        [raceYear, raceRound, results.p1, results.p2, results.p3, results.fastest_lap]
      );

      const scored = await applyScoring(client, raceYear, raceRound);

      await client.query(
        'UPDATE race_results SET scored_at = NOW() WHERE race_year = $1 AND race_round = $2',
        [raceYear, raceRound]
      );

      await client.query('COMMIT');
      console.log(`[autoScore] Round ${raceRound}/${raceYear}: ${results.p1}/${results.p2}/${results.p3} FL:${results.fastest_lap} — ${scored} predictions scored`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[autoScore] Round ${raceRound}/${raceYear} transaction failed:`, err.message);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`[autoScore] Round ${raceRound}/${raceYear} error:`, err.message);
  }
}

async function checkAndScore() {
  try {
    const { rows: pending } = await pool.query(`
      SELECT DISTINCT p.race_year, p.race_round
      FROM predictions p
      WHERE p.is_locked = TRUE
        AND p.race_year <= EXTRACT(YEAR FROM NOW())::int
        AND NOT EXISTS (
          SELECT 1 FROM race_results r
          WHERE r.race_year = p.race_year
            AND r.race_round = p.race_round
            AND r.scored_at IS NOT NULL
        )
      ORDER BY p.race_year, p.race_round
    `);

    for (const { race_year, race_round } of pending) {
      await tryScoreRace(race_year, race_round);
    }
  } catch (err) {
    console.error('[autoScore] poll error:', err.message);
  }
}

export function startAutoScoring() {
  checkAndScore();
  setInterval(checkAndScore, INTERVAL_MS);
  console.log(`[autoScore] Started — polling every ${INTERVAL_MS / 1000}s`);
}
