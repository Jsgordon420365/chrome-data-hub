const ChromeDataDB = require('../src/db/database');

console.log('WARNING: This will delete ALL data from the database!');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');

setTimeout(() => {
  const db = new ChromeDataDB('./data/chrome-data.db');
  db.clean();
  console.log('✓ Database cleaned successfully');
  db.close();
}, 3000);
