import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize tables
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type TEXT,
        duration INTEGER,
        distance REAL,
        "topSpeed" REAL,
        path TEXT,
        date TEXT,
        driver TEXT,
        vehicle TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS kudos (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        user_id INTEGER REFERENCES users(id),
        UNIQUE(activity_id, user_id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        user_id INTEGER REFERENCES users(id),
        text TEXT,
        date TEXT
      )
    `);
    console.log('Database tables initialized.');
  } finally {
    client.release();
  }
};

initDb().catch(console.error);

export default pool;
