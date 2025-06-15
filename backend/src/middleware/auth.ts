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
    if (!authHeader) {
      console.log('Auth Middleware: No authorization header present');
      throw new AppError('No token provided', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Auth Middleware: Invalid authorization header format');
      throw new AppError('Invalid token format', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth Middleware: No token found in authorization header');
      throw new AppError('No token provided', 401);
    }

    console.log('Auth Middleware: Token received');

    // Verify token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;
      
      console.log('Auth Middleware: Token verified successfully');
      
      // Add user to request
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('Auth Middleware: JWT Verification Error', jwtError);
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      } else {
        throw new AppError('Authentication failed', 401);
      }
    }
  } catch (error) {
    console.error('Auth Middleware: Error in authentication', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
}; 