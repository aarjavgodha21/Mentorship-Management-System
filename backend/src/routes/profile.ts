import { Router } from 'express';
import { body } from 'express-validator';
import {
  createProfile,
  getProfile,
  updateProfile,
  searchMentors
} from '../controllers/profile';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create/Update profile
router.post(
  '/',
  authenticate,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('skills').isArray().withMessage('Skills must be an array'),
    body('availability').isObject().withMessage('Availability must be an object'),
    body('hourlyRate')
      .optional()
      .isNumeric()
      .withMessage('Hourly rate must be a number')
  ],
  validateRequest,
  createProfile
);

// Get profile
router.get('/:userId', authenticate, getProfile);

// Update profile
router.patch(
  '/',
  authenticate,
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('department').optional().notEmpty().withMessage('Department cannot be empty'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('availability').optional().isObject().withMessage('Availability must be an object'),
    body('hourlyRate')
      .optional()
      .isNumeric()
      .withMessage('Hourly rate must be a number')
  ],
  validateRequest,
  updateProfile
);

// Search mentors
router.get('/search/mentors', authenticate, searchMentors);

export default router; 