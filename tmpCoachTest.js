const http = require('http');
const data = JSON.stringify({ userId: 'mgdhanyamohan@gmail.com', primaryConcern: 'Spending Control' });
const opts = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/coach/sessions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(opts, res => {
  console.log('status', res.statusCode);
  console.log('headers', JSON.stringify(res.headers));
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('body', body);
  });
});
req.on('error', err => console.error('request error', err));
req.write(data);
req.end();
