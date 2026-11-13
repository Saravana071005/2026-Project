import express from 'express';
import {
  runAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getDietMonitoring,
  getPatterns,
} from '../controllers/aiAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/analyze', runAnalysis);
router.get('/history', getAnalysisHistory);
router.get('/diet-monitoring', getDietMonitoring);
router.get('/patterns', getPatterns);
router.get('/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

export default router;
