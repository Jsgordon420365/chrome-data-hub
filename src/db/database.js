const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class ChromeDataDB {
  constructor(dbPath = './data/chrome-data.db') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        visit_time REAL NOT NULL,
        last_visit_time REAL,
        visit_count INTEGER DEFAULT 1,
        typed_count INTEGER DEFAULT 0,
        transition TEXT,
        domain TEXT,
        is_local BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
      CREATE INDEX IF NOT EXISTS idx_history_domain ON history(domain);
      CREATE INDEX IF NOT EXISTS idx_history_visit_time ON history(visit_time DESC);

      CREATE VIRTUAL TABLE IF NOT EXISTS history_fts USING fts5(
        title, url, domain,
        content='history',
        content_rowid='rowid'
      );

      CREATE TRIGGER IF NOT EXISTS history_ai AFTER INSERT ON history BEGIN
        INSERT INTO history_fts(rowid, title, url, domain)
        VALUES (new.rowid, new.title, new.url, new.domain);
      END;

      CREATE TRIGGER IF NOT EXISTS history_ad AFTER DELETE ON history BEGIN
        INSERT INTO history_fts(history_fts, rowid, title, url, domain)
        VALUES('delete', old.rowid, old.title, old.url, old.domain);
      END;

      CREATE TRIGGER IF NOT EXISTS history_au AFTER UPDATE ON history BEGIN
        INSERT INTO history_fts(history_fts, rowid, title, url, domain)
        VALUES('delete', old.rowid, old.title, old.url, old.domain);
        INSERT INTO history_fts(rowid, title, url, domain)
        VALUES (new.rowid, new.title, new.url, new.domain);
      END;

      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        folder_path TEXT,
        add_date INTEGER,
        last_visit TEXT,
        visit_count INTEGER DEFAULT 0,
        is_bookmarklet BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(url, folder_path)
      );

      CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_path);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_add_date ON bookmarks(add_date DESC);

      CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
        title, url, folder_path,
        content='bookmarks',
        content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS bookmarks_ai AFTER INSERT ON bookmarks BEGIN
        INSERT INTO bookmarks_fts(rowid, title, url, folder_path)
        VALUES (new.id, new.title, new.url, new.folder_path);
      END;

      CREATE TRIGGER IF NOT EXISTS bookmarks_ad AFTER DELETE ON bookmarks BEGIN
        INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, url, folder_path)
        VALUES('delete', old.id, old.title, old.url, old.folder_path);
      END;

      CREATE TRIGGER IF NOT EXISTS bookmarks_au AFTER UPDATE ON bookmarks BEGIN
        INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, url, folder_path)
        VALUES('delete', old.id, old.title, old.url, old.folder_path);
        INSERT INTO bookmarks_fts(rowid, title, url, folder_path)
        VALUES (new.id, new.title, new.url, new.folder_path);
      END;
    `);
    
    console.log('✓ Database schema initialized');
  }

  insertHistory(entries) {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO history 
      (id, url, title, visit_time, last_visit_time, visit_count, typed_count, transition, domain, is_local)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entries) => {
      for (const entry of entries) {
        insert.run(
          entry.id,
          entry.url,
          entry.title,
          entry.visitTime,
          entry.lastVisitTime,
          entry.visitCount,
          entry.typedCount,
          entry.transition,
          entry.domain,
          entry.isLocal ? 1 : 0
        );
      }
    });

    insertMany(entries);
  }

  insertBookmarks(entries) {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO bookmarks 
      (url, title, folder_path, add_date, last_visit, visit_count, is_bookmarklet)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entries) => {
      for (const entry of entries) {
        insert.run(
          entry.url,
          entry.title,
          entry.folderPath,
          entry.addDate,
          entry.lastVisit,
          entry.visitCount,
          entry.isBookmarklet ? 1 : 0
        );
      }
    });

    insertMany(entries);
  }

  searchAll(query, limit = 50) {
    const historyResults = this.db.prepare(`
      SELECT h.*, 'history' as source
      FROM history_fts fts
      JOIN history h ON h.rowid = fts.rowid
      WHERE history_fts MATCH ?
      ORDER BY h.visit_time DESC
      LIMIT ?
    `).all(query, Math.floor(limit / 2));

    const bookmarkResults = this.db.prepare(`
      SELECT b.*, 'bookmark' as source
      FROM bookmarks_fts fts
      JOIN bookmarks b ON b.id = fts.rowid
      WHERE bookmarks_fts MATCH ?
      ORDER BY b.add_date DESC
      LIMIT ?
    `).all(query, Math.floor(limit / 2));

    return [...historyResults, ...bookmarkResults];
  }

  searchHistory(query, limit = 50) {
    return this.db.prepare(`
      SELECT h.*
      FROM history_fts fts
      JOIN history h ON h.rowid = fts.rowid
      WHERE history_fts MATCH ?
      ORDER BY h.visit_time DESC
      LIMIT ?
    `).all(query, limit);
  }

  searchBookmarks(query, limit = 50) {
    return this.db.prepare(`
      SELECT b.*
      FROM bookmarks_fts fts
      JOIN bookmarks b ON b.id = fts.rowid
      WHERE bookmarks_fts MATCH ?
      ORDER BY b.add_date DESC
      LIMIT ?
    `).all(query, limit);
  }

  getHistoryStats() {
    return this.db.prepare(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT domain) as unique_domains,
        SUM(visit_count) as total_visits,
        MAX(visit_time) as last_visit,
        MIN(visit_time) as first_visit
      FROM history
    `).get();
  }

  getTopDomains(limit = 20) {
    return this.db.prepare(`
      SELECT 
        domain,
        COUNT(*) as page_count,
        SUM(visit_count) as total_visits,
        MAX(visit_time) as last_visit
      FROM history
      WHERE domain IS NOT NULL
      GROUP BY domain
      ORDER BY total_visits DESC
      LIMIT ?
    `).all(limit);
  }

  getBookmarkFolders() {
    return this.db.prepare(`
      SELECT 
        folder_path,
        COUNT(*) as bookmark_count
      FROM bookmarks
      WHERE folder_path IS NOT NULL
      GROUP BY folder_path
      ORDER BY folder_path
    `).all();
  }

  getBookmarksByFolder(folderPath) {
    return this.db.prepare(`
      SELECT * FROM bookmarks
      WHERE folder_path = ?
      ORDER BY add_date DESC
    `).all(folderPath);
  }

  getDashboardStats() {
    const history = this.getHistoryStats();
    const topDomains = this.getTopDomains(10);
    const bookmarkCount = this.db.prepare('SELECT COUNT(*) as count FROM bookmarks').get();
    const folders = this.getBookmarkFolders();

    return {
      history,
      topDomains,
      bookmarks: {
        total: bookmarkCount.count,
        folders: folders.length
      }
    };
  }

  clean() {
    this.db.exec(`
      DELETE FROM history;
      DELETE FROM bookmarks;
      VACUUM;
    `);
    console.log('✓ Database cleaned');
  }

  close() {
    this.db.close();
  }
}

module.exports = ChromeDataDB;
