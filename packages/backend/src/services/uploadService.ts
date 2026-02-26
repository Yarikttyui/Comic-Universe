import fs from 'fs';
import path from 'path';
import multer from 'multer';
import type { Request } from 'express';
import { UploadedFile } from '../models/index.js';
import { config } from '../config/index.js';

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function ensureUploadSubDir(subDir: string): string {
  const dir = path.join(process.cwd(), 'uploads', subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function createUploadMiddleware(options: { fieldName: string; subDir: string }) {
  const targetDir = ensureUploadSubDir(options.subDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (req: Request, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const cleanBase = sanitizeName(base).slice(0, 80) || 'file';
      const cleanExt = sanitizeName(ext).slice(0, 20);
      const userId = (req as any).user?.id || 'anon';
      cb(null, `${Date.now()}-${userId}-${cleanBase}${cleanExt}`);
    },
  });

  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимы только изображения (JPEG, PNG, GIF, WebP, SVG)'));
    }
  };

  return multer({ storage, fileFilter, limits: { fileSize: config.upload.maxFileSize } }).single(options.fieldName);
}

export async function persistUploadedFile(params: {
  ownerUserId: string;
  file: Express.Multer.File;
  subDir: string;
}) {
  const publicUrl = `/uploads/${params.subDir}/${params.file.filename}`;
  const record = await UploadedFile.create({
    ownerUserId: params.ownerUserId,
    originalName: params.file.originalname,
    mimeType: params.file.mimetype || 'application/octet-stream',
    sizeBytes: params.file.size,
    storagePath: params.file.path,
    publicUrl,
  });

  return { record, publicUrl };
}
