# Cursor IDE Instructions - Chrome Data Hub

## Project Overview

**GitHub Repository**: https://github.com/Jsgordon420365/chrome-data-hub

This is a Chrome history and bookmarks database system with:
- SQLite database (better-sqlite3) with FTS5 full-text search
- Express REST API backend
- Vanilla JavaScript frontend
- CLI tools for data import/export
- **Status**: ✅ Fully functional and deployed to GitHub

## Architecture

### Database Layer (`src/db/database.js`)
- SQLite with WAL mode for concurrent access
- FTS5 virtual tables for full-text search
- Two main tables: `history` and `bookmarks`
- Automatic triggers for FTS index updates
- Transaction-wrapped bulk inserts for performance

### Parsers (`src/parsers/`)
- `history-parser.js`: Parses Chrome history JSON
- `bookmarks-parser.js`: Parses bookmarks JSON and HTML formats
- Both handle multiple Chrome export format variations

### API Layer (`src/api/server.js`)
- Express server with security middleware (helmet, cors, compression)
- RESTful endpoints for search, stats, and data retrieval
- Serves static frontend files from `src/public/`

### Frontend (`src/public/`)
- Single-page application with tab-based navigation
- Vanilla JavaScript (no frameworks)
- Real-time search with API integration
- Responsive CSS with gradient styling

### CLI Scripts (`scripts/`)
- `init-db.js`: Initialize database schema
- `import-history.js`: Import history JSON files
- `import-bookmarks.js`: Import bookmark JSON/HTML files
- `clean-db.js`: Clear all database data

## Database Schema Details

### History Table
```sql
CREATE TABLE history (
  id TEXT PRIMARY KEY,              -- Unique entry ID
  url TEXT NOT NULL,                -- Full URL
  title TEXT,                       -- Page title
  visit_time REAL NOT NULL,         -- Visit timestamp (ms)
  last_visit_time REAL,             -- Last visit timestamp
  visit_count INTEGER DEFAULT 1,    -- Number of visits
  typed_count INTEGER DEFAULT 0,    -- Times manually typed
  transition TEXT,                  -- Navigation type (link, typed, etc)
  domain TEXT,                      -- Extracted domain
  is_local BOOLEAN DEFAULT 0,       -- Local file flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bookmarks Table
```sql
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,                -- Bookmark URL
  title TEXT NOT NULL,              -- Bookmark title
  folder_path TEXT,                 -- Folder hierarchy
  add_date INTEGER,                 -- Unix timestamp
  last_visit TEXT,                  -- Last visit datetime
  visit_count INTEGER DEFAULT 0,    -- Visit count
  is_bookmarklet BOOLEAN DEFAULT 0, -- JavaScript bookmark flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(url, folder_path)          -- Prevent duplicates in same folder
);
```

### FTS5 Virtual Tables
- `history_fts`: Full-text search on title, url, domain
- `bookmarks_fts`: Full-text search on title, url, folder_path
- Automatic synchronization via triggers

## API Endpoints Reference

### Search Endpoints

**Combined Search**
```
GET /api/search?q=<query>&limit=<number>
Returns: { results: [...], count: number }
```

**History Search**
```
GET /api/history/search?q=<query>&limit=<number>
Returns: { results: [...], count: number }
```

**Bookmark Search**
```
GET /api/bookmarks/search?q=<query>&limit=<number>
Returns: { results: [...], count: number }
```

### Statistics Endpoints

**History Stats**
```
GET /api/history/stats
Returns: {
  total_entries, unique_domains, total_visits,
  last_visit, first_visit
}
```

**Top Domains**
```
GET /api/history/domains?limit=<number>
Returns: { domains: [...], count: number }
```

**Bookmark Folders**
```
GET /api/bookmarks/folders
Returns: { folders: [...], count: number }
```

**Bookmarks by Folder**
```
GET /api/bookmarks/folder?path=<folder_path>
Returns: { bookmarks: [...], count: number, folder: string }
```

**Dashboard**
```
GET /api/dashboard
Returns: {
  history: { stats },
  topDomains: [...],
  bookmarks: { total, folders }
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. Open `src/api/server.js`
2. Add new route handler:
```javascript
app.get('/api/new-endpoint', (req, res) => {
  try {
    const { param } = req.query;
    const results = db.newMethod(param);
    res.json({ results });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

3. Add corresponding database method in `src/db/database.js`:
```javascript
newMethod(param) {
  return this.db.prepare(`
    SELECT * FROM table WHERE field = ?
  `).all(param);
}
```

### Modifying Database Schema

1. Edit `src/db/database.js` → `initSchema()` method
2. Add new table/column/index:
```javascript
CREATE TABLE IF NOT EXISTS new_table (
  id INTEGER PRIMARY KEY,
  field TEXT NOT NULL
);
```

3. Delete existing database and reinitialize:
```bash
rm data/chrome-data.db
npm run init-db
npm run import-all
```

### Adding a New Parser Format

1. Create/edit parser in `src/parsers/`
2. Add format detection logic:
```javascript
function parseNewFormat(data) {
  const entries = [];
  // Parse logic here
  return entries;
}
```

3. Update import script to handle new format
4. Add format validation and error handling

### Modifying Frontend UI

**HTML Structure** (`src/public/index.html`)
- Add new tab: Create button in `.tabs` and div in `.tab-content`
- Add new form element in appropriate tab section

**Styling** (`src/public/css/styles.css`)
- Follow existing color scheme (purple gradient: #667eea to #764ba2)
- Use `.result-item`, `.stat-card`, `.folder-item` classes
- Maintain responsive design with media queries

**JavaScript Logic** (`src/public/js/app.js`)
- Add event listeners for new UI elements
- Create API fetch functions following existing patterns
- Update DOM with results using `.innerHTML` patterns

### Performance Optimization

**Database Level**
- Add indexes: `CREATE INDEX idx_name ON table(column);`
- Use prepared statements for repeated queries
- Wrap bulk operations in transactions

**API Level**
- Add request caching with simple in-memory Map
- Implement pagination for large result sets
- Add request rate limiting if needed

**Frontend Level**
- Debounce search inputs
- Add loading states for all async operations
- Implement virtual scrolling for large lists

## Testing Procedures

### Manual Testing
```bash
# 1. Start server
npm start

# 2. Test each endpoint
curl http://localhost:3000/api/health
curl http://localhost:3000/api/search?q=github
curl http://localhost:3000/api/dashboard

# 3. Test frontend
# Open http://localhost:3000
# Click each tab and test search functionality
```

### Database Testing
```bash
# Check record counts
sqlite3 data/chrome-data.db "SELECT COUNT(*) FROM history;"
sqlite3 data/chrome-data.db "SELECT COUNT(*) FROM bookmarks;"

# Test FTS search
sqlite3 data/chrome-data.db "SELECT * FROM history_fts WHERE history_fts MATCH 'github';"

# Check for duplicates
sqlite3 data/chrome-data.db "SELECT url, COUNT(*) FROM history GROUP BY url HAVING COUNT(*) > 1;"
```

### Import Testing
```bash
# Test with sample data
npm run import-history -- ./history-2.json
npm run import-bookmarks -- ./bookmarks-2025-10-25.json

# Verify import success
npm start
# Check dashboard for correct counts
```

## Code Style Guidelines

- Use semicolons consistently
- 2-space indentation
- Use const/let instead of var
- Prefer template literals for strings
- Add error handling to all async operations
- Log errors with descriptive messages
- Use try-catch blocks for database operations

## Security Considerations

- All SQL queries use prepared statements (prevents SQL injection)
- Frontend sanitizes HTML with `escapeHtml()` function
- Helmet.js provides security headers
- CORS enabled but can be restricted to specific origins
- No authentication required (local-only usage assumed)

## Deployment Notes

### Local Development
```bash
npm run dev  # Auto-reload with nodemon
```

### Production
```bash
NODE_ENV=production npm start
```

### Cross-Device Deployment
1. Copy entire project folder to target device
2. Run `npm install` (platform-specific binaries will be installed)
3. Copy database file or re-import data
4. Start server and access via device IP

## Common Issues and Solutions

**Issue**: Database locked
**Solution**: Close all SQLite connections, restart server

**Issue**: Port already in use
**Solution**: Change PORT in .env or kill process using port

**Issue**: Import fails silently
**Solution**: Check parser error handling, verify JSON structure

**Issue**: Search returns no results
**Solution**: Verify FTS tables populated (check triggers), rebuild FTS index

**Issue**: Frontend not loading
**Solution**: Check static file serving in server.js, verify file paths

## File Modification Patterns

### When modifying database.js:
1. Update schema in `initSchema()`
2. Add/modify query methods
3. Test with `npm run init-db`
4. Update API endpoints to use new methods

### When modifying server.js:
1. Add route handler
2. Add error handling
3. Test endpoint with curl
4. Update frontend to call new endpoint

### When modifying parsers:
1. Handle multiple data formats
2. Add extensive error handling
3. Test with actual Chrome export files
4. Log parse errors for debugging

### When modifying frontend:
1. Update HTML structure
2. Add CSS styles
3. Implement JavaScript logic
4. Test in multiple browsers

## Dependencies

**Core**
- better-sqlite3: SQLite with FTS5
- express: Web framework
- dotenv: Environment variables

**Middleware**
- cors: Cross-origin requests
- compression: Response compression
- helmet: Security headers

**Development**
- nodemon: Auto-reload during development

## Environment Configuration

Required environment variables (.env):
```
PORT=3000                        # Server port
DB_PATH=./data/chrome-data.db   # Database location
NODE_ENV=development            # Environment mode
```

## Project Maintenance

### Regular Tasks
- Backup database before major changes
- Test imports with latest Chrome export formats
- Update dependencies: `npm update`
- Check for security vulnerabilities: `npm audit`

### When Chrome Changes Export Format
1. Update parser logic to handle new format
2. Add backward compatibility for old formats
3. Test with both old and new export files
4. Update documentation

This project is designed for easy modification and extension. Follow the existing patterns and maintain consistency in code style, error handling, and API design.
