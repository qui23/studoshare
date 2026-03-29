import path from 'path';
import fs from 'fs';

// Lazy-load better-sqlite3 to avoid issues in edge runtime
let _db: import('better-sqlite3').Database | null = null;

function getDb(): import('better-sqlite3').Database {
  if (_db) return _db;

  // Dynamically require to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');

  const dbDir = path.join(process.cwd(), 'local-data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'studoshare.db');
  _db = new Database(dbPath) as import('better-sqlite3').Database;

  // Enable WAL mode for better performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Initialize schema
  initSchema(_db);

  return _db;
}

function initSchema(db: import('better-sqlite3').Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_documents (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title       TEXT NOT NULL,
      description TEXT,
      subject     TEXT,
      course      TEXT,
      university  TEXT,
      file_name   TEXT,
      file_size   INTEGER,
      file_type   TEXT,
      tags        TEXT,
      uploader_id TEXT,
      uploader_name TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS local_comments (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      document_id TEXT NOT NULL,
      user_id     TEXT,
      user_name   TEXT NOT NULL,
      content     TEXT NOT NULL,
      parent_id   TEXT,
      upvotes     INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES local_documents(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id)   REFERENCES local_comments(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS local_bookmarks (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      document_id TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      UNIQUE(document_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_local_documents_subject    ON local_documents(subject);
    CREATE INDEX IF NOT EXISTS idx_local_documents_university ON local_documents(university);
    CREATE INDEX IF NOT EXISTS idx_local_comments_document    ON local_comments(document_id);
    CREATE INDEX IF NOT EXISTS idx_local_bookmarks_user       ON local_bookmarks(user_id);
  `);
}

export default getDb;
