const fs = require('fs');
const path = require('path');
const ChromeDataDB = require('../src/db/database');
const { parseHistoryJSON } = require('../src/parsers/history-parser');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npm run import-history -- <path-to-history.json>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Reading history from: ${filePath}`);

const jsonContent = fs.readFileSync(filePath, 'utf8');
const entries = parseHistoryJSON(jsonContent);

console.log(`Parsed ${entries.length} history entries`);

const db = new ChromeDataDB('./data/chrome-data.db');
db.insertHistory(entries);

console.log(`✓ Imported ${entries.length} history entries to database`);

db.close();
