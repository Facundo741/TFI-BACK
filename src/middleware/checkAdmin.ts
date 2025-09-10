import { Request, Response, NextFunction } from 'express';

export const checkAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    return;
  }

  next();
};