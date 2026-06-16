import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();

  if (req.method === 'POST') {
    const { userId, type, duration, distance, topSpeed, path, date, driver, vehicle } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await getPool().query(
        `INSERT INTO activities (user_id, type, duration, distance, "topSpeed", path, date, driver, vehicle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [userId, type, duration, distance, topSpeed || 0, JSON.stringify(path || []), date, driver || '', vehicle || '']
      );
      res.json({ success: true, activityId: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal sinkronisasi' });
    }
  } else {
    res.status(405).end();
  }
}
