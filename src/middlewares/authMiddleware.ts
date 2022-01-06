import { NextFunction, Request, Response } from 'express';

import AuthService from '@src/services/AuthService';

const authMiddleware = (
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction
): void => {
  const token = req.headers?.['x-access-token'];

  const decoded = AuthService.decodeToken(token as string);
  req.decoded = decoded;
  next();
};

export default authMiddleware;
