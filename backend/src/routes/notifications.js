import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';
import { normalizeApiRace } from '../f1Schedule.js';

const router = Router();
const RACE_YEAR = 2026;
const SCHEDULE_URL = `https://f1api.dev/api/${RACE_YEAR}`;

const WINDOWS = [
  { id: '48h', hoursStart: 48, hoursEnd: 24, urgency: 'low',    label: 'Predictions close in 2 days'         },
  { id: '24h', hoursStart: 24, hoursEnd: 3,  urgency: 'medium', label: 'Predictions close in less than a day' },
  { id: '3h',  hoursStart: 3,  hoursEnd: 0,  urgency: 'high',   label: 'Last chance — closes in under 3 hours' },
];

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const now = new Date();

    let apiRaces = [];
    try {
      const r = await fetch(SCHEDULE_URL);
      if (r.ok) {
        const data = await r.json();
        apiRaces = data.races ?? [];
      }
    } catch {}

    let nextRace = null;
    let qualifyingAt = null;
    let raceName = null;
    let raceCountry = null;

    for (const apiRace of apiRaces) {
      const normalized = normalizeApiRace(apiRace, RACE_YEAR, apiRace.round);
      if (!normalized?.qualifying_start_at) continue;
      const qt = new Date(normalized.qualifying_start_at);
      if (qt > now) {
        nextRace = normalized;
        qualifyingAt = qt;
        raceName = apiRace.raceName ?? apiRace.name ?? normalized.gp_name ?? null;
        raceCountry = apiRace.circuit?.country ?? null;
        break;
      }
    }

    if (!nextRace || !qualifyingAt) return res.json({ notification: null });

    const { rows } = await pool.query(
      'SELECT is_locked FROM predictions WHERE user_id = $1 AND race_year = $2 AND race_round = $3',
      [req.user.id, nextRace.race_year, nextRace.race_round]
    );
    const hasLockedPrediction = rows.length > 0 && rows[0].is_locked;

    if (hasLockedPrediction) return res.json({ notification: null });

    const hoursToQualifying = (qualifyingAt.getTime() - now.getTime()) / 3_600_000;

    const activeWindow = WINDOWS.find(
      (w) => hoursToQualifying <= w.hoursStart && hoursToQualifying > w.hoursEnd
    ) ?? null;

    if (!activeWindow) return res.json({ notification: null });

    res.json({
      notification: {
        key:          `notif-${nextRace.race_year}-R${nextRace.race_round}-${activeWindow.id}`,
        windowId:     activeWindow.id,
        urgency:      activeWindow.urgency,
        label:        activeWindow.label,
        qualifyingAt: qualifyingAt.toISOString(),
        race: {
          year:    nextRace.race_year,
          round:   nextRace.race_round,
          name:    raceName,
          country: raceCountry,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
