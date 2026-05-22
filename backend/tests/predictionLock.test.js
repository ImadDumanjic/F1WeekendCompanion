import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRaceKey,
  isPredictionLocked,
  raceLockPayload,
  createRequirePredictionsOpen,
} from '../src/predictionLock.js';

const makeReq = (body = {}, params = {}) => ({ body, params });
const makeRes = () => {
  const r = {};
  r.status = (code) => { r._status = code; return r; };
  r.json   = (body) => { r._body  = body; return r; };
  return r;
};

describe('normalizeRaceKey', () => {
  it('accepts race_id, raceId, and id as aliases for raceId', () => {
    assert.equal(normalizeRaceKey({ race_id: '5'  }).raceId, 5);
    assert.equal(normalizeRaceKey({ raceId:   3   }).raceId, 3);
    assert.equal(normalizeRaceKey({ id:       '7' }).raceId, 7);
  });

  it('accepts race_year/raceYear/year and race_round/raceRound/round aliases', () => {
    const a = normalizeRaceKey({ race_year: 2026, race_round: 8 });
    assert.equal(a.raceYear, 2026);
    assert.equal(a.raceRound, 8);

    const b = normalizeRaceKey({ year: '2025', round: '3' });
    assert.equal(b.raceYear, 2025);
    assert.equal(b.raceRound, 3);
  });

  it('coerces string values to numbers', () => {
    const r = normalizeRaceKey({ raceId: '10', raceYear: '2026', raceRound: '5' });
    assert.equal(typeof r.raceId,    'number');
    assert.equal(typeof r.raceYear,  'number');
    assert.equal(typeof r.raceRound, 'number');
  });

  it('returns nulls for all fields when input is empty', () => {
    const r = normalizeRaceKey({});
    assert.equal(r.raceId,    null);
    assert.equal(r.raceYear,  null);
    assert.equal(r.raceRound, null);
  });
});

describe('isPredictionLocked', () => {
  it('returns false when qualifying_start_at is absent', () => {
    assert.equal(isPredictionLocked({}),          false);
    assert.equal(isPredictionLocked(null),        false);
    assert.equal(isPredictionLocked(undefined),   false);
  });

  it('returns false when now is before qualifying start', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    assert.equal(isPredictionLocked({ qualifying_start_at: future }, new Date()), false);
  });

  it('returns true when now is after qualifying start', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    assert.equal(isPredictionLocked({ qualifying_start_at: past }, new Date()), true);
  });

  it('returns false for an invalid date string', () => {
    assert.equal(isPredictionLocked({ qualifying_start_at: 'not-a-date' }), false);
  });
});

describe('raceLockPayload', () => {
  it('returns locked:true and an ISO qualifyingStartAt when qualifying has passed', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const payload = raceLockPayload({ qualifying_start_at: past });
    assert.equal(payload.locked, true);
    assert.equal(typeof payload.qualifyingStartAt, 'string');
    assert.equal(typeof payload.serverTime,        'string');
  });

  it('returns locked:false and null qualifyingStartAt when no qualifying time is set', () => {
    const payload = raceLockPayload({});
    assert.equal(payload.locked,             false);
    assert.equal(payload.qualifyingStartAt,  null);
  });
});

describe('createRequirePredictionsOpen middleware', () => {
  it('responds 400 when neither raceId nor year+round are provided', async () => {
    const mw  = createRequirePredictionsOpen({ loadRace: async () => null });
    const res = makeRes();
    await mw(makeReq(), res, () => {});
    assert.equal(res._status, 400);
  });

  it('responds 404 when the race is not found', async () => {
    const mw  = createRequirePredictionsOpen({ loadRace: async () => null });
    const res = makeRes();
    await mw(makeReq({ race_year: 2026, race_round: 1 }), res, () => {});
    assert.equal(res._status, 404);
  });

  it('responds 403 with PREDICTIONS_LOCKED when qualifying has started', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const mw   = createRequirePredictionsOpen({
      loadRace: async () => ({ qualifying_start_at: past }),
      now: () => new Date(),
    });
    const res = makeRes();
    await mw(makeReq({ race_year: 2026, race_round: 1 }), res, () => {});
    assert.equal(res._status,        403);
    assert.equal(res._body.error,    'PREDICTIONS_LOCKED');
  });

  it('calls next() and attaches race to req when predictions are open', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const race   = { qualifying_start_at: future };
    const req    = makeReq({ race_year: 2026, race_round: 1 });
    let nextCalled = false;
    const mw = createRequirePredictionsOpen({
      loadRace: async () => race,
      now: () => new Date(),
    });
    await mw(req, makeRes(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.race,   race);
  });
});
