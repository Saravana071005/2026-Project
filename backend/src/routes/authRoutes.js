import express from 'express';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/authController.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Please provide a valid date format (YYYY-MM-DD)'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 300 })
    .withMessage('Address cannot exceed 300 characters'),
  body('sex')
    .trim()
    .notEmpty()
    .withMessage('Sex is required')
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
    .withMessage('Invalid value for sex'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);

export default router;
