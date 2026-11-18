/**
 * Clinical Health Relationship & Risk Analysis Engine
 * Deterministic clinical rules & statistical pattern evaluation adhering to AAAAI, EAACI, and NIAID protocols.
 * Formulates high-fidelity 9-part structured clinical analysis without any conversational LLMs or chatbots.
 */

import { checkEmergencySafety } from './medicalSafetyEngine.js';

/**
 * Deterministic Clinical Analysis Engine
 * Formulates high-fidelity 9-part structured analysis using patient clinical records,
 * food diary logs, reported symptoms, and detected statistical patterns.
 */
export function generateClinicalRuleAnalysis({
  user = {},
  confirmedAllergies = [],
  suspectedAllergies = [],
  medicalTests = [],
  foodEntries = [],
  symptomRecords = [],
  patterns = {},
  targetFood = null,
  targetSymptom = null,
}) {
  const patientName = user.name || 'Patient';
  const patientAge = user.age !== undefined && user.age !== null ? `${user.age} years old` : 'Age not recorded';

  // 1. Food Consumption Summary
  const foodsList = targetFood
    ? [targetFood]
    : foodEntries.length > 0
    ? foodEntries
    : [{ foodName: 'Unrecorded / General meal', ingredients: [] }];

  const foodSummaryText = foodsList
    .map((f) => {
      const ingText = f.ingredients && f.ingredients.length > 0 ? ` (Ingredients: ${f.ingredients.join(', ')})` : '';
      const prepText = f.preparationMethod ? ` [Prep: ${f.preparationMethod}]` : '';
      const meal = f.mealType ? ` for ${f.mealType}` : '';
      return `${f.foodName}${ingText}${prepText}${meal}`;
    })
    .join('; ');

  // 2. Relevant Medical Profile Information
  const confirmedList = confirmedAllergies.map((a) => a.allergenName);
  const suspectedList = suspectedAllergies.map((a) => a.allergenName);
  const testsList = medicalTests.map((t) => `${t.allergenName} (${t.testType}: ${t.testResult} ${t.units || ''})`);

  let medicalProfileSummary = `Patient ${patientName} (${patientAge}). `;
  if (confirmedList.length > 0) {
    medicalProfileSummary += `Doctor-Confirmed Allergies: ${confirmedList.join(', ')}. `;
  } else {
    medicalProfileSummary += 'No doctor-confirmed food allergies currently documented. ';
  }
  if (suspectedList.length > 0) {
    medicalProfileSummary += `Suspected/Precautionary Allergies: ${suspectedList.join(', ')}. `;
  }
  if (testsList.length > 0) {
    medicalProfileSummary += `Recorded Lab Findings: ${testsList.join(', ')}. Note: Laboratory sensitization alone does not equate to clinical food allergy.`;
  }

  // Check for immediate emergency symptoms
  const reportedSymptoms = targetSymptom
    ? [targetSymptom]
    : symptomRecords.length > 0
    ? symptomRecords
    : [];

  const allSymptomNames = reportedSymptoms.map((s) => s.symptomName || 'Unknown');
  const maxSeverity = reportedSymptoms.reduce((max, s) => {
    if (s.symptomSeverity === 'Life-Threatening / Emergency' || s.symptomSeverity === 'Severe') return 'Severe';
    if (s.symptomSeverity === 'Moderate' && max !== 'Severe') return 'Moderate';
    return max;
  }, 'Low');

  const allNotes = reportedSymptoms.map((s) => `${s.symptomName} ${s.additionalNotes || ''}`).join(' ');
  const emergencyCheck = checkEmergencySafety(allSymptomNames, maxSeverity, allNotes);

  // 3. Detected Food and Symptom Associations
  const detectedAssociations = [];
  const possibleExplanations = [];
  const missingInformation = [];
  const safeNextSteps = [];

  for (const food of foodsList) {
    const foodLower = food.foodName.toLowerCase();
    const ingredientsLower = (food.ingredients || []).map((i) => String(i).toLowerCase());

    for (const symp of reportedSymptoms) {
      const sympName = symp.symptomName;
      const onset = symp.onsetInterval || 'within 1-2 hours';

      // Check if food matches a confirmed allergy
      const matchingConfirmed = confirmedAllergies.find((a) => {
        const aName = a.allergenName.toLowerCase();
        return foodLower.includes(aName) || ingredientsLower.some((ing) => ing.includes(aName));
      });

      // Check if food matches a test finding (sensitization)
      const matchingTest = medicalTests.find((t) => {
        const tName = (t.allergenName || '').toLowerCase();
        return foodLower.includes(tName) || ingredientsLower.some((ing) => ing.includes(tName));
      });

      if (matchingConfirmed) {
        detectedAssociations.push({
          foodName: food.foodName,
          symptomName: sympName,
          associationStrength: 'Doctor-Confirmed Allergy Trigger',
          rationale: `"${matchingConfirmed.allergenName}" is recorded as a doctor-confirmed allergy in your medical profile. You consumed "${food.foodName}" and subsequently experienced ${sympName}. This temporal sequence is consistent with your documented clinical allergy.`,
        });

        possibleExplanations.push(
          `Primary Allergen Reaction: The consumed food contains or is associated with ${matchingConfirmed.allergenName}, matching your doctor-confirmed allergy. However, other culinary factors (preparation oils, cross-contact, hidden spices) could also contribute.`
        );

        // Special rule for wheat
        if (matchingConfirmed.allergenName.toLowerCase().includes('wheat')) {
          possibleExplanations.push(
            'Wheat Specific Differential: Your profile indicates an IgE-mediated wheat allergy. This is distinct from autoimmune Celiac Disease and non-allergic gluten sensitivity; it represents an immediate immunological mast cell response to wheat proteins.'
          );
        }
      } else if (matchingTest && !matchingConfirmed) {
        detectedAssociations.push({
          foodName: food.foodName,
          symptomName: sympName,
          associationStrength: 'Sensitization Match (Unconfirmed Clinical Allergy)',
          rationale: `"${matchingTest.allergenName}" has a positive laboratory test on file (${matchingTest.testType}: ${matchingTest.testResult}). You consumed "${food.foodName}" and reported ${sympName}. However, sensitization does not automatically confirm clinical allergy.`,
        });

        possibleExplanations.push(
          `Sensitization Correlation: You have a positive laboratory test for ${matchingTest.allergenName}. While this increases the statistical probability of a reaction, asymptomatic sensitization is common. A clinical evaluation is needed to determine true clinical reactivity.`
        );
      } else {
        detectedAssociations.push({
          foodName: food.foodName,
          symptomName: sympName,
          associationStrength:
            patterns.repeatedPatterns && patterns.repeatedPatterns.some((p) => p.foodName.toLowerCase() === foodLower)
              ? 'Repeated Association (Needs Review)'
              : 'Possible Association (Single Occurrence)',
          rationale: `You consumed "${food.foodName}" and reported ${sympName} (${onset}). There is currently no recorded doctor-confirmed allergy for this food in your profile.`,
        });

        possibleExplanations.push(
          `Unconfirmed Food Correlation: ${sympName} developed following ingestion of ${food.foodName}. Possible explanations include: (a) newly developing food allergy, (b) non-allergic food intolerance, (c) foodborne irritants or histamine-rich ingredients, or (d) incidental symptoms unrelated to this meal.`
        );
      }
    }
  }

  // Handle case where symptoms are reported without any food recorded
  if (foodsList.length === 0 || foodsList[0].foodName.includes('Unrecorded')) {
    possibleExplanations.push(
      'No specific food intake was recorded prior to symptom onset. Symptoms may stem from an untracked snack, environmental triggers, medication, or delayed food reactions from earlier meals.'
    );
    missingInformation.push('Exact foods, beverages, and ingredients consumed in the 2 to 4 hours preceding symptom onset.');
  }

  // Confounding factors & missing information
  missingInformation.push('Full list of secondary spices, cooking oils, and potential cross-contact in commercial preparation.');
  missingInformation.push('Concomitant factors such as vigorous exercise, alcohol, or NSAID medication (ibuprofen/aspirin) near mealtime.');

  // 5. Risk Assessment
  let riskLevel = 'Moderate';
  const supportingReasons = [];

  if (emergencyCheck.isEmergency) {
    riskLevel = 'Emergency / Severe';
    supportingReasons.push('Reported symptoms involve respiratory distress, airway tightness, or multi-system involvement.');
    supportingReasons.push('Immediate medical evaluation required to rule out anaphylaxis.');
  } else if (detectedAssociations.some((a) => a.associationStrength === 'Doctor-Confirmed Allergy Trigger')) {
    riskLevel = 'High';
    supportingReasons.push('Food consumed contains an ingredient matching an active doctor-confirmed allergy diagnosis.');
    supportingReasons.push('Patient requires close monitoring; potential for symptom progression.');
  } else if (patterns.repeatedPatternsCount > 0) {
    riskLevel = 'Moderate';
    supportingReasons.push('Statistical pattern detection identified repeated food-symptom associations across multiple occasions.');
  } else {
    riskLevel = 'Low';
    supportingReasons.push('No doctor-confirmed allergen matched; mild or localized single-system symptoms.');
  }

  // 7. Safe Next Steps
  if (emergencyCheck.isEmergency) {
    safeNextSteps.push('SEEK EMERGENCY CARE IMMEDIATELY (Call 911/112). Use prescribed epinephrine if available.');
  } else {
    safeNextSteps.push('Do NOT deliberately re-consume the suspected food to test for a reaction (avoid home food challenges).');
    safeNextSteps.push('Do NOT broadly eliminate multiple nutritious food groups without guidance from an allergist or registered dietitian.');
    safeNextSteps.push('Take photos of any cutaneous rashes or hives and note the exact time symptoms resolve for your doctor.');
    safeNextSteps.push('Continue tracking all meals, ingredients, and any subsequent reactions in your Daily Food Diary.');
  }

  // 8. Whether medical consultation is recommended
  const isConsultationRecommended = true;
  const consultationRationale =
    'Formal allergy evaluation with an allergist or immunologist is recommended to accurately interpret symptoms, perform validated testing if indicated, and establish an emergency action plan.';
  const urgency = emergencyCheck.isEmergency ? 'Immediate Emergency' : riskLevel === 'High' ? 'Prompt (Within 24-48h)' : 'Routine Follow-up';

  return {
    foodConsumptionSummary: foodSummaryText,
    relevantMedicalProfile: medicalProfileSummary,
    detectedAssociations,
    possibleExplanations,
    riskAssessment: {
      level: riskLevel,
      supportingReasons,
    },
    missingInformation,
    safeNextSteps,
    medicalConsultationRecommended: {
      recommended: isConsultationRecommended,
      rationale: consultationRationale,
      urgency,
    },
    emergencyWarning: {
      isEmergency: emergencyCheck.isEmergency,
      message: emergencyCheck.emergencyMessage,
      actionPlan: emergencyCheck.actionPlan,
    },
    aiProvider: 'clinical-rules-engine',
    modelUsed: 'Deterministic Medical Protocol v2026.1',
  };
}

/**
 * Main Health Relationship Analysis Dispatcher
 * Purely deterministic clinical rule & statistical dataset analysis engine.
 * Adheres strictly to AAAAI, EAACI, and NIAID clinical guidelines.
 */
export async function runPersonalizedAIAnalysis(analysisContext) {
  // Pre-check for immediate emergency (zero-latency safety check)
  const allSymptomNames = (analysisContext.symptomRecords || []).map((s) => s.symptomName);
  const emergencyPreCheck = checkEmergencySafety(
    allSymptomNames,
    analysisContext.targetSymptom?.symptomSeverity || 'Moderate',
    analysisContext.targetSymptom?.additionalNotes || ''
  );

  // Formulate deterministic clinical rule & pattern analysis
  const analysis = generateClinicalRuleAnalysis(analysisContext);
  if (emergencyPreCheck.isEmergency) {
    analysis.emergencyWarning = {
      isEmergency: true,
      message: emergencyPreCheck.emergencyMessage,
      actionPlan: emergencyPreCheck.actionPlan,
    };
    analysis.riskAssessment.level = 'Emergency / Severe';
  }
  return analysis;
}
