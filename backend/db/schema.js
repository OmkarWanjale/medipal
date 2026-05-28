import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('patient', 'doctor')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        symptoms TEXT[],
        duration VARCHAR(255),
        severity INTEGER,
        ai_summary TEXT,
        ai_suggestion TEXT,
        urgency VARCHAR(10) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
        doctor_notes TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables ready');
  } finally {
    client.release();
  }
}
