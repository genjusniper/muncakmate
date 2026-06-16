import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'muncakmate.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        avatar TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        duration INTEGER,
        distance REAL,
        topSpeed REAL,
        path TEXT,
        date TEXT,
        driver TEXT,
        vehicle TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS kudos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY(activity_id) REFERENCES activities(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(activity_id, user_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER,
        user_id INTEGER,
        text TEXT,
        date TEXT,
        FOREIGN KEY(activity_id) REFERENCES activities(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
  }
});

export default db;
