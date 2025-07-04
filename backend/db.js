const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sigdmus',
  password: '@Novaera2kx@',
  port: 5432,
});
module.exports = pool;
