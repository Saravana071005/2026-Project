import AIAnalysisRecord from '../models/AIAnalysisRecord.js';
import DailyFoodEntry from '../models/DailyFoodEntry.js';
import SymptomRecord from '../models/SymptomRecord.js';
import AllergyRecord from '../models/AllergyRecord.js';
import MedicalTestRecord from '../models/MedicalTestRecord.js';
import User from '../models/User.js';
import { runPersonalizedAIAnalysis } from '../services/ai/aiAnalysisService.js';
import { detectFoodSymptomPatterns } from '../services/ai/patternDetectionService.js';
import { evaluateFoodSafety } from '../services/ai/dietMonitoringService.js';

/**
 * Trigger personalized AI relationship analysis
 * POST /api/ai-analysis/analyze
 */
export const runAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      foodEntryId,
      foodEntryIds,
      symptomRecordId,
      symptomRecordIds,
      targetFood,
      targetSymptom,
      userNotes,
      targetType = 'symptom_event',
    } = req.body;

    // 1. Fetch user's complete medical context
    const [userDoc, allergies, tests, allFoods, allSymptoms] = await Promise.all([
      User.findById(userId).select('name age dob email sex'),
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }).sort({ testDate: -1 }),
      DailyFoodEntry.find({ userId }).sort({ consumptionDate: -1 }),
      SymptomRecord.find({ userId }).sort({ symptomDate: -1 }),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    // 2. Identify target food(s) and symptom(s)
    let selectedFoods = [];
    if (foodEntryId) {
      const match = allFoods.find((f) => f._id.toString() === foodEntryId);
      if (match) selectedFoods.push(match);
    } else if (Array.isArray(foodEntryIds) && foodEntryIds.length > 0) {
      selectedFoods = allFoods.filter((f) => foodEntryIds.includes(f._id.toString()));
    } else if (targetFood) {
      selectedFoods = [
        {
          foodName: targetFood.foodName || 'Target Food',
          foodCategory: targetFood.foodCategory || 'Mixed Dish / Traditional Recipe',
          ingredients: Array.isArray(targetFood.ingredients) ? targetFood.ingredients : [],
          preparationMethod: targetFood.preparationMethod || '',
          mealType: targetFood.mealType || 'Meal',
        },
      ];
    } else {
      selectedFoods = allFoods.slice(0, 5); // recent meals
    }

    let selectedSymptoms = [];
    if (symptomRecordId) {
      const match = allSymptoms.find((s) => s._id.toString() === symptomRecordId);
      if (match) selectedSymptoms.push(match);
    } else if (Array.isArray(symptomRecordIds) && symptomRecordIds.length > 0) {
      selectedSymptoms = allSymptoms.filter((s) => symptomRecordIds.includes(s._id.toString()));
    } else if (targetSymptom) {
      selectedSymptoms = [
        {
          symptomName: targetSymptom.symptomName || 'Reported Symptom',
          symptomCategory: targetSymptom.symptomCategory || 'Skin',
          symptomSeverity: targetSymptom.symptomSeverity || 'Moderate',
          onsetInterval: targetSymptom.onsetInterval || 'Intermediate (30 - 60 mins)',
          additionalNotes: targetSymptom.additionalNotes || '',
        },
      ];
    } else if (allSymptoms.length > 0) {
      selectedSymptoms = [allSymptoms[0]]; // most recent symptom
    }

    // 3. Run Statistical Pattern Detection
    const patterns = detectFoodSymptomPatterns({
      foodEntries: allFoods,
      symptomRecords: allSymptoms,
      confirmedAllergies,
      suspectedAllergies,
      medicalTests: tests,
    });

    // 4. Run AI Personalized Relationship Analysis
    const analysisContext = {
      user: {
        name: userDoc?.name || req.user.name,
        age: userDoc?.age ?? req.user.age,
        dob: userDoc?.dob,
      },
      confirmedAllergies,
      suspectedAllergies,
      medicalTests: tests,
      foodEntries: selectedFoods,
      symptomRecords: selectedSymptoms,
      patterns,
      targetFood: selectedFoods.length === 1 ? selectedFoods[0] : null,
      targetSymptom: selectedSymptoms.length === 1 ? selectedSymptoms[0] : null,
    };

    const aiResult = await runPersonalizedAIAnalysis(analysisContext);

    // 5. Save the analysis result in MongoDB Atlas
    const newRecord = new AIAnalysisRecord({
      userId,
      targetType,
      foodEntryIds: selectedFoods.filter((f) => f._id).map((f) => f._id),
      symptomRecordIds: selectedSymptoms.filter((s) => s._id).map((s) => s._id),
      relatedAllergyRecordIds: confirmedAllergies.map((a) => a._id),
      relatedMedicalTestIds: tests.map((t) => t._id),
      foodConsumptionSummary: aiResult.foodConsumptionSummary,
      relevantMedicalProfile: aiResult.relevantMedicalProfile,
      detectedAssociations: aiResult.detectedAssociations || [],
      possibleExplanations: aiResult.possibleExplanations || [],
      riskAssessment: aiResult.riskAssessment || { level: 'Moderate', supportingReasons: [] },
      missingInformation: aiResult.missingInformation || [],
      safeNextSteps: aiResult.safeNextSteps || [],
      medicalConsultationRecommended: aiResult.medicalConsultationRecommended || {
        recommended: true,
        rationale: 'Consult an allergist for confirmation.',
        urgency: 'Routine Follow-up',
      },
      emergencyWarning: aiResult.emergencyWarning || { isEmergency: false, message: '', actionPlan: '' },
      aiProvider: aiResult.aiProvider || 'system',
      modelUsed: aiResult.modelUsed || '',
      rawAIResponse: aiResult,
      userNotes: userNotes || '',
    });

    await newRecord.save();

    return res.status(201).json({
      success: true,
      message: 'AI personalized diet and allergy analysis generated successfully.',
      data: newRecord,
    });
  } catch (error) {
    console.error('[Run AI Analysis Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete AI food allergy analysis.',
    });
  }
};

/**
 * Retrieve analysis history for authenticated user
 * GET /api/ai-analysis/history
 */
export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await AIAnalysisRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('[Get Analysis History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis history.',
    });
  }
};

/**
 * Retrieve single analysis record by ID
 * GET /api/ai-analysis/:id
 */
export const getAnalysisById = async (req, res) => {
  try {
    const record = await AIAnalysisRecord.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('[Get Analysis By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis record.',
    });
  }
};

/**
 * Delete analysis record
 * DELETE /api/ai-analysis/:id
 */
export const deleteAnalysis = async (req, res) => {
  try {
    const record = await AIAnalysisRecord.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis record deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Analysis Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete analysis record.',
    });
  }
};

/**
 * Personalized Diet Monitoring Overview
 * GET /api/ai-analysis/diet-monitoring
 * Evaluates current foods or queried food against confirmed allergies and test findings
 */
export const getDietMonitoring = async (req, res) => {
  try {
    const userId = req.user._id;
    const { foodName, ingredients } = req.query;

    const [allergies, tests, recentFoods] = await Promise.all([
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }),
      DailyFoodEntry.find({ userId }).sort({ consumptionDate: -1 }).limit(10),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    if (foodName) {
      // Evaluate specific queried food
      const ingArray = ingredients ? ingredients.split(',').map((i) => i.trim()) : [];
      const evaluation = evaluateFoodSafety({
        foodName,
        ingredients: ingArray,
        confirmedAllergies,
        suspectedAllergies,
        medicalTests: tests,
      });

      return res.status(200).json({
        success: true,
        data: evaluation,
      });
    }

    // Evaluate all recent foods
    const evaluations = recentFoods.map((f) => {
      return evaluateFoodSafety({
        foodName: f.foodName,
        ingredients: f.ingredients,
        confirmedAllergies,
        suspectedAllergies,
        medicalTests: tests,
      });
    });

    const flaggedFoods = evaluations.filter((e) => e.hasAlerts);

    return res.status(200).json({
      success: true,
      data: {
        totalEvaluated: evaluations.length,
        flaggedCount: flaggedFoods.length,
        flaggedFoods,
        allRecentEvaluations: evaluations,
        confirmedAllergiesCount: confirmedAllergies.length,
        medicalTestsCount: tests.length,
      },
    });
  } catch (error) {
    console.error('[Diet Monitoring Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve diet monitoring assessment.',
    });
  }
};

/**
 * Statistical Food-Symptom Pattern Detection
 * GET /api/ai-analysis/patterns
 */
export const getPatterns = async (req, res) => {
  try {
    const userId = req.user._id;

    const [allergies, tests, allFoods, allSymptoms] = await Promise.all([
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }),
      DailyFoodEntry.find({ userId }).sort({ consumptionDate: -1 }),
      SymptomRecord.find({ userId }).sort({ symptomDate: -1 }),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    const patterns = detectFoodSymptomPatterns({
      foodEntries: allFoods,
      symptomRecords: allSymptoms,
      confirmedAllergies,
      suspectedAllergies,
      medicalTests: tests,
    });

    return res.status(200).json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    console.error('[Get Patterns Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze food-symptom patterns.',
    });
  }
};
