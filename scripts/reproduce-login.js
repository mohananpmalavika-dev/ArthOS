import handler from '../api/index.js';
import { PassThrough } from 'stream';

function makeReq(method, url, body) {
  const req = new PassThrough();
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json' };
  process.nextTick(() => {
    req.emit('data', Buffer.from(JSON.stringify(body)));
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
    if (data) process.stdout.write(data);
    res.emit('finish');
  };
  return res;
}

const req = makeReq('POST', '/api/auth/login', { email: 'test@example.com', password: 'password123' });
const res = makeRes();
res.on('finish', () => process.exit(0));
await handler(req, res);
