import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = 'ksk:meses';

  if (req.method === 'POST') {
    const { mes, dias, data } = req.body;
    if (!mes) return res.status(400).json({ error: 'Falta mes' });
    const meses = (await redis.get(KEY)) || {};
    meses[mes] = { dias, data, guardado: new Date().toISOString() };
    await redis.set(KEY, meses);
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const { mes } = req.body;
    if (!mes) return res.status(400).json({ error: 'Falta mes' });
    const meses = (await redis.get(KEY)) || {};
    delete meses[mes];
    await redis.set(KEY, meses);
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    const meses = (await redis.get(KEY)) || {};
    return res.status(200).json(meses);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
