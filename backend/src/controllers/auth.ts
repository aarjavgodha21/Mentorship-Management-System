import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../utils/errorHandler';
import { body, validationResult } from 'express-validator';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string;
  role: 'mentor' | 'mentee';
  name: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    await Promise.all([
      body('email').isEmail().withMessage('Please provide a valid email').run(req),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .run(req),
      body('role')
        .isIn(['mentor', 'mentee'])
        .withMessage('Role must be either mentor or mentee')
        .run(req),
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long')
        .run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password, role, name } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as RowDataPacket[]).length > 0) {
      throw new AppError('Email already in use', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    await pool.execute(
      'INSERT INTO users (id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, role, name]
    );

    // Generate JWT
    const jwtSecret: Secret = process.env.JWT_SECRET || 'your-secret-key';
    const jwtOptions: SignOptions = { 
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn']
    };
    const token = jwt.sign(
      { id: userId, role },
      jwtSecret,
      jwtOptions
    );

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: userId,
          email,
          role,
          name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    await Promise.all([
      body('email').isEmail().withMessage('Please provide a valid email').run(req),
      body('password').notEmpty().withMessage('Password is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((users as RowDataPacket[]).length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = (users as RowDataPacket[])[0] as User;

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const jwtSecret: Secret = process.env.JWT_SECRET || 'your-secret-key';
    const jwtOptions: SignOptions = { 
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn']
    };
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      jwtOptions
    );

    const responseData = {
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      }
    };

    console.log('Backend Login: Sending response data:', responseData);
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    console.log('getCurrentUser: User ID from token', userId);

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, role, name FROM users WHERE id = ?',
      [userId]
    );

    if ((users as RowDataPacket[]).length === 0) {
      console.log('getCurrentUser: User not found in DB for ID', userId);
      throw new AppError('User not found', 404);
    }

    const user = (users as RowDataPacket[])[0];
    console.log('getCurrentUser: User data from DB', user);

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('getCurrentUser: Error', error);
    next(error);
  }
}; 