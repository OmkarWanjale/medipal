import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/schema.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import patientRoutes from './routes/patients.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/patients', patientRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`MediPal backend running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
