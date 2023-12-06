const { Pool } = require('pg');

const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'song_library',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

module.exports = pool;
