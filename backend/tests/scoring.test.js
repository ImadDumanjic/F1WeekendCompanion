import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePoints } from '../src/scoring.js';

const RESULT = { p1: 'NOR', p2: 'ANT', p3: 'RUS', fastest_lap: 'NOR', safety_car_count: 1 };

describe('calculatePoints', () => {
  it('awards maximum points for a perfect prediction', () => {
    const pred = { p1: 'NOR', p2: 'ANT', p3: 'RUS', fastest_lap: 'NOR', safety_car_count: 1 };
    assert.equal(calculatePoints(pred, RESULT), 43);
  });

  it('awards 0 points when nothing is correct and SC is off by 2+', () => {
    const pred = { p1: 'HAM', p2: 'VER', p3: 'LEC', fastest_lap: null, safety_car_count: 3 };
    assert.equal(calculatePoints(pred, RESULT), 0);
  });

  it('awards only the P1 bonus when only first place is correct', () => {
    const pred = { p1: 'NOR', p2: 'VER', p3: 'LEC', fastest_lap: null, safety_car_count: 3 };
    assert.equal(calculatePoints(pred, RESULT), 15);
  });

  it('awards only the P2 bonus when only second place is correct', () => {
    const pred = { p1: 'VER', p2: 'ANT', p3: 'LEC', fastest_lap: null, safety_car_count: 3 };
    assert.equal(calculatePoints(pred, RESULT), 10);
  });

  it('awards only the P3 bonus when only third place is correct', () => {
    const pred = { p1: 'VER', p2: 'LEC', p3: 'RUS', fastest_lap: null, safety_car_count: 3 };
    assert.equal(calculatePoints(pred, RESULT), 8);
  });

  it('awards 2 SC points when safety car count is off by exactly one', () => {
    const pred = { p1: 'HAM', p2: 'VER', p3: 'LEC', fastest_lap: null, safety_car_count: 2 };
    assert.equal(calculatePoints(pred, RESULT), 2);
  });

  it('awards 5 SC points when safety car count is exact', () => {
    const pred = { p1: 'HAM', p2: 'VER', p3: 'LEC', fastest_lap: null, safety_car_count: 1 };
    assert.equal(calculatePoints(pred, RESULT), 5);
  });

  it('does not award fastest lap bonus when fastest_lap is null', () => {
    const pred = { p1: 'NOR', p2: 'ANT', p3: 'RUS', fastest_lap: null, safety_car_count: 1 };
    assert.equal(calculatePoints(pred, RESULT), 38);
  });

  it('does not award fastest lap bonus when fastest_lap is the wrong driver', () => {
    const pred = { p1: 'NOR', p2: 'ANT', p3: 'RUS', fastest_lap: 'VER', safety_car_count: 1 };
    assert.equal(calculatePoints(pred, RESULT), 38);
  });

  it('treats missing safety_car_count as 0 via nullish coalescing', () => {
    const resultNoSC = { p1: 'NOR', p2: 'ANT', p3: 'RUS', fastest_lap: 'NOR', safety_car_count: 0 };
    const pred = { p1: 'VER', p2: 'LEC', p3: 'HAM', fastest_lap: null };
    assert.equal(calculatePoints(pred, resultNoSC), 5);
  });
});
