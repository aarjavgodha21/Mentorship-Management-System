import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    ...(err instanceof AppError ? { statusCode: err.statusCode } : {})
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Handle MySQL errors
  if (err.name === 'Error' && (err as any).code) {
    console.error('MySQL Error:', {
      code: (err as any).code,
      errno: (err as any).errno,
      sqlMessage: (err as any).sqlMessage,
      sqlState: (err as any).sqlState
    });

    return res.status(500).json({
      status: 'error',
      message: 'Database error occurred'
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
}; 