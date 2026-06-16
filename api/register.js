import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  await initDb();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  try {
    const result = await getPool().query(
      'INSERT INTO users (username, password, avatar) VALUES ($1, $2, $3) RETURNING id, username, avatar',
      [username, password, defaultAvatar]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username sudah digunakan.' });
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
