import express from 'express';
import { body } from 'express-validator';
import {
  getAllergies,
  createAllergy,
  updateAllergy,
  deleteAllergy,
} from '../controllers/allergyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';

const router = express.Router();

const allergyValidation = [
  body('allergenName')
    .trim()
    .notEmpty()
    .withMessage('Food allergen name is required')
    .isLength({ max: 100 })
    .withMessage('Allergen name cannot exceed 100 characters'),
  body('severity')
    .optional()
    .isIn(['Mild', 'Moderate', 'Severe / Anaphylactic Risk'])
    .withMessage('Invalid severity level'),
  handleValidationErrors,
];

router.get('/', protect, getAllergies);
router.post('/', protect, allergyValidation, createAllergy);
router.put('/:id', protect, updateAllergy);
router.delete('/:id', protect, deleteAllergy);

export default router;
