import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();

  if (req.method === 'GET') {
    const { activityId } = req.query;
    try {
      const result = await getPool().query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.activity_id = $1 ORDER BY c.id ASC`,
        [activityId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil komentar' });
    }
  } else if (req.method === 'POST') {
    const { userId, activityId, text } = req.body;
    if (!userId || !activityId || !text) return res.status(400).json({ error: 'Data tidak lengkap.' });
    try {
      const result = await getPool().query(
        'INSERT INTO comments (user_id, activity_id, text, date) VALUES ($1,$2,$3,$4) RETURNING id',
        [userId, activityId, text, new Date().toISOString()]
      );
      res.json({ success: true, commentId: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ error: 'Gagal memposting komentar' });
    }
  }
}
