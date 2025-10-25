const ChromeDataDB = require('../src/db/database');

console.log('Initializing Chrome Data Hub database...');

const db = new ChromeDataDB('./data/chrome-data.db');
db.initSchema();

console.log('✓ Database initialized successfully at ./data/chrome-data.db');
console.log('✓ Ready to import data');

db.close();
