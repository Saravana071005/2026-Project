/**
 * AI Personalized Analysis Engine
 * Multi-provider LLM service supporting Google Gemini API, OpenAI API, and Clinical Rule Fallback.
 * Configurable via environment variables (GEMINI_API_KEY, OPENAI_API_KEY, AI_PROVIDER).
 * Analyzes multi-factor relationships and strictly follows the 9-part medical response structure.
 */

import { checkEmergencySafety } from './medicalSafetyEngine.js';

/**
 * Deterministic Clinical Analysis Engine
 * Formulates high-fidelity 9-part structured analysis when external LLM APIs are unconfigured or unavailable.
 * Follows AAAAI/EAACI guidelines and all medical rules from the user specification.
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
  let consultationRationale =
    'Formal allergy evaluation with an allergist or immunologist is recommended to accurately interpret symptoms, perform validated testing if indicated, and establish an emergency action plan.';
  let urgency = emergencyCheck.isEmergency ? 'Immediate Emergency' : riskLevel === 'High' ? 'Prompt (Within 24-48h)' : 'Routine Follow-up';

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
 * Main AI Analysis Dispatcher
 * Calls Google Gemini API or OpenAI API when configured, otherwise cleanly falls back to the Clinical Rule Engine.
 */
export async function runPersonalizedAIAnalysis(analysisContext) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Pre-check for immediate emergency (zero-latency safety check)
  const allSymptomNames = (analysisContext.symptomRecords || []).map((s) => s.symptomName);
  const emergencyPreCheck = checkEmergencySafety(
    allSymptomNames,
    analysisContext.targetSymptom?.symptomSeverity || 'Moderate',
    analysisContext.targetSymptom?.additionalNotes || ''
  );

  // If live LLM API is configured, construct prompt and call
  if (provider === 'gemini' && geminiKey) {
    try {
      const geminiResult = await callGeminiAPI(analysisContext, geminiKey, emergencyPreCheck);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn('[AI Analysis] Gemini API call failed, using clinical rule engine fallback:', err.message);
    }
  } else if (provider === 'openai' && openaiKey) {
    try {
      const openaiResult = await callOpenAIAPI(analysisContext, openaiKey, emergencyPreCheck);
      if (openaiResult) return openaiResult;
    } catch (err) {
      console.warn('[AI Analysis] OpenAI API call failed, using clinical rule engine fallback:', err.message);
    }
  }

  // Use the verified Clinical Rules Engine
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

/**
 * Call Google Gemini API (gemini-1.5-flash / gemini-2.5-flash) via native fetch
 */
async function callGeminiAPI(context, apiKey, emergencyPreCheck) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const promptText = buildLLMPrompt(context, emergencyPreCheck);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // low temperature for consistent, cautious medical reasoning
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API responded with status ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty text in Gemini response');

  const parsed = JSON.parse(rawText);
  parsed.aiProvider = 'gemini';
  parsed.modelUsed = modelName;

  // Always enforce zero-delay emergency check
  if (emergencyPreCheck.isEmergency) {
    parsed.emergencyWarning = {
      isEmergency: true,
      message: emergencyPreCheck.emergencyMessage,
      actionPlan: emergencyPreCheck.actionPlan,
    };
    parsed.riskAssessment.level = 'Emergency / Severe';
  }

  return parsed;
}

/**
 * Call OpenAI API (gpt-4o-mini / gpt-4o) via native fetch
 */
async function callOpenAIAPI(context, apiKey, emergencyPreCheck) {
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const promptText = buildLLMPrompt(context, emergencyPreCheck);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Clinical Allergy Decision Support Engine adhering to AAAAI, EAACI, and NIAID guidelines. You provide clear, cautious food allergy and diet analysis. Return ONLY valid JSON adhering strictly to the requested schema. Never diagnose definitively, never prescribe, never advise home challenges.',
        },
        { role: 'user', content: promptText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API responded with status ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty text in OpenAI response');

  const parsed = JSON.parse(rawText);
  parsed.aiProvider = 'openai';
  parsed.modelUsed = modelName;

  if (emergencyPreCheck.isEmergency) {
    parsed.emergencyWarning = {
      isEmergency: true,
      message: emergencyPreCheck.emergencyMessage,
      actionPlan: emergencyPreCheck.actionPlan,
    };
    parsed.riskAssessment.level = 'Emergency / Severe';
  }

  return parsed;
}

/**
 * Constructs the standardized LLM prompt requesting the 9-part JSON structure.
 */
function buildLLMPrompt(context, emergencyPreCheck) {
  return `
Analyze the relationship between the patient's medical profile, daily food consumption, and reported symptoms.

PATIENT CONTEXT:
Name: ${context.user?.name || 'Patient'}
Age: ${context.user?.age || 'Unknown'}
Doctor-Confirmed Allergies: ${JSON.stringify(context.confirmedAllergies || [])}
Suspected Allergies: ${JSON.stringify(context.suspectedAllergies || [])}
Medical Test Records (sIgE, SPT, CRD): ${JSON.stringify(context.medicalTests || [])}
Food Consumption Log: ${JSON.stringify(context.foodEntries || [])}
Reported Symptoms: ${JSON.stringify(context.symptomRecords || [])}
Statistical Patterns Detected: ${JSON.stringify(context.patterns || {})}
Emergency Pre-Check Result: ${JSON.stringify(emergencyPreCheck)}

CRITICAL MEDICAL RULES:
1. SENSITIZATION != CLINICAL ALLERGY: A positive sIgE or SPT wheal indicates immunological sensitization, NOT definitive clinical allergy. Do not treat unconfirmed lab results as confirmed food allergies.
2. CAUSALITY CAVEAT: Never state that a food definitely caused a reaction based solely on temporal coincidence. Always consider co-ingredients, cross-contact, prep methods, and other potential causes.
3. WHEAT DIFFERENTIAL: Do not confuse wheat allergy (IgE-mediated rapid reaction) with Celiac Disease (autoimmune mucosal damage) or non-celiac gluten sensitivity.
4. MEDICAL SAFETY: Never advise deliberate home challenges or unguided elimination diets. Never prescribe medications.
5. EMERGENCY: If respiratory distress, airway swelling, or multi-system collapse is present, flag immediate emergency.

Return a JSON object with EXACTLY this structure:
{
  "foodConsumptionSummary": "string",
  "relevantMedicalProfile": "string",
  "detectedAssociations": [
    {
      "foodName": "string",
      "symptomName": "string",
      "associationStrength": "Doctor-Confirmed Allergy Trigger | Repeated Association (Needs Review) | Possible Association (Single Occurrence) | Sensitization Match (Unconfirmed Clinical Allergy)",
      "rationale": "string"
    }
  ],
  "possibleExplanations": ["string"],
  "riskAssessment": {
    "level": "Low | Moderate | High | Emergency / Severe",
    "supportingReasons": ["string"]
  },
  "missingInformation": ["string"],
  "safeNextSteps": ["string"],
  "medicalConsultationRecommended": {
    "recommended": boolean,
    "rationale": "string",
    "urgency": "Immediate Emergency | Prompt (Within 24-48h) | Routine Follow-up | Optional"
  },
  "emergencyWarning": {
    "isEmergency": boolean,
    "message": "string",
    "actionPlan": "string"
  }
}
`;
}
