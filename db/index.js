const { Pool } = require('pg');

// const pool = new Pool({
// 	user: process.env.DB_USER,
// 	host: process.env.DB_HOST,
// 	database: process.env.DB_DATABASE,
// 	password: process.env.DB_PASSWORD,
// 	port: process.env.DB_PORT,
// });

// for prod

const connectionString = 'postgres://fmbihinn:ppzvbqVXSnrQEyzwOvbL0PuRF_Cbrmd8@flora.db.elephantsql.com/fmbihinn';
const pool = new Pool({ connectionString });

module.exports = pool;
