/**
 * Medical Safety & Emergency Detection Engine
 * Strictly follows NIAID / EAACI / AAAAI guidelines for immediate anaphylaxis detection.
 * Provides ZERO-LATENCY emergency alerts before and independent of any LLM processing.
 */

// Critical red flag keywords and symptoms that indicate potential anaphylaxis or severe reaction
const EMERGENCY_SYMPTOM_PATTERNS = [
  /\b(?:difficulty\s*breathing|trouble\s*breathing|short(?:ness)?\s*of\s*breath|dyspnea|can(?:not|'t)\s*breathe|hard\s*to\s*breathe|unable\s*to\s*breathe|struggling\s*to\s*breathe|chok(?:ing|e))\b/i,
  /\b(?:wheez(?:ing|e)|stridor|gasping)\b/i,
  /\b(?:throat\s*(?:is\s*)?(?:tight(?:ness)?|closing|swelling|swollen|constriction)|tight\s*throat|swelling\s*(?:in|of)?\s*(?:my\s*)?throat)\b/i,
  /\b(?:tongue\s*(?:is\s*)?(?:swelling|swollen)|swollen\s*tongue|lip\s*(?:is\s*)?(?:swelling|swollen)|angioedema)\b/i,
  /\b(?:faint(?:ing|ed|ness)?|collaps(?:e|ed)|unconscious(?:ness)?|loss\s*of\s*consciousness)\b/i,
  /\b(?:dizziness\s*with\s*(?:hives|rash|swelling)|hypotension|low\s*blood\s*pressure)\b/i,
  /\b(?:anaphylax(?:is|tic))\b/i,
  /\b(?:blue\s*lips|cyanosis|pale\s*and\s*clammy)\b/i,
];

// Multi-system combinations indicating anaphylaxis (e.g., skin + respiratory, or skin + gastrointestinal)
const SYSTEM_CATEGORIES = {
  skin: ['itching', 'hives', 'urticaria', 'rash', 'rashes', 'redness', 'flushing', 'swelling'],
  respiratory: ['wheezing', 'cough', 'breathing difficulty', 'difficulty breathing', 'throat tightness', 'stridor', 'nasal congestion'],
  digestive: ['stomach pain', 'cramps', 'nausea', 'vomiting', 'diarrhea', 'bloating'],
  neurological_systemic: ['dizziness', 'faintness', 'confusion', 'collapse', 'feeling of doom', 'hypotension'],
};

/**
 * Checks an array of symptom strings or an event description for immediate emergency red flags.
 * Returns an immediate emergency assessment without calling an external API.
 */
export function checkEmergencySafety(symptoms = [], severity = 'Moderate', notes = '') {
  const combinedText = [
    ...(Array.isArray(symptoms) ? symptoms : [symptoms]),
    severity || '',
    notes || '',
  ].join(' ').toLowerCase();

  const detectedRedFlags = [];

  // Check specific emergency regex patterns
  for (const pattern of EMERGENCY_SYMPTOM_PATTERNS) {
    if (pattern.test(combinedText)) {
      const match = combinedText.match(pattern);
      if (match && !detectedRedFlags.includes(match[0])) {
        detectedRedFlags.push(match[0]);
      }
    }
  }

  // Check severity level
  const isLifeThreateningSeverity =
    severity === 'Life-Threatening / Emergency' ||
    severity === 'Life-Threatening' ||
    severity === 'Severe';

  // Check multi-system involvement (Involvement of >= 2 organ systems after allergen exposure)
  const involvedSystems = [];
  for (const [systemName, keywords] of Object.entries(SYSTEM_CATEGORIES)) {
    const matched = keywords.some((kw) => combinedText.includes(kw));
    if (matched) {
      involvedSystems.push(systemName);
    }
  }

  const isMultiSystemReaction = involvedSystems.length >= 2;

  const isEmergency =
    detectedRedFlags.length > 0 ||
    isLifeThreateningSeverity ||
    (isMultiSystemReaction && (involvedSystems.includes('respiratory') || involvedSystems.includes('neurological_systemic')));

  if (isEmergency) {
    return {
      isEmergency: true,
      urgency: 'Immediate Emergency',
      severityLevel: 'Emergency / Severe',
      detectedRedFlags,
      involvedSystems,
      emergencyMessage:
        'CRITICAL MEDICAL ALERT: The reported symptoms indicate a potential severe allergic reaction or anaphylaxis.',
      actionPlan:
        '1. Call emergency services (911 / 112 / your local emergency number) immediately.\n' +
        '2. If you have been prescribed an epinephrine auto-injector (EpiPen, Auvi-Q), use it without delay as instructed by your doctor.\n' +
        '3. Lie down with legs elevated; if breathing is difficult, sit up. Do not stand or walk.\n' +
        '4. Stay with someone and await emergency medical responders. Do not rely solely on oral antihistamines for respiratory distress.',
      medicalDisclaimer:
        'This automated safety notice is a precautionary medical decision support alert based on international allergy emergency protocols (AAAAI/EAACI) and is not a substitute for emergency medical care.',
    };
  }

  return {
    isEmergency: false,
    urgency: isLifeThreateningSeverity ? 'Prompt (Within 24-48h)' : 'Routine Follow-up',
    severityLevel: severity === 'Moderate' ? 'Moderate' : 'Low',
    detectedRedFlags: [],
    involvedSystems,
    emergencyMessage: '',
    actionPlan:
      'Monitor your symptoms closely. If breathing difficulty, throat tightness, or swelling develops, seek emergency medical care immediately.',
    medicalDisclaimer:
      'Information provided is for food diary and diet monitoring purposes only. Always consult a qualified allergist for clinical diagnosis.',
  };
}

/**
 * Standard non-emergency clinical guidance guardrails.
 * Enforces that no autonomous medical treatment, unprescribed food elimination, or home challenges are recommended.
 */
export const CLINICAL_SAFETY_GUARDRAILS = {
  disclaimer:
    'This system provides dietary monitoring and observational decision support. It does not provide medical diagnoses or replace consultations with licensed physicians.',
  strictGuidelines: [
    'Do not prescribe or alter prescription medications or epinephrine regimens.',
    'Do not advise users to deliberately consume suspected allergens or perform home food challenges.',
    'Do not recommend broad unguided elimination diets that can cause nutritional deficiencies without professional supervision.',
    'Strictly maintain the distinction between laboratory sensitization and clinical food allergy.',
    'Always prioritize doctor-confirmed diagnoses over unconfirmed suspicions.',
  ],
};
