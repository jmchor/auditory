const { Pool } = require('pg');

// const pool = new Pool({
// 	user: process.env.DB_USER,
// 	host: process.env.DB_HOST,
// 	database: process.env.DB_DATABASE,
// 	password: process.env.DB_PASSWORD,
// 	port: process.env.DB_PORT,
// });

const connectionString = process.env.DB_URL;

// for prod
const pool = new Pool({ connectionString });

module.exports = pool;
