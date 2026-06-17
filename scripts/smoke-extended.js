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
  const originalEnd = res.end.bind(res);
  res.end = (data) => {
    if (data) console.log('RESPONSE:', data.toString());
    originalEnd(data);
    res.emit('finish');
  };
  return res;
}

(async () => {
  const token = jwt.sign({ userId: 'smoke-user', email: 'smoke@example.com', name: 'smoke' }, process.env.JWT_SECRET || 'arthos-dev-secret-change-in-production', { expiresIn: '30d' });
  const tests = [
    { method: 'POST', path: '/api/banking/aa/consent-request', body: { userId: 'smoke-user' } },
    { method: 'GET', path: '/api/coach/health' },
    { method: 'GET', path: '/api/prediction/forecasts' },
    { method: 'GET', path: '/api/longitudinal/lifecycle?userId=smoke-user' },
  ];

  for (const t of tests) {
    console.log('\n=== START', t.method, t.path);
    const req = makeReq(t.method, t.path, t.body, token);
    const res = makeRes();
    try {
      await handler(req, res);
      console.log('HANDLER RETURNED for', t.path);
    } catch (err) {
      console.error('HANDLER ERROR', err);
    }
    await new Promise((resolve) => res.once('finish', resolve));
    console.log('=== DONE', t.method, t.path, 'status=', res.statusCode, 'headers=', JSON.stringify(res.headers));
  }

  console.log('ALL DONE');
})();
