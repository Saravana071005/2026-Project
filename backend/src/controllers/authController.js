import User, { calculateAge } from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, dob, address, sex, email, password, foodAllergySummary } = req.body;

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in or use a different email.',
      });
    }

    // Age validation
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date of birth provided.',
      });
    }

    if (parsedDob > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth cannot be in the future.',
      });
    }

    const calculatedAge = calculateAge(parsedDob);

    const user = new User({
      name: name.trim(),
      dob: parsedDob,
      age: calculatedAge,
      address: address.trim(),
      sex,
      email: email.toLowerCase().trim(),
      password,
      foodAllergySummary: foodAllergySummary ? foodAllergySummary.trim() : '',
    });

    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        age: user.age,
        address: user.address,
        sex: user.sex,
        foodAllergySummary: user.foodAllergySummary,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during registration.',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    // Find user by email and select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        age: user.age,
        address: user.address,
        sex: user.sex,
        foodAllergySummary: user.foodAllergySummary,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login.',
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  // Stateless JWT tokens are cleared client-side; endpoint ensures standardized API contract
  return res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};
