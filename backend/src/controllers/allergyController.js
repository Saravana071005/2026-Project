import AllergyRecord from '../models/AllergyRecord.js';

/**
 * Retrieve all food allergy records for the authenticated user
 * GET /api/allergies
 */
export const getAllergies = async (req, res) => {
  try {
    const allergies = await AllergyRecord.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: allergies.length,
      data: allergies,
    });
  } catch (error) {
    console.error('[Get Allergies Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve food allergy records.',
    });
  }
};

/**
 * Add a new food allergy record
 * POST /api/allergies
 */
export const createAllergy = async (req, res) => {
  try {
    const {
      allergenName,
      allergenCategory,
      severity,
      diagnosisType,
      knownReactions,
      reactionDescription,
      doctorName,
      emergencyMedication,
    } = req.body;

    if (!allergenName || !allergenName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Food allergen name is required.',
      });
    }

    const allergy = new AllergyRecord({
      userId: req.user._id,
      allergenName: allergenName.trim(),
      allergenCategory: allergenCategory || 'Other Food',
      severity: severity || 'Moderate',
      diagnosisType: diagnosisType || 'Doctor-Confirmed Diagnosis',
      knownReactions: Array.isArray(knownReactions) ? knownReactions : [],
      reactionDescription: reactionDescription ? reactionDescription.trim() : '',
      doctorName: doctorName ? doctorName.trim() : '',
      emergencyMedication: emergencyMedication ? emergencyMedication.trim() : '',
    });

    await allergy.save();

    return res.status(201).json({
      success: true,
      message: 'Food allergy record saved successfully.',
      data: allergy,
    });
  } catch (error) {
    console.error('[Create Allergy Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save food allergy record.',
    });
  }
};

/**
 * Update an existing food allergy record
 * PUT /api/allergies/:id
 */
export const updateAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      allergenName,
      allergenCategory,
      severity,
      diagnosisType,
      knownReactions,
      reactionDescription,
      doctorName,
      emergencyMedication,
    } = req.body;

    // Strict ownership verification: verify record belongs to authenticated user
    const allergy = await AllergyRecord.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!allergy) {
      return res.status(404).json({
        success: false,
        message: 'Food allergy record not found or unauthorized to edit.',
      });
    }

    if (allergenName) allergy.allergenName = allergenName.trim();
    if (allergenCategory) allergy.allergenCategory = allergenCategory;
    if (severity) allergy.severity = severity;
    if (diagnosisType) allergy.diagnosisType = diagnosisType;
    if (knownReactions !== undefined) {
      allergy.knownReactions = Array.isArray(knownReactions) ? knownReactions : [];
    }
    if (reactionDescription !== undefined) allergy.reactionDescription = reactionDescription.trim();
    if (doctorName !== undefined) allergy.doctorName = doctorName.trim();
    if (emergencyMedication !== undefined) allergy.emergencyMedication = emergencyMedication.trim();

    await allergy.save();

    return res.status(200).json({
      success: true,
      message: 'Food allergy record updated successfully.',
      data: allergy,
    });
  } catch (error) {
    console.error('[Update Allergy Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update food allergy record.',
    });
  }
};

/**
 * Delete a food allergy record
 * DELETE /api/allergies/:id
 */
export const deleteAllergy = async (req, res) => {
  try {
    const { id } = req.params;

    // Strict ownership verification
    const allergy = await AllergyRecord.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!allergy) {
      return res.status(404).json({
        success: false,
        message: 'Food allergy record not found or unauthorized to delete.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food allergy record deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Allergy Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete food allergy record.',
    });
  }
};
