import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import comicRoutes from './routes/comics.js';
import userRoutes from './routes/users.js';
import progressRoutes from './routes/progress.js';
import creatorRoutes from './routes/creator.js';
import adminRoutes from './routes/admin.js';
import creatorsRoutes from './routes/creators.js';
import uploadsRoutes from './routes/uploads.js';
import { setupSocketHandlers } from './socket/index.js';
import { seedAdminUserIfMissing } from './seed/seedAdmin.js';
import { runMigrations } from './scripts/migrate.js';

import './models/index.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/comics', comicRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/creator', creatorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/creators', creatorsRoutes);
app.use('/api/v1/uploads', uploadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

setupSocketHandlers(io);

const PORT = Number(process.env.PORT || 3001);

async function start() {
  try {
    await runMigrations();
    await connectDatabase();
    await seedAdminUserIfMissing();

    httpServer.listen(PORT, () => {
      console.log('Comic Universe API started');
      console.log(`Status: running`);
      console.log(`Port: ${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
      console.log('DB: MySQL');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
