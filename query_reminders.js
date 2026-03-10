const db = require('./SmartDaybook/backend/config/db');
db.query('SELECT * FROM event_reminders ORDER BY id DESC LIMIT 5')
  .then(([rows]) => {
      console.log(JSON.stringify(rows, null, 2));
      process.exit();
  });
