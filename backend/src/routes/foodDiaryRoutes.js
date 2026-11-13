import express from 'express';
import {
  getFoodEntries,
  getFoodEntryById,
  createFoodEntry,
  updateFoodEntry,
  deleteFoodEntry,
  getCalendarSummary,
} from '../controllers/foodDiaryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/calendar-summary', getCalendarSummary);
router.get('/', getFoodEntries);
router.get('/:id', getFoodEntryById);
router.post('/', createFoodEntry);
router.put('/:id', updateFoodEntry);
router.delete('/:id', deleteFoodEntry);

export default router;
