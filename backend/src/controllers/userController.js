import User, { calculateAge } from '../models/User.js';

/**
 * Get current user profile
 * GET /api/user/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    // Ensure calculated age is fresh based on today's date
    const currentAge = calculateAge(user.dob);
    if (user.age !== currentAge) {
      user.age = currentAge;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
};

/**
 * Update current user profile
 * PUT /api/user/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, dob, address, sex, email, foodAllergySummary } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // If email is changing, check uniqueness
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already in use by another account.',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (address) user.address = address.trim();
    if (sex) user.sex = sex;
    if (foodAllergySummary !== undefined) user.foodAllergySummary = foodAllergySummary.trim();

    if (dob) {
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
      user.dob = parsedDob;
      user.age = calculateAge(parsedDob);
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Personal profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update personal profile.',
    });
  }
};
