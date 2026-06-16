import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  await initDb();
  const { username, password } = req.body;
  try {
    const result = await getPool().query(
      'SELECT id, username, avatar FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Username atau password salah.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
