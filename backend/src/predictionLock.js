import pool from './db.js';

export function normalizeRaceKey(input = {}) {
  const raceId = input.raceId ?? input.race_id ?? input.id;
  const raceYear = input.race_year ?? input.raceYear ?? input.year;
  const raceRound = input.race_round ?? input.raceRound ?? input.round;

  return {
    raceId: raceId == null ? null : Number(raceId),
    raceYear: raceYear == null ? null : Number(raceYear),
    raceRound: raceRound == null ? null : Number(raceRound),
  };
}

export function isPredictionLocked(race, now = new Date()) {
  if (!race?.qualifying_start_at) return false;

  const qualifyingStartAt = new Date(race.qualifying_start_at);
  if (Number.isNaN(qualifyingStartAt.getTime())) return false;

  return now.getTime() >= qualifyingStartAt.getTime();
}

export function raceLockPayload(race) {
  const qualifyingStartAt = race?.qualifying_start_at
    ? new Date(race.qualifying_start_at).toISOString()
    : null;

  return {
    locked: isPredictionLocked(race),
    qualifyingStartAt,
    serverTime: new Date().toISOString(),
  };
}

export async function loadRaceForPrediction({ raceId, raceYear, raceRound }, db = pool) {
  if (raceId) {
    const { rows } = await db.query(
      `SELECT id, race_year, race_round, gp_name, qualifying_start_at
       FROM races
       WHERE id = $1`,
      [raceId]
    );
    return rows[0] ?? null;
  }

  if (!raceYear || !raceRound) return null;

  const { rows } = await db.query(
    `SELECT id, race_year, race_round, gp_name, qualifying_start_at
     FROM races
     WHERE race_year = $1 AND race_round = $2`,
    [raceYear, raceRound]
  );
  return rows[0] ?? null;
}

export function createRequirePredictionsOpen({ loadRace = loadRaceForPrediction, now = () => new Date() } = {}) {
  return async function requirePredictionsOpen(req, res, next) {
    try {
      const raceKey = normalizeRaceKey({ ...(req.params ?? {}), ...(req.body ?? {}) });

      if (!raceKey.raceId && (!raceKey.raceYear || !raceKey.raceRound)) {
        return res.status(400).json({ error: 'race_id or race_year and race_round are required' });
      }

      const race = await loadRace(raceKey);
      if (!race) return res.status(404).json({ error: 'Race not found' });

      if (isPredictionLocked(race, now())) {
        const qualifyingStartAt = race.qualifying_start_at
          ? new Date(race.qualifying_start_at).toISOString()
          : null;

        return res.status(403).json({
          error: 'PREDICTIONS_LOCKED',
          message: 'Predictions are locked because qualifying has started for this race.',
          qualifyingStartAt,
        });
      }

      req.race = race;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const requirePredictionsOpen = createRequirePredictionsOpen();
