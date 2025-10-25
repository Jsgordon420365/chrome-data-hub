const fs = require('fs');
const path = require('path');
const ChromeDataDB = require('../src/db/database');
const { parseBookmarksJSON, parseBookmarksHTML } = require('../src/parsers/bookmarks-parser');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npm run import-bookmarks -- <path-to-bookmarks.json|.html>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Reading bookmarks from: ${filePath}`);

const content = fs.readFileSync(filePath, 'utf8');
const ext = path.extname(filePath).toLowerCase();

let entries;

if (ext === '.json') {
  entries = parseBookmarksJSON(content);
} else if (ext === '.html' || ext === '.htm') {
  entries = parseBookmarksHTML(content);
} else {
  console.error('Error: File must be .json or .html');
  process.exit(1);
}

console.log(`Parsed ${entries.length} bookmark entries`);

const db = new ChromeDataDB('./data/chrome-data.db');
db.insertBookmarks(entries);

console.log(`✓ Imported ${entries.length} bookmark entries to database`);

db.close();
