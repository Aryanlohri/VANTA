import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_CODES } from '@aicr/shared';

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return next(new AppError('Forbidden: Admin access required', 403, ERROR_CODES.UNAUTHORIZED));
  }
  next();
}
