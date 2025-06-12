import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getCurrentUser } from '../controllers/auth';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register route
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .isIn(['mentor', 'mentee'])
      .withMessage('Role must be either mentor or mentee')
  ],
  validateRequest,
  register
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  login
);

// Get current user route
router.get('/me', authenticate, getCurrentUser);

export default router; 