import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'chargeflow',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'chargeflow',
  password: process.env.POSTGRES_PASSWORD || 'chargeflow',
  port: Number(process.env.POSTGRES_PORT || '5432'),
});

export const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        merchant_id VARCHAR(255) NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(255),
        risk_score INTEGER NOT NULL,
        reasons TEXT[] NOT NULL,
        computed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (merchant_id, order_id)
      );
    `);
    console.log('Database table "risk_scores" ensured to exist.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

export const getDbClient = () => pool;
