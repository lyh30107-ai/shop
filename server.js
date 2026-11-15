const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const SECRET_KEY = process.env.TOSS_SECRET_KEY;
if (!SECRET_KEY) {
  console.error('TOSS_SECRET_KEY 환경변수를 설정하세요.');
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, 'shop');
const PORT = Number(process.env.PORT) || 3000;
const AUTH_HEADER = 'Basic ' + Buffer.from(`${SECRET_KEY}:`).toString('base64');
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', ...headers });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 10_000) {
        req.destroy();
        reject(new Error('요청 본문이 너무 큽니다.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function confirmPayment(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { code: 'BAD_REQUEST', message: '잘못된 요청입니다.' });
    return;
  }

  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || !amount) {
    sendJson(res, 400, { code: 'BAD_REQUEST', message: '필수 값이 없습니다.' });
    return;
  }

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  sendJson(res, tossRes.status, await tossRes.json());
}

function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : decodeURIComponent(pathname));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    send(res, 403, 'Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not Found');
      return;
    }
    send(res, 200, data, { 'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream' });
  });
}

http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && pathname === '/api/payments/confirm') {
      await confirmPayment(req, res);
    } else if (req.method === 'GET') {
      serveStatic(req, res);
    } else {
      send(res, 405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
