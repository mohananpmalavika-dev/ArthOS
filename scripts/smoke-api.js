import handler from '../api/index.js';
import { PassThrough } from 'stream';
import jwt from 'jsonwebtoken';

function makeReq(method, url, body, token) {
  const req = new PassThrough();
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json' };
  if (token) req.headers.authorization = `Bearer ${token}`;
  process.nextTick(() => {
    if (body) req.emit('data', Buffer.from(JSON.stringify(body)));
    req.emit('end');
  });
  return req;
}

function makeRes() {
  const res = new PassThrough();
  res.statusCode = 200;
  res.headers = {};
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (data) => {
    if (data) console.log('RESPONSE:', data.toString());
    res.emit('finish');
  };
  return res;
}

(async () => {
  const token = jwt.sign({ userId: 'smoke-user', email: 'smoke@example.com', name: 'smoke' }, process.env.JWT_SECRET || 'arthos-dev-secret-change-in-production', { expiresIn: '30d' });

  const tests = [
    { method: 'POST', path: '/api/user/export', body: { format: 'json' } },
    { method: 'DELETE', path: '/api/user/delete', body: { backup: false } },
    { method: 'PATCH', path: '/api/user/retention/privacy', body: { retention: 'immediate' } },
    { method: 'POST', path: '/api/calendar/export', body: { start: '2026-01-01', end: '2026-12-31' } },
    { method: 'POST', path: '/api/durableJobProcessor', body: { jobType: 'test' } },
  ];

  for (const t of tests) {
    console.log('\n---', t.method, t.path);
    const req = makeReq(t.method, t.path, t.body, token);
    const res = makeRes();
    await handler(req, res);
    // allow finish listeners
    await new Promise((r) => res.on('finish', r));
  }

  process.exit(0);
})();
