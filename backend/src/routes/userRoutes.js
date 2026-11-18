import express from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, updatePreferences } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';

const router = express.Router();

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('dob')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date format (YYYY-MM-DD)'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty'),
  body('sex')
    .optional()
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
    .withMessage('Invalid sex option'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'hi', 'ta'])
    .withMessage('Invalid language option'),
  body('hasCompletedTutorial')
    .optional()
    .isBoolean()
    .withMessage('hasCompletedTutorial must be a boolean'),
  handleValidationErrors,
];

const updatePreferencesValidation = [
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'hi', 'ta'])
    .withMessage('Invalid language option'),
  body('hasCompletedTutorial')
    .optional()
    .isBoolean()
    .withMessage('hasCompletedTutorial must be a boolean'),
  handleValidationErrors,
];

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.put('/preferences', protect, updatePreferencesValidation, updatePreferences);

export default router;
