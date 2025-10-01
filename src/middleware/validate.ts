import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map(err => ({
        field: (err as any).param || (err as any).path || 'unknown',
        message: err.msg
      }))
    });
    return;
  }

  next();
};
