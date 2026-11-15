const SECRET_KEY = process.env.TOSS_SECRET_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: '허용되지 않은 메서드입니다.' });
    return;
  }

  if (!SECRET_KEY) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.' });
    return;
  }

  const { paymentKey, orderId, amount } = req.body || {};
  if (!paymentKey || !orderId || !amount) {
    res.status(400).json({ code: 'BAD_REQUEST', message: '필수 값이 없습니다.' });
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${SECRET_KEY}:`).toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  res.status(tossRes.status).json(await tossRes.json());
}
