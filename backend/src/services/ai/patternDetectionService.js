/**
 * Statistical Pattern Detection & History Correlation Engine
 * Analyzes multi-day food consumption and symptom history for repeated associations.
 * Distinguishes:
 * - Single observation
 * - Repeated association (>= 2 occasions)
 * - Sensitization match (unconfirmed clinical allergy)
 * - Doctor-confirmed allergy trigger
 */

import { matchIngredientsToAllergens } from './clinicalKnowledgeBase.js';

export function detectFoodSymptomPatterns({
  foodEntries = [],
  symptomRecords = [],
  confirmedAllergies = [],
  suspectedAllergies = [],
  medicalTests = [],
}) {
  const patternsMap = new Map(); // Key: `${normalizedFoodName}:::${normalizedSymptomName}`
  const foodIncidentMap = new Map(); // Key: normalizedFoodName -> Array of incidents

  // Build lookup maps for user allergies and tests
  const confirmedAllergensList = confirmedAllergies.map((a) => a.allergenName.toLowerCase().trim());
  const suspectedAllergensList = suspectedAllergies.map((a) => a.allergenName.toLowerCase().trim());
  const positiveTestsList = medicalTests
    .filter((t) => {
      const res = String(t.testResult || '').toLowerCase();
      const val = parseFloat(res);
      return res.includes('positive') || val >= 0.35 || res.includes('wheal') || (t.isDoctorConfirmedDiagnosis);
    })
    .map((t) => (t.allergenName || '').toLowerCase().trim());

  // 1. Correlate symptoms to foods consumed within 0 to 6 hours or same day
  for (const symptom of symptomRecords) {
    const symptomDateStr = new Date(symptom.symptomDate).toISOString().split('T')[0];
    const symptomName = (symptom.symptomName || 'Unspecified Symptom').trim();

    // Check if symptom already has a direct food reference
    let candidateFoods = [];

    if (symptom.foodConsumed && symptom.foodConsumed.trim()) {
      candidateFoods.push({
        foodName: symptom.foodConsumed.trim(),
        consumptionDate: symptom.symptomDate,
        mealType: 'Reported with Symptom',
        ingredients: [],
      });
    }

    // Also look for foods consumed on the same date or within proximity
    const sameDayFoods = foodEntries.filter((f) => {
      const foodDateStr = new Date(f.consumptionDate).toISOString().split('T')[0];
      return foodDateStr === symptomDateStr;
    });

    for (const f of sameDayFoods) {
      if (!candidateFoods.some((cf) => cf.foodName.toLowerCase() === f.foodName.toLowerCase())) {
        candidateFoods.push(f);
      }
    }

    for (const food of candidateFoods) {
      const foodName = food.foodName.trim();
      const key = `${foodName.toLowerCase()}:::${symptomName.toLowerCase()}`;

      if (!patternsMap.has(key)) {
        patternsMap.set(key, {
          foodName,
          symptomName,
          occurrences: 0,
          dates: [],
          severities: [],
          onsetIntervals: [],
          ingredients: food.ingredients || [],
        });
      }

      const pattern = patternsMap.get(key);
      pattern.occurrences += 1;
      pattern.dates.push(symptomDateStr);
      if (symptom.symptomSeverity) pattern.severities.push(symptom.symptomSeverity);
      if (symptom.onsetInterval) pattern.onsetIntervals.push(symptom.onsetInterval);

      // Track by food
      if (!foodIncidentMap.has(foodName.toLowerCase())) {
        foodIncidentMap.set(foodName.toLowerCase(), {
          foodName,
          associatedSymptoms: new Set(),
          dates: new Set(),
        });
      }
      foodIncidentMap.get(foodName.toLowerCase()).associatedSymptoms.add(symptomName);
      foodIncidentMap.get(foodName.toLowerCase()).dates.add(symptomDateStr);
    }
  }

  // 2. Classify each detected pattern
  const detectedPatterns = [];
  const repeatedPatterns = [];

  for (const pattern of patternsMap.values()) {
    const foodLower = pattern.foodName.toLowerCase();
    const ingredientsLower = (pattern.ingredients || []).map((i) => String(i).toLowerCase());
    const matchedCategories = matchIngredientsToAllergens(pattern.foodName, pattern.ingredients);

    // Check relationship with user's medical records
    const isDoctorConfirmed = confirmedAllergensList.some((confirmed) => {
      return (
        foodLower.includes(confirmed) ||
        ingredientsLower.some((ing) => ing.includes(confirmed)) ||
        matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(confirmed))
      );
    });

    const isSuspected = suspectedAllergensList.some((susp) => {
      return (
        foodLower.includes(susp) ||
        ingredientsLower.some((ing) => ing.includes(susp)) ||
        matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(susp))
      );
    });

    const isSensitizationMatch = positiveTestsList.some((sens) => {
      return (
        foodLower.includes(sens) ||
        ingredientsLower.some((ing) => ing.includes(sens)) ||
        matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(sens))
      );
    });

    let associationClassification = 'Possible Association (Single Occurrence)';
    let clinicalRecommendation = 'Monitor food intake and keep note of symptoms.';

    if (isDoctorConfirmed) {
      associationClassification = 'Doctor-Confirmed Allergy Trigger';
      clinicalRecommendation =
        'High clinical priority: This food or its ingredients match an existing doctor-confirmed allergy. Follow your physician-prescribed allergen avoidance plan.';
    } else if (pattern.occurrences >= 2) {
      associationClassification = 'Repeated Association (Needs Review)';
      clinicalRecommendation = `Repeatedly observed across ${pattern.occurrences} separate occasions. Flagged for review with your allergist. Do not self-diagnose.`;
    } else if (isSensitizationMatch) {
      associationClassification = 'Sensitization Match (Unconfirmed Clinical Allergy)';
      clinicalRecommendation =
        'Matches a positive laboratory test finding. Note: sensitization does not prove clinical allergy without clinical reactivity. Discuss with your physician.';
    } else if (isSuspected) {
      associationClassification = 'Suspected Allergy Correlation';
      clinicalRecommendation = 'Correlates with an allergy previously suspected by you. Recommend formal medical testing.';
    }

    const uniqueDates = [...new Set(pattern.dates)];

    const patternObj = {
      foodName: pattern.foodName,
      symptomName: pattern.symptomName,
      occurrences: pattern.occurrences,
      occurrenceCount: pattern.occurrences,
      typicalOnset: pattern.onsetIntervals[0] || 'Intermediate (30 - 60 mins)',
      uniqueDaysCount: uniqueDates.length,
      dates: uniqueDates,
      severities: [...new Set(pattern.severities)],
      onsetIntervals: [...new Set(pattern.onsetIntervals)],
      associationClassification,
      clinicalRecommendation,
      clinicalNote: clinicalRecommendation,
      isRepeated: pattern.occurrences >= 2,
      isDoctorConfirmed,
    };

    detectedPatterns.push(patternObj);
    if (pattern.occurrences >= 2) {
      repeatedPatterns.push(patternObj);
    }
  }

  // Sort: Doctor-Confirmed first, then highest occurrence count, then newest
  detectedPatterns.sort((a, b) => {
    if (a.isDoctorConfirmed && !b.isDoctorConfirmed) return -1;
    if (!a.isDoctorConfirmed && b.isDoctorConfirmed) return 1;
    return b.occurrences - a.occurrences;
  });

  return {
    totalFoodsLogged: foodEntries.length,
    totalSymptomsLogged: symptomRecords.length,
    totalPatternsDetected: detectedPatterns.length,
    repeatedPatternsCount: repeatedPatterns.length,
    detectedPatterns,
    repeatedPatterns,
    repeatedAssociations: repeatedPatterns,
    associations: detectedPatterns,
    foodSummary: Array.from(foodIncidentMap.values()).map((f) => ({
      foodName: f.foodName,
      symptomsCount: f.associatedSymptoms.size,
      symptomsList: Array.from(f.associatedSymptoms),
      datesCount: f.dates.size,
    })),
  };
}
