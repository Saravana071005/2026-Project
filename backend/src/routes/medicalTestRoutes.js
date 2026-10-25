import express from 'express';
import { body } from 'express-validator';
import {
  getMedicalTests,
  createMedicalTest,
  updateMedicalTest,
  deleteMedicalTest,
} from '../controllers/medicalTestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';

const router = express.Router();

const medicalTestValidation = [
  body('allergenName')
    .trim()
    .notEmpty()
    .withMessage('Food allergen name is required')
    .isLength({ max: 100 })
    .withMessage('Allergen name cannot exceed 100 characters'),
  body('testType')
    .trim()
    .notEmpty()
    .withMessage('Medical test type is required'),
  body('testDate')
    .notEmpty()
    .withMessage('Test date is required')
    .isISO8601()
    .withMessage('Please provide a valid test date format (YYYY-MM-DD)'),
  body('testResult')
    .trim()
    .notEmpty()
    .withMessage('Test result as written in report is required'),
  handleValidationErrors,
];

router.get('/', protect, getMedicalTests);
router.post('/', protect, medicalTestValidation, createMedicalTest);
router.put('/:id', protect, updateMedicalTest);
router.delete('/:id', protect, deleteMedicalTest);

export default router;
