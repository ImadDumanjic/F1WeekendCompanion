import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../src/middleware/auth.js';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

const makeReq = (authHeader) => ({ headers: { authorization: authHeader } });
const makeRes = () => {
  const r = {};
  r.status = (code) => { r._status = code; return r; };
  r.json   = (body) => { r._body  = body; return r; };
  return r;
};

describe('requireAuth', () => {
  it('returns 401 Unauthorized when Authorization header is absent', () => {
    const res = makeRes();
    requireAuth(makeReq(undefined), res, () => {});
    assert.equal(res._status,    401);
    assert.equal(res._body.error, 'Unauthorized');
  });

  it('returns 401 Unauthorized when header does not start with Bearer', () => {
    const res = makeRes();
    requireAuth(makeReq('Basic somebase64value'), res, () => {});
    assert.equal(res._status,    401);
    assert.equal(res._body.error, 'Unauthorized');
  });

  it('returns 401 Invalid token for a malformed JWT', () => {
    const res = makeRes();
    requireAuth(makeReq('Bearer this.is.invalid'), res, () => {});
    assert.equal(res._status,    401);
    assert.equal(res._body.error, 'Invalid token');
  });

  it('returns 401 Invalid token for a JWT signed with the wrong secret', () => {
    const token = jwt.sign({ id: 1 }, 'wrong-secret', { expiresIn: '1h' });
    const res   = makeRes();
    requireAuth(makeReq(`Bearer ${token}`), res, () => {});
    assert.equal(res._status,    401);
    assert.equal(res._body.error, 'Invalid token');
  });

  it('calls next() and attaches decoded payload to req.user for a valid token', () => {
    const payload = { id: 42, username: 'testuser', email: 'test@example.com' };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req     = makeReq(`Bearer ${token}`);
    let nextCalled = false;
    requireAuth(req, makeRes(), () => { nextCalled = true; });
    assert.equal(nextCalled,         true);
    assert.equal(req.user.id,        payload.id);
    assert.equal(req.user.username,  payload.username);
    assert.equal(req.user.email,     payload.email);
  });
});
