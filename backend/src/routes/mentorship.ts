import { Router } from 'express';
import { body } from 'express-validator';
import {
  createRequest,
  getRequests,
  updateRequestStatus,
  createSession,
  getSessions,
  updateSessionStatus,
  createRating,
  deleteRequest
} from '../controllers/mentorship';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Mentorship requests
router.post(
  '/requests',
  authenticate,
  [
    body('mentorId').notEmpty().withMessage('Mentor ID is required'),
    body('message').optional().isString().withMessage('Message must be a string')
  ],
  validateRequest,
  createRequest
);

router.get('/requests', authenticate, getRequests);

router.patch(
  '/requests/:requestId',
  authenticate,
  [
    body('status')
      .isIn(['accepted', 'rejected', 'completed'])
      .withMessage('Invalid status')
  ],
  validateRequest,
  updateRequestStatus
);

router.delete('/requests/:requestId', authenticate, deleteRequest);

// Sessions
router.post(
  '/sessions',
  authenticate,
  [
    body('requestId').notEmpty().withMessage('Request ID is required'),
    body('startTime').isISO8601().withMessage('Invalid start time'),
    body('endTime').isISO8601().withMessage('Invalid end time')
  ],
  validateRequest,
  createSession
);

router.get('/sessions', authenticate, getSessions);

router.patch(
  '/sessions/:sessionId',
  authenticate,
  [
    body('status')
      .isIn(['scheduled', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  validateRequest,
  updateSessionStatus
);

// Ratings
router.post(
  '/ratings',
  authenticate,
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('ratedId').notEmpty().withMessage('Rated user ID is required'),
    body('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().withMessage('Comment must be a string')
  ],
  validateRequest,
  createRating
);

export default router; 