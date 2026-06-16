import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();
  const { userId, activityId } = req.body;
  try {
    await getPool().query('INSERT INTO kudos (user_id, activity_id) VALUES ($1, $2)', [userId, activityId]);
    res.json({ success: true, action: 'added' });
  } catch (err) {
    if (err.code === '23505') {
      await getPool().query('DELETE FROM kudos WHERE user_id = $1 AND activity_id = $2', [userId, activityId]);
      return res.json({ success: true, action: 'removed' });
    }
    res.status(500).json({ error: 'Gagal memberikan kudo' });
  }
}
