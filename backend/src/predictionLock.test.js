import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequirePredictionsOpen, isPredictionLocked } from './predictionLock.js';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function runMiddleware({ race, body, params, now }) {
  const req = { body: body ?? {}, params: params ?? {} };
  const res = mockRes();
  let nextCalled = false;
  let nextError = null;
  const middleware = createRequirePredictionsOpen({
    loadRace: async () => race,
    now: () => new Date(now),
  });

  await middleware(req, res, (err) => {
    nextCalled = true;
    nextError = err ?? null;
  });

  return { req, res, nextCalled, nextError };
}

test('submission is allowed before qualifying start', async () => {
  const race = { id: 1, qualifying_start_at: '2026-05-02T14:00:00.000Z' };
  const result = await runMiddleware({
    race,
    body: { race_year: 2026, race_round: 6 },
    now: '2026-05-02T13:59:59.000Z',
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError, null);
  assert.equal(result.req.race, race);
});

test('submission is rejected exactly at qualifying start', () => {
  const race = { id: 1, qualifying_start_at: '2026-05-02T14:00:00.000Z' };

  assert.equal(isPredictionLocked(race, new Date('2026-05-02T14:00:00.000Z')), true);
});

test('submission is rejected after qualifying start', async () => {
  const result = await runMiddleware({
    race: { id: 1, qualifying_start_at: '2026-05-02T14:00:00.000Z' },
    body: { race_year: 2026, race_round: 6 },
    now: '2026-05-02T14:00:01.000Z',
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.res.body.error, 'PREDICTIONS_LOCKED');
  assert.equal(result.res.body.qualifyingStartAt, '2026-05-02T14:00:00.000Z');
});

test('submission is rejected when race is not found', async () => {
  const result = await runMiddleware({
    race: null,
    body: { race_year: 2026, race_round: 6 },
    now: '2026-05-02T13:59:59.000Z',
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 404);
  assert.deepEqual(result.res.body, { error: 'Race not found' });
});

test('edits are rejected after qualifying start', async () => {
  const result = await runMiddleware({
    race: { id: 1, qualifying_start_at: '2026-05-02T14:00:00.000Z' },
    params: { raceId: 1 },
    body: { p1: 'VER', p2: 'NOR', p3: 'LEC' },
    now: '2026-05-02T14:10:00.000Z',
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.res.body.error, 'PREDICTIONS_LOCKED');
});
