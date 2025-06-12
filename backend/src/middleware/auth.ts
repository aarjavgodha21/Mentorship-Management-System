import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Auth Middleware: Entering authentication middleware', req.method, req.path);
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    console.log('Auth Middleware: Token received', token);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;
    console.log('Auth Middleware: Decoded token', decoded);

    // Add user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Auth Middleware: JWT Verification Error', error.message);
      next(new AppError('Invalid token', 401));
    } else {
      console.error('Auth Middleware: Generic authentication error', error);
      next(error);
    }
  }
}; 