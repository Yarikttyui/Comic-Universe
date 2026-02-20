import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';
import { createUploadMiddleware, persistUploadedFile } from '../services/uploadService.js';

const router = Router();
const uploadAny = createUploadMiddleware({ fieldName: 'file', subDir: 'files' });

router.post('/', authenticate, uploadAny, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw errors.badRequest('Файл не загружен');
    }

    const { record, publicUrl } = await persistUploadedFile({
      ownerUserId: req.user!.id,
      file: req.file,
      subDir: 'files',
    });

    res.status(201).json({
      success: true,
      data: {
        file: {
          id: record.id,
          originalName: record.originalName,
          mimeType: record.mimeType,
          sizeBytes: Number(record.sizeBytes),
          publicUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
