import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { errors } from './errorHandler.js';

function normalizeRole(role: string): string {
  return role === 'author' ? 'creator' : role;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw errors.unauthorized('Требуется токен доступа');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';

    try {
      const decoded = jwt.verify(token, secret) as {
        userId: string;
        email: string;
        role: string;
      };

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw errors.unauthorized('Пользователь не найден');
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: normalizeRole(user.role),
      };

      next();
    } catch {
      throw errors.unauthorized('Недействительный или истёкший токен');
    }
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(errors.unauthorized());
    }

    if (!roles.includes(normalizeRole(req.user.role))) {
      return next(errors.forbidden('Недостаточно прав'));
    }

    next();
  };
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: normalizeRole(user.role),
      };
    }
  } catch {

  }

  next();
}
