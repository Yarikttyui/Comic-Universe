import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Маршрут ${req.method} ${req.path} не найден`,
    },
  });
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details && { details: err.details }),
    },
  });
}

export function createError(
  message: string,
  statusCode: number = 500,
  code: string = 'ERROR'
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export const errors = {
  unauthorized: (message = 'Не авторизован') => createError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Доступ запрещён') => createError(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Не найдено') => createError(message, 404, 'NOT_FOUND'),
  badRequest: (message = 'Неверный запрос') => createError(message, 400, 'BAD_REQUEST'),
  conflict: (message = 'Конфликт') => createError(message, 409, 'CONFLICT'),
  validation: (message = 'Ошибка валидации', details?: Record<string, string[]>) => {
    const error = createError(message, 422, 'VALIDATION_ERROR');
    error.details = details;
    return error;
  },
};
