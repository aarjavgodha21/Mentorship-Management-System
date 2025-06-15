import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { AppError } from '../utils/errorHandler';

export const updateName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    await Promise.all([
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

    const userId = (req as any).user.id;
    const { name } = req.body;

    // Update user name
    await pool.execute(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, userId]
    );

    res.json({
      status: 'success',
      message: 'Name updated successfully'
    });
  } catch (error) {
    next(error);
  }
}; 