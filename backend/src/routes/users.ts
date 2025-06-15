import { Router } from 'express';
import { updateName } from '../controllers/users';
import { authenticate } from '../middleware/auth';

const router = Router();

router.patch('/name', authenticate, updateName);

export default router; 