import express from 'express';
import {
  getSymptoms,
  getSymptomById,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  checkEmergencyPreCheck,
} from '../controllers/symptomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/check-emergency', checkEmergencyPreCheck);
router.get('/', getSymptoms);
router.get('/:id', getSymptomById);
router.post('/', createSymptom);
router.put('/:id', updateSymptom);
router.delete('/:id', deleteSymptom);

export default router;
