require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const ChromeDataDB = require('../db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new ChromeDataDB(process.env.DB_PATH || './data/chrome-data.db');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Combined search endpoint
app.get('/api/search', (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = db.searchAll(q, parseInt(limit));
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// History search endpoint
app.get('/api/history/search', (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = db.searchHistory(q, parseInt(limit));
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('History search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// History stats endpoint
app.get('/api/history/stats', (req, res) => {
  try {
    const stats = db.getHistoryStats();
    res.json(stats);
  } catch (error) {
    console.error('History stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Top domains endpoint
app.get('/api/history/domains', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const domains = db.getTopDomains(parseInt(limit));
    res.json({ domains, count: domains.length });
  } catch (error) {
    console.error('Top domains error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bookmarks search endpoint
app.get('/api/bookmarks/search', (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = db.searchBookmarks(q, parseInt(limit));
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Bookmark search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bookmark folders endpoint
app.get('/api/bookmarks/folders', (req, res) => {
  try {
    const folders = db.getBookmarkFolders();
    res.json({ folders, count: folders.length });
  } catch (error) {
    console.error('Bookmark folders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bookmarks by folder endpoint
app.get('/api/bookmarks/folder', (req, res) => {
  try {
    const { path = '/' } = req.query;
    const bookmarks = db.getBookmarksByFolder(path);
    res.json({ bookmarks, count: bookmarks.length, folder: path });
  } catch (error) {
    console.error('Bookmarks by folder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Chrome Data Hub API running on http://localhost:${PORT}`);
  console.log(`✓ Dashboard: http://localhost:${PORT}`);
  console.log(`✓ API endpoints available at /api/*`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
