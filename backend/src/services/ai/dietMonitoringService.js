/**
 * Personalized Diet Monitoring Service
 * Evaluates food items and daily meal logs against:
 * 1. Doctor-confirmed allergies
 * 2. Documented sensitivities and suspected allergies
 * 3. Historical food reactions
 * 4. Medical test findings (sensitization without clinical confirmation)
 */

import { matchIngredientsToAllergens } from './clinicalKnowledgeBase.js';

export function evaluateFoodSafety({
  foodName = '',
  ingredients = [],
  confirmedAllergies = [],
  suspectedAllergies = [],
  medicalTests = [],
  previousReactions = [],
}) {
  const alerts = [];
  const normalizedFoodName = foodName.toLowerCase().trim();
  const normalizedIngredients = (ingredients || []).map((i) => String(i).toLowerCase().trim());
  const matchedCategories = matchIngredientsToAllergens(foodName, ingredients);

  // 1. Check against Doctor-Confirmed Allergies (CRITICAL)
  for (const allergy of confirmedAllergies) {
    const allergen = allergy.allergenName.toLowerCase().trim();
    const isDirectMatch =
      normalizedFoodName.includes(allergen) ||
      normalizedIngredients.some((ing) => ing.includes(allergen)) ||
      matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(allergen));

    if (isDirectMatch) {
      alerts.push({
        riskLevel: 'CRITICAL',
        category: 'Doctor-Confirmed Allergy',
        allergenName: allergy.allergenName,
        message: `This food (${foodName}) contains or is associated with "${allergy.allergenName}", which is a DOCTOR-CONFIRMED allergy in your profile. Review ingredients thoroughly and follow your physician's strict avoidance instructions.`,
        actionRecommended: 'Strict avoidance recommended per your physician treatment plan.',
        emergencyMedication: allergy.emergencyMedication || 'Check with your physician',
      });
    }
  }

  // 2. Check against Suspected Allergies / Patient History (WARNING)
  for (const allergy of suspectedAllergies) {
    const allergen = allergy.allergenName.toLowerCase().trim();
    const isMatch =
      normalizedFoodName.includes(allergen) ||
      normalizedIngredients.some((ing) => ing.includes(allergen)) ||
      matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(allergen));

    if (isMatch) {
      alerts.push({
        riskLevel: 'WARNING',
        category: 'Suspected / Patient History',
        allergenName: allergy.allergenName,
        message: `This food contains or is associated with "${allergy.allergenName}", which is recorded as a suspected allergy in your history. Consume with caution and consult your doctor for formal diagnostic testing.`,
        actionRecommended: 'Precautionary observation; consult an allergist for definitive testing.',
      });
    }
  }

  // 3. Check against Medical Tests / Sensitization findings (CAUTION)
  // RULE: Do not automatically mark every food as unsafe merely because it contains an ingredient associated with a positive sensitization test.
  for (const test of medicalTests) {
    // Only flag if not already covered by a doctor-confirmed allergy
    const testAllergen = (test.allergenName || '').toLowerCase().trim();
    const alreadyConfirmed = alerts.some((a) => a.allergenName.toLowerCase().trim() === testAllergen);

    if (!alreadyConfirmed) {
      const isTestMatch =
        normalizedFoodName.includes(testAllergen) ||
        normalizedIngredients.some((ing) => ing.includes(testAllergen)) ||
        matchedCategories.some((mc) => mc.allergenName.toLowerCase().includes(testAllergen));

      if (isTestMatch) {
        alerts.push({
          riskLevel: 'CAUTION',
          category: 'Sensitization Finding (Unconfirmed Clinical Allergy)',
          allergenName: test.allergenName,
          testType: test.testType,
          testResult: test.testResult,
          message: `Your medical records contain a positive test finding for "${test.allergenName}" (${test.testType}: ${test.testResult} ${test.units || ''}). Note: Immunological sensitization does not automatically mean clinical allergy without documented symptoms. Discuss with your doctor before needlessly eliminating this food.`,
          actionRecommended: 'Observe for any symptoms; discuss test significance with your doctor before eliminating.',
        });
      }
    }
  }

  // 4. Check against Previous Reactions history
  for (const prev of previousReactions) {
    const prevFood = (prev.foodName || prev.foodConsumed || '').toLowerCase().trim();
    if (prevFood && normalizedFoodName.includes(prevFood)) {
      const alreadyFlagged = alerts.some((a) => a.category.includes('Previous Reaction'));
      if (!alreadyFlagged) {
        alerts.push({
          riskLevel: 'ADVISORY',
          category: 'Previous Reported Reaction',
          allergenName: prevFood,
          message: `You previously reported symptoms after consuming "${prevFood}" on ${prev.date || 'a previous occasion'}.`,
          actionRecommended: 'Keep a record of your reaction history for your next allergy consultation.',
        });
      }
    }
  }

  // Determine overall safety status
  let overallSafetyStatus = 'Safe / No Known Conflicts';
  if (alerts.some((a) => a.riskLevel === 'CRITICAL')) {
    overallSafetyStatus = 'CRITICAL ALERT - Confirmed Allergen Detected';
  } else if (alerts.some((a) => a.riskLevel === 'WARNING')) {
    overallSafetyStatus = 'WARNING - Suspected Allergen Detected';
  } else if (alerts.some((a) => a.riskLevel === 'CAUTION')) {
    overallSafetyStatus = 'CAUTION - Sensitization Match (Unconfirmed)';
  } else if (alerts.some((a) => a.riskLevel === 'ADVISORY')) {
    overallSafetyStatus = 'ADVISORY - Previous Reaction History';
  }

  return {
    foodName,
    overallSafetyStatus,
    hasAlerts: alerts.length > 0,
    alertsCount: alerts.length,
    alerts,
  };
}
