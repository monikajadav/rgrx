require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function drop() {
  try {
    await pool.query('DROP TABLE IF EXISTS bill_items, bills, batches, products, categories CASCADE;');
    console.log('Tables dropped');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
drop();
