import MedicalTestRecord from '../models/MedicalTestRecord.js';

/**
 * Retrieve all medical test records for the authenticated user
 * GET /api/medical-tests
 */
export const getMedicalTests = async (req, res) => {
  try {
    const tests = await MedicalTestRecord.find({ userId: req.user._id }).sort({
      testDate: -1,
    });

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error('[Get Medical Tests Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical test records.',
    });
  }
};

/**
 * Add a new medical test record
 * POST /api/medical-tests
 */
export const createMedicalTest = async (req, res) => {
  try {
    const {
      allergenName,
      testType,
      testDate,
      testResult,
      units,
      isDoctorConfirmedDiagnosis,
      clinicalDiagnosisStatus,
      doctorNotes,
      recordedReactionDetails,
      clinicOrLabName,
    } = req.body;

    if (!allergenName || !allergenName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Food allergen name is required.',
      });
    }

    if (!testType || !testType.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Medical test type is required.',
      });
    }

    if (!testDate) {
      return res.status(400).json({
        success: false,
        message: 'Test date is required.',
      });
    }

    const parsedDate = new Date(testDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test date provided.',
      });
    }

    if (parsedDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Test date cannot be in the future.',
      });
    }

    if (!testResult || !testResult.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Test result as written in report is required.',
      });
    }

    // Do not auto-diagnose: preserve user's entered clinical confirmation status
    const medicalTest = new MedicalTestRecord({
      userId: req.user._id,
      allergenName: allergenName.trim(),
      testType: testType.trim(),
      testDate: parsedDate,
      testResult: testResult.trim(),
      units: units ? units.trim() : '',
      isDoctorConfirmedDiagnosis: Boolean(isDoctorConfirmedDiagnosis),
      clinicalDiagnosisStatus:
        clinicalDiagnosisStatus ||
        (isDoctorConfirmedDiagnosis
          ? 'Doctor-Confirmed Diagnosis'
          : 'Recorded Test Result (Not yet confirmed)'),
      doctorNotes: doctorNotes ? doctorNotes.trim() : '',
      recordedReactionDetails: recordedReactionDetails ? recordedReactionDetails.trim() : '',
      clinicOrLabName: clinicOrLabName ? clinicOrLabName.trim() : '',
    });

    await medicalTest.save();

    return res.status(201).json({
      success: true,
      message: 'Medical test record saved successfully.',
      data: medicalTest,
    });
  } catch (error) {
    console.error('[Create Medical Test Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save medical test record.',
    });
  }
};

/**
 * Update a medical test record
 * PUT /api/medical-tests/:id
 */
export const updateMedicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      allergenName,
      testType,
      testDate,
      testResult,
      units,
      isDoctorConfirmedDiagnosis,
      clinicalDiagnosisStatus,
      doctorNotes,
      recordedReactionDetails,
      clinicOrLabName,
    } = req.body;

    // Strict ownership check
    const medicalTest = await MedicalTestRecord.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!medicalTest) {
      return res.status(404).json({
        success: false,
        message: 'Medical test record not found or unauthorized to edit.',
      });
    }

    if (allergenName) medicalTest.allergenName = allergenName.trim();
    if (testType) medicalTest.testType = testType.trim();
    if (testDate) {
      const parsed = new Date(testDate);
      if (isNaN(parsed.getTime()) || parsed > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Valid test date is required and cannot be in the future.',
        });
      }
      medicalTest.testDate = parsed;
    }
    if (testResult) medicalTest.testResult = testResult.trim();
    if (units !== undefined) medicalTest.units = units.trim();
    if (isDoctorConfirmedDiagnosis !== undefined) {
      medicalTest.isDoctorConfirmedDiagnosis = Boolean(isDoctorConfirmedDiagnosis);
    }
    if (clinicalDiagnosisStatus) {
      medicalTest.clinicalDiagnosisStatus = clinicalDiagnosisStatus;
    }
    if (doctorNotes !== undefined) medicalTest.doctorNotes = doctorNotes.trim();
    if (recordedReactionDetails !== undefined) {
      medicalTest.recordedReactionDetails = recordedReactionDetails.trim();
    }
    if (clinicOrLabName !== undefined) {
      medicalTest.clinicOrLabName = clinicOrLabName.trim();
    }

    await medicalTest.save();

    return res.status(200).json({
      success: true,
      message: 'Medical test record updated successfully.',
      data: medicalTest,
    });
  } catch (error) {
    console.error('[Update Medical Test Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update medical test record.',
    });
  }
};

/**
 * Delete a medical test record
 * DELETE /api/medical-tests/:id
 */
export const deleteMedicalTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Strict ownership check
    const medicalTest = await MedicalTestRecord.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!medicalTest) {
      return res.status(404).json({
        success: false,
        message: 'Medical test record not found or unauthorized to delete.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medical test record deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Medical Test Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete medical test record.',
    });
  }
};
