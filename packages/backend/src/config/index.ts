import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  env: optional('NODE_ENV', 'development'),
  isProduction,
  port: optionalInt('PORT', 3001),

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: optionalInt('DB_PORT', 3306),
    name: optional('DB_NAME', 'comic_universe'),
    user: optional('DB_USER', 'root'),
    password: isProduction ? required('DB_PASSWORD') : optional('DB_PASSWORD', '12345678'),
    sync: process.env.DB_SYNC === 'true',
  },

  jwt: {
    secret: isProduction ? required('JWT_SECRET') : optional('JWT_SECRET', 'dev-jwt-secret'),
    refreshSecret: isProduction ? required('JWT_REFRESH_SECRET') : optional('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessExpiresSeconds: optionalInt('JWT_ACCESS_EXPIRES_SEC', 900),
    refreshExpiresMs: optionalInt('JWT_REFRESH_EXPIRES_DAYS', 7) * 24 * 60 * 60 * 1000,
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  },

  upload: {
    dir: optional('UPLOAD_DIR', './uploads'),
    maxFileSize: optionalInt('MAX_FILE_SIZE', 10 * 1024 * 1024),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://redis:6379'),
  },

  smtp: {
    host: optional('SMTP_HOST', 'smtp.mail.ru'),
    port: optionalInt('SMTP_PORT', 465),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'Comic Universe <mycsc@mail.ru>'),
  },

  appUrl: optional('APP_URL', 'http://localhost:8081'),

  seed: {
    adminEmail: optional('ADMIN_EMAIL', ''),
    adminPassword: optional('ADMIN_PASSWORD', ''),
  },
} as const;
