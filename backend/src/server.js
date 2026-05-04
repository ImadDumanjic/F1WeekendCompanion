import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import predictionsRouter from './routes/predictions.js';
import racesRouter from './routes/races.js';
import { startAutoScoring } from './autoScore.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/races', racesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port);

server.on('listening', () => {
  console.log(`Backend listening on http://localhost:${port}`);
  startAutoScoring();
});

server.on('error', (err) => {
  console.error('Backend failed to start:', err.message);
  process.exit(1);
});
