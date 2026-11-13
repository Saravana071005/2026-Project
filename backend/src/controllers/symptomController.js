import SymptomRecord from '../models/SymptomRecord.js';
import DailyFoodEntry from '../models/DailyFoodEntry.js';
import { checkEmergencySafety } from '../services/ai/medicalSafetyEngine.js';

/**
 * Retrieve all symptom records for the authenticated user
 * GET /api/symptoms
 */
export const getSymptoms = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, category, severity, limit } = req.query;

    const query = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.symptomDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (category) {
      query.symptomCategory = category;
    }

    if (severity) {
      query.symptomSeverity = severity;
    }

    const maxResults = parseInt(limit, 10) || 100;
    const symptoms = await SymptomRecord.find(query)
      .populate('foodEntryId', 'foodName mealType ingredients consumptionDate')
      .sort({ symptomDate: -1, symptomStartTime: -1 })
      .limit(maxResults);

    return res.status(200).json({
      success: true,
      count: symptoms.length,
      data: symptoms,
    });
  } catch (error) {
    console.error('[Get Symptoms Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve symptom records.',
    });
  }
};

/**
 * Retrieve single symptom by ID
 * GET /api/symptoms/:id
 */
export const getSymptomById = async (req, res) => {
  try {
    const symptom = await SymptomRecord.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('foodEntryId');

    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: symptom,
    });
  } catch (error) {
    console.error('[Get Symptom By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve symptom record.',
    });
  }
};

/**
 * Real-time Emergency Pre-Check Endpoint
 * POST /api/symptoms/check-emergency
 * Allows frontend to check symptoms in real-time as user types/selects before submitting
 */
export const checkEmergencyPreCheck = async (req, res) => {
  try {
    const { symptomName, symptomSeverity, additionalSymptoms = [], notes = '', symptoms = [] } = req.body;
    const sympList = [];
    let severity = symptomSeverity || 'Moderate';

    if (Array.isArray(symptoms) && symptoms.length > 0) {
      for (const s of symptoms) {
        if (typeof s === 'string') {
          sympList.push(s);
        } else if (s && typeof s === 'object') {
          if (s.symptomName) sympList.push(s.symptomName);
          if (s.symptomSeverity === 'Life-Threatening / Emergency' || s.symptomSeverity === 'Severe') {
            severity = 'Severe';
          }
        }
      }
    }

    if (symptomName) sympList.push(symptomName);
    if (Array.isArray(additionalSymptoms)) sympList.push(...additionalSymptoms);

    const safetyResult = checkEmergencySafety(sympList, severity, notes);

    return res.status(200).json({
      success: true,
      data: safetyResult,
      emergencyCheck: safetyResult,
    });
  } catch (error) {
    console.error('[Emergency Pre-Check Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform emergency pre-check.',
    });
  }
};

/**
 * Record a new symptom event
 * POST /api/symptoms
 */
export const createSymptom = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      foodEntryId,
      foodConsumed,
      consumptionDateTime,
      symptomName,
      symptomCategory,
      symptomSeverity,
      symptomDate,
      symptomStartTime,
      onsetInterval,
      symptomDuration,
      additionalSymptoms,
      treatmentTaken,
      medicalAttentionRequired,
      medicalFacilityVisited,
      additionalNotes,
    } = req.body;

    if (!symptomName || !symptomName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Primary symptom name is required.',
      });
    }

    // Immediate Zero-Latency Emergency Evaluation
    const allSymptoms = [
      symptomName,
      ...(Array.isArray(additionalSymptoms) ? additionalSymptoms : []),
    ].filter(Boolean);

    const emergencyCheck = checkEmergencySafety(
      allSymptoms,
      symptomSeverity || 'Moderate',
      additionalNotes || ''
    );

    // If linked to a food entry, verify it belongs to this user
    let verifiedFoodEntryId = null;
    let resolvedFoodName = (foodConsumed || '').trim();

    if (foodEntryId) {
      const foodEntry = await DailyFoodEntry.findOne({ _id: foodEntryId, userId });
      if (foodEntry) {
        verifiedFoodEntryId = foodEntry._id;
        if (!resolvedFoodName) resolvedFoodName = foodEntry.foodName;
      }
    }

    const newSymptom = new SymptomRecord({
      userId,
      foodEntryId: verifiedFoodEntryId,
      foodConsumed: resolvedFoodName,
      consumptionDateTime: consumptionDateTime ? new Date(consumptionDateTime) : null,
      symptomName: symptomName.trim(),
      symptomCategory: symptomCategory || 'Skin',
      symptomSeverity: symptomSeverity || 'Moderate',
      symptomDate: symptomDate ? new Date(symptomDate) : new Date(),
      symptomStartTime: symptomStartTime || '12:00',
      onsetInterval: onsetInterval || 'Intermediate (30 - 60 mins)',
      symptomDuration: symptomDuration || '',
      additionalSymptoms: Array.isArray(additionalSymptoms)
        ? additionalSymptoms.map((s) => s.trim()).filter(Boolean)
        : [],
      treatmentTaken: treatmentTaken || 'None',
      medicalAttentionRequired: Boolean(medicalAttentionRequired),
      medicalFacilityVisited: medicalFacilityVisited || '',
      additionalNotes: additionalNotes || '',
      isEmergencyAlertTriggered: emergencyCheck.isEmergency,
      emergencyAlertDetails: emergencyCheck.isEmergency ? emergencyCheck.emergencyMessage : '',
    });

    await newSymptom.save();

    return res.status(201).json({
      success: true,
      message: emergencyCheck.isEmergency
        ? 'Symptom recorded. CRITICAL EMERGENCY WARNING: Please review immediate action plan.'
        : 'Symptom recorded successfully.',
      data: newSymptom,
      emergencyAlert: emergencyCheck.isEmergency ? emergencyCheck : null,
    });
  } catch (error) {
    console.error('[Create Symptom Error]:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to save symptom record.',
    });
  }
};

/**
 * Update a symptom record
 * PUT /api/symptoms/:id
 */
export const updateSymptom = async (req, res) => {
  try {
    const userId = req.user._id;
    const symptom = await SymptomRecord.findOne({
      _id: req.params.id,
      userId,
    });

    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom record not found or access denied.',
      });
    }

    const {
      foodConsumed,
      symptomName,
      symptomCategory,
      symptomSeverity,
      symptomDate,
      symptomStartTime,
      onsetInterval,
      symptomDuration,
      additionalSymptoms,
      treatmentTaken,
      medicalAttentionRequired,
      medicalFacilityVisited,
      additionalNotes,
    } = req.body;

    if (foodConsumed !== undefined) symptom.foodConsumed = foodConsumed.trim();
    if (symptomName) symptom.symptomName = symptomName.trim();
    if (symptomCategory) symptom.symptomCategory = symptomCategory;
    if (symptomSeverity) symptom.symptomSeverity = symptomSeverity;
    if (symptomDate) symptom.symptomDate = new Date(symptomDate);
    if (symptomStartTime) symptom.symptomStartTime = symptomStartTime;
    if (onsetInterval) symptom.onsetInterval = onsetInterval;
    if (symptomDuration !== undefined) symptom.symptomDuration = symptomDuration;
    if (additionalSymptoms !== undefined) {
      symptom.additionalSymptoms = Array.isArray(additionalSymptoms)
        ? additionalSymptoms.map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (treatmentTaken !== undefined) symptom.treatmentTaken = treatmentTaken;
    if (medicalAttentionRequired !== undefined) symptom.medicalAttentionRequired = Boolean(medicalAttentionRequired);
    if (medicalFacilityVisited !== undefined) symptom.medicalFacilityVisited = medicalFacilityVisited;
    if (additionalNotes !== undefined) symptom.additionalNotes = additionalNotes;

    // Re-check emergency status
    const allSymptoms = [
      symptom.symptomName,
      ...(Array.isArray(symptom.additionalSymptoms) ? symptom.additionalSymptoms : []),
    ].filter(Boolean);

    const emergencyCheck = checkEmergencySafety(
      allSymptoms,
      symptom.symptomSeverity,
      symptom.additionalNotes
    );

    symptom.isEmergencyAlertTriggered = emergencyCheck.isEmergency;
    symptom.emergencyAlertDetails = emergencyCheck.isEmergency ? emergencyCheck.emergencyMessage : '';

    await symptom.save();

    return res.status(200).json({
      success: true,
      message: 'Symptom record updated successfully.',
      data: symptom,
      emergencyAlert: emergencyCheck.isEmergency ? emergencyCheck : null,
    });
  } catch (error) {
    console.error('[Update Symptom Error]:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update symptom record.',
    });
  }
};

/**
 * Delete a symptom record
 * DELETE /api/symptoms/:id
 */
export const deleteSymptom = async (req, res) => {
  try {
    const symptom = await SymptomRecord.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Symptom record deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Symptom Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete symptom record.',
    });
  }
};
