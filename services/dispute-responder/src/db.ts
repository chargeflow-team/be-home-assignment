import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'chargeflow',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'chargeflow', // Assuming same DB for simplicity, or separate if needed
  password: process.env.POSTGRES_PASSWORD || 'chargeflow',
  port: Number(process.env.POSTGRES_PORT || '5432'),
});

export const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dispute_recommendations (
        merchant_id VARCHAR(255) NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(255),
        recommended_action VARCHAR(255) NOT NULL,
        evidence_bundle JSONB NOT NULL,
        computed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (merchant_id, order_id)
      );
    `);
    console.log('Database table "dispute_recommendations" ensured to exist.');
  } catch (error) {
    console.error('Error initializing dispute-responder database:', error);
    process.exit(1);
  }
};

export const getDbClient = () => pool;
