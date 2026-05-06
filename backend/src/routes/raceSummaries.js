import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateRaceSummary, fetchRaceData } from '../groqClient.js';

// Normalise Ergast race data into the same shape as race_results rows
function ergastToResult(raceData) {
  return {
    p1:               raceData.results[0]?.code ?? null,
    p2:               raceData.results[1]?.code ?? null,
    p3:               raceData.results[2]?.code ?? null,
    fastest_lap:      raceData.fastestLapCode ?? null,
    safety_car_count: raceData.safetyCars ?? 0,
  };
}

const router = Router();

// GET /api/race-summary/:year/:round
router.get('/:year/:round', async (req, res, next) => {
  try {
    const year  = Number(req.params.year);
    const round = Number(req.params.round);
    if (!year || !round) return res.status(400).json({ error: 'Invalid year or round' });

    const raceId = `${year}_${round}`;

    // Return cached summary if available
    const { rows: [cached] } = await pool.query(
      'SELECT * FROM race_summaries WHERE race_id = $1',
      [raceId]
    );
    if (cached) {
      return res.json(formatSummaryRow(cached));
    }

    // Fetch race data from Ergast (returns null if race hasn't finished)
    const raceData = await fetchRaceData(year, round);
    if (!raceData) {
      return res.status(404).json({ status: 'race_not_finished' });
    }

    // Generate summary via Groq
    const { summary, tokensUsed, latencyMs } = await generateRaceSummary(raceData);

    // Persist
    const { rows: [saved] } = await pool.query(
      `INSERT INTO race_summaries
         (race_id, race_year, race_round, headline, story, key_moments,
          championship_impact, driver_of_the_day, groq_tokens_used, groq_latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (race_id) DO UPDATE SET
         headline = EXCLUDED.headline,
         story = EXCLUDED.story,
         key_moments = EXCLUDED.key_moments,
         championship_impact = EXCLUDED.championship_impact,
         driver_of_the_day = EXCLUDED.driver_of_the_day,
         generated_at = NOW(),
         groq_tokens_used = EXCLUDED.groq_tokens_used,
         groq_latency_ms = EXCLUDED.groq_latency_ms
       RETURNING *`,
      [
        raceId, year, round,
        summary.headline,
        summary.story,
        JSON.stringify(summary.keyMoments),
        summary.championshipImpact,
        JSON.stringify(summary.driverOfTheDay),
        tokensUsed,
        latencyMs,
      ]
    );

    return res.json(formatSummaryRow(saved));
  } catch (err) {
    next(err);
  }
});

// POST /api/race-summary/:year/:round/regenerate  (admin — no user auth, key check)
router.post('/:year/:round/regenerate', async (req, res, next) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const year  = Number(req.params.year);
    const round = Number(req.params.round);
    const raceId = `${year}_${round}`;

    await pool.query('DELETE FROM race_summaries WHERE race_id = $1', [raceId]);

    const raceData = await fetchRaceData(year, round);
    if (!raceData) return res.status(404).json({ status: 'race_not_finished' });

    const { summary, tokensUsed, latencyMs } = await generateRaceSummary(raceData);

    const { rows: [saved] } = await pool.query(
      `INSERT INTO race_summaries
         (race_id, race_year, race_round, headline, story, key_moments,
          championship_impact, driver_of_the_day, groq_tokens_used, groq_latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        raceId, year, round,
        summary.headline, summary.story,
        JSON.stringify(summary.keyMoments),
        summary.championshipImpact,
        JSON.stringify(summary.driverOfTheDay),
        tokensUsed, latencyMs,
      ]
    );

    return res.json(formatSummaryRow(saved));
  } catch (err) {
    next(err);
  }
});

// GET /api/race-summary/:year/:round/personal
router.get('/:year/:round/personal', requireAuth, async (req, res, next) => {
  try {
    const year   = Number(req.params.year);
    const round  = Number(req.params.round);
    const userId = req.user.id;

    const [{ rows: [pred] }, { rows: [dbResult] }] = await Promise.all([
      pool.query(
        'SELECT * FROM predictions WHERE user_id = $1 AND race_year = $2 AND race_round = $3',
        [userId, year, round]
      ),
      pool.query(
        'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
        [year, round]
      ),
    ]);

    if (!pred) return res.json({ notPredicted: true });

    // Fall back to live Ergast data if autoScore hasn't stored results yet
    let result = dbResult;
    if (!result) {
      const raceData = await fetchRaceData(year, round);
      if (!raceData) return res.status(404).json({ error: 'Race results not available yet' });
      result = ergastToResult(raceData);
    }

    const breakdown = buildBreakdown(pred, result);
    const totalPoints = breakdown.reduce((sum, b) => sum + b.points, 0);

    // Rank after: count users with higher score
    const { rows: [rankAfterRow] } = await pool.query(
      'SELECT COUNT(id)::int + 1 AS rank FROM users WHERE score > (SELECT score FROM users WHERE id = $1)',
      [userId]
    );

    // Rank before: subtract this race's points from everyone, then re-rank
    const { rows: [rankBeforeRow] } = await pool.query(
      `WITH user_pts AS (
         SELECT user_id, points_earned
         FROM predictions
         WHERE race_year = $1 AND race_round = $2 AND is_locked = TRUE
       ),
       scores_before AS (
         SELECT u.id, u.score - COALESCE(up.points_earned, 0) AS sb
         FROM users u
         LEFT JOIN user_pts up ON up.user_id = u.id
       ),
       my_score_before AS (
         SELECT sb FROM scores_before WHERE id = $3
       )
       SELECT COUNT(*)::int + 1 AS rank
       FROM scores_before, my_score_before
       WHERE scores_before.sb > my_score_before.sb`,
      [year, round, userId]
    );

    const rankAfter  = rankAfterRow?.rank  ?? null;
    const rankBefore = rankBeforeRow?.rank ?? null;

    res.json({
      totalPoints,
      breakdown,
      rankBefore,
      rankAfter,
      rankDelta: rankBefore != null && rankAfter != null ? rankBefore - rankAfter : null,
    });
  } catch (err) {
    next(err);
  }
});

function buildBreakdown(pred, result) {
  const rows = [];

  const podiumPositions = [
    { type: 'podium_p1', label: 'P1', predKey: 'p1', resultKey: 'p1', points: 15 },
    { type: 'podium_p2', label: 'P2', predKey: 'p2', resultKey: 'p2', points: 10 },
    { type: 'podium_p3', label: 'P3', predKey: 'p3', resultKey: 'p3', points:  8 },
  ];

  for (const { type, predKey, resultKey, points } of podiumPositions) {
    const hit = pred[predKey] === result[resultKey];
    rows.push({ type, predicted: pred[predKey], actual: result[resultKey], points: hit ? points : 0, hit });
  }

  if (pred.fastest_lap != null) {
    const hit = pred.fastest_lap === result.fastest_lap;
    rows.push({ type: 'fastest_lap', predicted: pred.fastest_lap, actual: result.fastest_lap, points: hit ? 5 : 0, hit });
  }

  const scDiff = Math.abs((pred.safety_car_count ?? 0) - (result.safety_car_count ?? 0));
  const scPts  = scDiff === 0 ? 5 : scDiff === 1 ? 2 : 0;
  const scHit  = scDiff === 0 ? true : scDiff === 1 ? 'close' : false;
  rows.push({ type: 'safety_cars', predicted: pred.safety_car_count ?? 0, actual: result.safety_car_count ?? 0, points: scPts, hit: scHit });

  return rows;
}

function formatSummaryRow(row) {
  return {
    raceId:             row.race_id,
    raceYear:           row.race_year,
    raceRound:          row.race_round,
    headline:           row.headline,
    story:              row.story,
    keyMoments:         row.key_moments,
    championshipImpact: row.championship_impact,
    driverOfTheDay:     row.driver_of_the_day,
    generatedAt:        row.generated_at,
  };
}

export default router;
