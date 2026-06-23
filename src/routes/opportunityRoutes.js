import express from 'express';
import {
  getOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity,
} from '../controllers/opportunityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateOpportunity } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(protect); // All opportunity routes require auth

router.route('/').get(getOpportunities).post(validateOpportunity, createOpportunity);
router.route('/:id').get(getOpportunity).put(validateOpportunity, updateOpportunity).delete(deleteOpportunity);

export default router;
