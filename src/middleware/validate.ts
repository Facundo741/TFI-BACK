import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map(err => {
        const e = err as ValidationError; 
        return {
          field: e.param,
          message: e.msg
        };
      })
    });
    return;
  }

  next();
};
