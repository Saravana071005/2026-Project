import DailyFoodEntry from '../models/DailyFoodEntry.js';
import AllergyRecord from '../models/AllergyRecord.js';
import MedicalTestRecord from '../models/MedicalTestRecord.js';
import { evaluateFoodSafety } from '../services/ai/dietMonitoringService.js';

/**
 * Retrieve food diary entries for the authenticated user
 * GET /api/food-diary
 * Optional query: ?date=YYYY-MM-DD, ?mealType=..., ?limit=...
 */
export const getFoodEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, mealType, startDate, endDate, limit } = req.query;

    const query = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.consumptionDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.consumptionDate = { $gte: start, $lte: end };
    }

    if (mealType) {
      query.mealType = mealType;
    }

    const maxResults = parseInt(limit, 10) || 100;
    const entries = await DailyFoodEntry.find(query)
      .sort({ consumptionDate: -1, consumptionTime: -1 })
      .limit(maxResults);

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('[Get Food Entries Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve food diary entries.',
    });
  }
};

/**
 * Retrieve a single food entry by ID
 * GET /api/food-diary/:id
 */
export const getFoodEntryById = async (req, res) => {
  try {
    const entry = await DailyFoodEntry.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Food diary entry not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('[Get Food Entry By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve food diary entry.',
    });
  }
};

/**
 * Add a new food entry (supports single item or array of items for a meal)
 * POST /api/food-diary
 */
export const createFoodEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const payload = req.body;

    // Fetch user's allergies and tests for automatic diet monitoring alert calculation
    const [allergies, tests] = await Promise.all([
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    // Handle single entry or batch entries
    const itemsToCreate = Array.isArray(payload.items) ? payload.items : [payload];
    const createdEntries = [];

    for (const item of itemsToCreate) {
      if (!item.foodName || !item.foodName.trim()) {
        continue;
      }

      // Run automatic diet safety evaluation
      const safetyEval = evaluateFoodSafety({
        foodName: item.foodName,
        ingredients: item.ingredients || [],
        confirmedAllergies,
        suspectedAllergies,
        medicalTests: tests,
      });

      const dietaryAlerts = safetyEval.alerts.map((a) => ({
        allergenName: a.allergenName,
        matchedIngredient: item.foodName,
        riskType: a.category,
        message: a.message,
      }));

      const newEntry = new DailyFoodEntry({
        userId,
        foodName: item.foodName.trim(),
        foodCategory: item.foodCategory || 'Mixed Dish / Traditional Recipe',
        mealType: item.mealType || payload.mealType || 'Breakfast',
        quantity: item.quantity !== undefined ? parseFloat(item.quantity) : 1,
        measurementUnit: item.measurementUnit || 'serving',
        ingredients: Array.isArray(item.ingredients)
          ? item.ingredients.map((i) => i.trim()).filter(Boolean)
          : typeof item.ingredients === 'string'
          ? item.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
          : [],
        preparationMethod: item.preparationMethod || '',
        consumptionDate: item.consumptionDate ? new Date(item.consumptionDate) : new Date(),
        consumptionTime: item.consumptionTime || '12:00',
        additionalNotes: item.additionalNotes || '',
        dietaryAlerts,
      });

      await newEntry.save();
      createdEntries.push(newEntry);
    }

    const primaryEntry = createdEntries[0];
    return res.status(201).json({
      success: true,
      message: 'Food diary entry saved successfully.',
      count: createdEntries.length,
      data: createdEntries.length === 1 ? primaryEntry : createdEntries,
      alerts: primaryEntry?.dietaryAlerts || [],
    });
  } catch (error) {
    console.error('[Create Food Entry Error]:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to save food diary entry.',
    });
  }
};

/**
 * Update an existing food diary entry
 * PUT /api/food-diary/:id
 */
export const updateFoodEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entry = await DailyFoodEntry.findOne({
      _id: req.params.id,
      userId,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Food diary entry not found or access denied.',
      });
    }

    const {
      foodName,
      foodCategory,
      mealType,
      quantity,
      measurementUnit,
      ingredients,
      preparationMethod,
      consumptionDate,
      consumptionTime,
      additionalNotes,
    } = req.body;

    if (foodName) entry.foodName = foodName.trim();
    if (foodCategory) entry.foodCategory = foodCategory;
    if (mealType) entry.mealType = mealType;
    if (quantity !== undefined) entry.quantity = parseFloat(quantity);
    if (measurementUnit) entry.measurementUnit = measurementUnit;
    if (ingredients !== undefined) {
      entry.ingredients = Array.isArray(ingredients)
        ? ingredients.map((i) => i.trim()).filter(Boolean)
        : typeof ingredients === 'string'
        ? ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : [];
    }
    if (preparationMethod !== undefined) entry.preparationMethod = preparationMethod;
    if (consumptionDate) entry.consumptionDate = new Date(consumptionDate);
    if (consumptionTime) entry.consumptionTime = consumptionTime;
    if (additionalNotes !== undefined) entry.additionalNotes = additionalNotes;

    // Re-evaluate diet safety alerts
    const [allergies, tests] = await Promise.all([
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    const safetyEval = evaluateFoodSafety({
      foodName: entry.foodName,
      ingredients: entry.ingredients,
      confirmedAllergies,
      suspectedAllergies,
      medicalTests: tests,
    });

    entry.dietaryAlerts = safetyEval.alerts.map((a) => ({
      allergenName: a.allergenName,
      matchedIngredient: entry.foodName,
      riskType: a.category,
      message: a.message,
    }));

    await entry.save();

    return res.status(200).json({
      success: true,
      message: 'Food diary entry updated successfully.',
      data: entry,
    });
  } catch (error) {
    console.error('[Update Food Entry Error]:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update food diary entry.',
    });
  }
};

/**
 * Delete a food diary entry
 * DELETE /api/food-diary/:id
 */
export const deleteFoodEntry = async (req, res) => {
  try {
    const entry = await DailyFoodEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Food diary entry not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food diary entry deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Food Entry Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete food diary entry.',
    });
  }
};

/**
 * Calendar Summary: Returns days that have entries and meal breakdowns
 * GET /api/food-diary/calendar-summary
 */
export const getCalendarSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await DailyFoodEntry.find({ userId })
      .select('foodName mealType consumptionDate dietaryAlerts')
      .sort({ consumptionDate: -1 });

    const summaryByDate = {};
    for (const e of entries) {
      const dateKey = new Date(e.consumptionDate).toISOString().split('T')[0];
      if (!summaryByDate[dateKey]) {
        summaryByDate[dateKey] = {
          date: dateKey,
          totalItems: 0,
          meals: new Set(),
          hasAllergenAlert: false,
        };
      }
      summaryByDate[dateKey].totalItems += 1;
      summaryByDate[dateKey].meals.add(e.mealType);
      if (e.dietaryAlerts && e.dietaryAlerts.length > 0) {
        summaryByDate[dateKey].hasAllergenAlert = true;
      }
    }

    const result = Object.values(summaryByDate).map((s) => ({
      ...s,
      meals: Array.from(s.meals),
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Calendar Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar summary.',
    });
  }
};
