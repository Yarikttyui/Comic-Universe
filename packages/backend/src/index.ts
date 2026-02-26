import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import comicRoutes from './routes/comics.js';
import userRoutes from './routes/users.js';
import progressRoutes from './routes/progress.js';
import creatorRoutes from './routes/creator.js';
import adminRoutes from './routes/admin.js';
import creatorsRoutes from './routes/creators.js';
import uploadsRoutes from './routes/uploads.js';
import subscriptionRoutes from './routes/subscriptions.js';
import notificationRoutes from './routes/notifications.js';
import { setupSocketHandlers } from './socket/index.js';
import { seedAdminUserIfMissing } from './seed/seedAdmin.js';
import { runMigrations } from './scripts/migrate.js';
import { connectRedis } from './services/redisService.js';
import { setIO } from './services/notificationService.js';
import { initMailTransporter } from './services/emailService.js';

import './models/index.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origin,
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
    origin: config.cors.origin,
    credentials: true,
  })
);
app.set('trust proxy', 1);
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(globalLimiter);

app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/comics', comicRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/creator', creatorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/creators', creatorsRoutes);
app.use('/api/v1/uploads', uploadLimiter, uploadsRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

setupSocketHandlers(io);
setIO(io);

async function start() {
  try {
    await connectDatabase();
    await runMigrations();
    await connectRedis();
    initMailTransporter();
    await seedAdminUserIfMissing();

    httpServer.listen(config.port, () => {
      console.log('Comic Universe API started');
      console.log(`Status: running`);
      console.log(`Port: ${config.port}`);
      console.log(`Mode: ${config.env}`);
      console.log(`API: http://localhost:${config.port}/api/v1`);
      console.log('DB: MySQL');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
