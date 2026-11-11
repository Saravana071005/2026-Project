/**
 * Intelligent Document Understanding & Medical Entity Extraction Engine
 * 
 * Specialized for medical laboratory reports and food allergy diagnostic records.
 * Analyzes unstructured text, tabular layouts, multi-column sections, and key-value lines.
 * Strictly adheres to clinical guardrails, decimal preservation, reference range separation,
 * and sets absent measurements to null.
 */

// Comprehensive Allergen Dictionary & Category Mapping
export const ALLERGEN_DICTIONARY = [
  // Peanuts
  {
    name: 'Peanut',
    category: 'Peanuts',
    synonyms: ['peanut', 'peanuts', 'groundnut', 'arachis hypogaea', 'ara h', 'rara h', 'f13', 'rf13'],
  },
  {
    name: 'Peanut Component (rAra h 2)',
    category: 'Peanuts',
    synonyms: ['ara h 2', 'rara h 2', 'f423', 'rf423'],
  },
  {
    name: 'Peanut Component (rAra h 1)',
    category: 'Peanuts',
    synonyms: ['ara h 1', 'rara h 1', 'f422'],
  },
  {
    name: 'Peanut Component (rAra h 3)',
    category: 'Peanuts',
    synonyms: ['ara h 3', 'rara h 3', 'f424'],
  },
  {
    name: 'Peanut Component (rAra h 6)',
    category: 'Peanuts',
    synonyms: ['ara h 6', 'rara h 6', 'f447'],
  },
  // Tree Nuts
  {
    name: 'Walnut',
    category: 'Tree Nuts',
    synonyms: ['walnut', 'walnuts', 'juglans regia', 'jug r', 'f256'],
  },
  {
    name: 'Almond',
    category: 'Tree Nuts',
    synonyms: ['almond', 'almonds', 'prunus dulcis', 'f20'],
  },
  {
    name: 'Cashew',
    category: 'Tree Nuts',
    synonyms: ['cashew', 'cashews', 'anacardium occidentale', 'ana o', 'f202'],
  },
  {
    name: 'Hazelnut',
    category: 'Tree Nuts',
    synonyms: ['hazelnut', 'hazelnuts', 'corylus avellana', 'cor a', 'f17'],
  },
  {
    name: 'Pistachio',
    category: 'Tree Nuts',
    synonyms: ['pistachio', 'pistachios', 'pistacia vera', 'pis v', 'f203'],
  },
  {
    name: 'Pecan',
    category: 'Tree Nuts',
    synonyms: ['pecan', 'pecans', 'carya illinoinensis', 'f201'],
  },
  {
    name: 'Brazil Nut',
    category: 'Tree Nuts',
    synonyms: ['brazil nut', 'bertholletia excelsa', 'f18'],
  },
  // Milk & Dairy
  {
    name: "Cow's Milk",
    category: 'Milk & Dairy',
    synonyms: ['cow milk', "cow's milk", 'milk', 'dairy', 'bos d', 'f2'],
  },
  {
    name: 'Casein (Bos d 8)',
    category: 'Milk & Dairy',
    synonyms: ['casein', 'bos d 8', 'f78'],
  },
  {
    name: 'Beta-lactoglobulin (Bos d 5)',
    category: 'Milk & Dairy',
    synonyms: ['beta-lactoglobulin', 'bos d 5', 'f77'],
  },
  {
    name: 'Alpha-lactalbumin (Bos d 4)',
    category: 'Milk & Dairy',
    synonyms: ['alpha-lactalbumin', 'bos d 4', 'f76'],
  },
  // Eggs
  {
    name: 'Egg White',
    category: 'Eggs',
    synonyms: ['egg white', 'egg whites', 'ovalbumin', 'ovomucoid', 'gal d', 'f1'],
  },
  {
    name: 'Egg Yolk',
    category: 'Eggs',
    synonyms: ['egg yolk', 'egg yolks', 'f75'],
  },
  {
    name: 'Whole Egg',
    category: 'Eggs',
    synonyms: ['whole egg', 'chicken egg'],
  },
  // Crustacean Shellfish
  {
    name: 'Crustacean Shellfish (Shrimp)',
    category: 'Crustacean Shellfish',
    synonyms: ['shrimp', 'prawn', 'prawns', 'penaeus aztecus', 'tropomyosin', 'cra a', 'f24'],
  },
  {
    name: 'Lobster',
    category: 'Crustacean Shellfish',
    synonyms: ['lobster', 'homarus americanus', 'f80'],
  },
  {
    name: 'Crab',
    category: 'Crustacean Shellfish',
    synonyms: ['crab', 'cancer magister', 'f23'],
  },
  // Fish
  {
    name: 'Codfish / Fish',
    category: 'Fish',
    synonyms: ['codfish', 'cod', 'gadus morhua', 'parvalbumin', 'gad m', 'f3'],
  },
  {
    name: 'Salmon',
    category: 'Fish',
    synonyms: ['salmon', 'salmo salar', 'f41'],
  },
  {
    name: 'Tuna',
    category: 'Fish',
    synonyms: ['tuna', 'thunnus albacares', 'f40'],
  },
  // Wheat & Gluten
  {
    name: 'Wheat',
    category: 'Wheat & Gluten',
    synonyms: ['wheat', 'triticum aestivum', 'tri a', 'f4'],
  },
  {
    name: 'Gluten',
    category: 'Wheat & Gluten',
    synonyms: ['gluten', 'gliadin', 'f79'],
  },
  // Soybeans
  {
    name: 'Soybeans & Soy',
    category: 'Soybeans',
    synonyms: ['soybean', 'soybeans', 'soy', 'soya', 'glycine max', 'gly m', 'f14'],
  },
  // Sesame & Seeds
  {
    name: 'Sesame Seed',
    category: 'Sesame',
    synonyms: ['sesame', 'sesame seed', 'sesamum indicum', 'ses i', 'f10'],
  },
  // Fruits & Vegetables
  {
    name: 'Apple',
    category: 'Fruits & Vegetables',
    synonyms: ['apple', 'mal d', 'malus domestica', 'f49'],
  },
  {
    name: 'Kiwi',
    category: 'Fruits & Vegetables',
    synonyms: ['kiwi', 'kiwifruit', 'actinidia deliciosa', 'act d', 'f84'],
  },
  {
    name: 'Peach',
    category: 'Fruits & Vegetables',
    synonyms: ['peach', 'pru p', 'prunus persica', 'f95'],
  },
];

// Common units found in allergy and medical laboratory reports
export const COMMON_UNITS = [
  'kUA/L',
  'kU/L',
  'IU/mL',
  'mm wheal',
  'mm',
  'mg/dL',
  'mmHg',
  'mmol/L',
  'g',
  'grams',
  'Index',
  'Ratio',
  '%',
];

/**
 * Clean and normalize OCR string lines
 */
export function normalizeTextLines(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Parse date string from text
 */
export function extractDateFromText(text) {
  if (!text) return null;

  // Patterns: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, Month DD, YYYY
  const datePatterns = [
    /\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/, // 2026-06-15
    /\b(0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])[-/.](20\d{2})\b/, // 06/15/2026
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d{2})\b/i,
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match) {
      const parsed = new Date(match[0]);
      if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Extract Clinic or Laboratory Name
 */
export function extractClinicOrLab(text, lines) {
  const labKeywords = [
    'quest diagnostics',
    'labcorp',
    'laboratory corporation',
    'mayo clinic laboratories',
    'apex diagnostic',
    'metro allergy',
    'st. jude',
    'immunology laboratory',
    'pathology laboratory',
    'diagnostic laboratory',
    'health system',
    'hospital laboratory',
    'memorial hospital',
    'allergy & asthma clinic',
    'allergy associates',
  ];

  const lower = text.toLowerCase();
  for (const kw of labKeywords) {
    if (lower.includes(kw)) {
      // Find the line that contains the keyword for proper casing
      const matchingLine = lines.find((l) => l.toLowerCase().includes(kw));
      if (matchingLine) {
        return matchingLine.substring(0, 100).trim();
      }
    }
  }

  // Look for header lines in top 5 lines containing "Hospital", "Lab", "Clinic"
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (/(hospital|clinic|laboratory|diagnostics|medical center)/i.test(l)) {
      return l.substring(0, 100).trim();
    }
  }

  return null;
}

/**
 * Extract Physician / Doctor Name
 */
export function extractDoctorName(text, lines) {
  // Look for "Dr. First Last", "Physician: Dr. ...", "Doctor: ..."
  const docPatterns = [
    /(?:physician|doctor|dr\.|ordered by|diagnosed by|md)[:\s]+(?:dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:,\s*(?:MD|DO|FAAAAI|FACAAI))?)/i,
    /\bDr\.\s+([A-Z][a-z]+\s+[A-Z][a-z]+(?:,\s*(?:MD|DO|FAAAAI))?)\b/,
  ];

  for (const pattern of docPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return `Dr. ${match[1].replace(/^dr\.?\s+/i, '').trim()}`.substring(0, 100);
    }
  }

  // Check lines starting with Doctor / Ordering Physician
  for (const line of lines) {
    if (/^(doctor|physician|ordering provider|allergist)[:\s]/i.test(line)) {
      const cleaned = line.replace(/^(doctor|physician|ordering provider|allergist)[:\s]+/i, '').trim();
      if (cleaned.length >= 3) {
        return cleaned.substring(0, 100);
      }
    }
  }

  return null;
}

/**
 * Extract General Measurements (Blood Pressure, Blood Sugar, Cholesterol, Total IgE)
 * If absent, must return null (Strict Requirement #5)
 */
export function extractGeneralMeasurements(text, lines) {
  const result = {
    bloodPressure: null,
    bloodSugar: null,
    cholesterol: null,
    totalIgE: null,
    otherLabValues: {},
  };

  // 1. Blood Pressure (e.g. 120/80, 100/70 mmHg)
  const bpMatch = text.match(/(?:blood\s*pressure|b[./]?p[./]?|nibp)[:\s]+(\d{2,3}\s*\/\s*\d{2,3})(?:\s*mm\s*hg)?/i);
  if (bpMatch && bpMatch[1]) {
    result.bloodPressure = bpMatch[1].replace(/\s+/g, '');
  }

  // 2. Fasting Blood Sugar / Glucose (e.g. 95 mg/dL)
  const sugarMatch = text.match(/(?:fasting\s*blood\s*sugar|blood\s*sugar|glucose|fbs)[:\s]+(\d{2,3}(?:\.\d+)?)(?:\s*mg\s*[/.]?\s*d[lL])?/i);
  if (sugarMatch && sugarMatch[1]) {
    // Avoid confusing with percentage or 4-digit codes
    const val = parseFloat(sugarMatch[1]);
    if (val >= 40 && val <= 500) {
      result.bloodSugar = sugarMatch[1];
    }
  }

  // 3. Cholesterol (e.g. 185 mg/dL)
  const cholMatch = text.match(/(?:total\s*cholesterol|cholesterol)[:\s]+(\d{2,3}(?:\.\d+)?)(?:\s*mg\s*[/.]?\s*d[lL])?/i);
  if (cholMatch && cholMatch[1]) {
    const val = parseFloat(cholMatch[1]);
    if (val >= 80 && val <= 400) {
      result.cholesterol = cholMatch[1];
    }
  }

  // 4. Total IgE (e.g. 142 IU/mL or kU/L)
  const totalIgeMatch = text.match(/(?:total\s*ige|serum\s*ige)[:\s]+(\d+(?:\.\d+)?)(?:\s*(?:iu\s*[/.]?\s*ml|ku\s*[/.]?\s*l))?/i);
  if (totalIgeMatch && totalIgeMatch[1]) {
    result.totalIgE = totalIgeMatch[1];
  }

  return result;
}

/**
 * Extract Clinical Confirmation Status
 * Strictly follows Clinical Distinction Rule: Never assumes confirmed diagnosis unless explicitly documented
 */
export function extractClinicalStatus(text) {
  const lower = text.toLowerCase();
  if (
    lower.includes('doctor-confirmed diagnosis') ||
    lower.includes('confirmed clinical diagnosis') ||
    lower.includes('diagnosed by physician') ||
    lower.includes('physician confirmed diagnosis')
  ) {
    return 'Doctor-Confirmed Diagnosis';
  }

  if (lower.includes('prescription documented') || lower.includes('prescribed observation')) {
    return 'Prescription Observation';
  }

  if (lower.includes('inconclusive') || lower.includes('retest recommended')) {
    return 'Inconclusive / Retest Recommended';
  }

  return 'Recorded Test Result (Not yet confirmed)';
}

/**
 * Intelligent Extraction of Food Allergy Diagnostic Tests
 * Handles tabular reports, multi-column blocks, key-value rows, wheal diameters, and IgE titers
 */
export function extractAllergyTests(text, lines) {
  const extractedTests = [];
  const processedAllergens = new Set();

  // Pattern for numerical results: preserves decimals (e.g. 24.6, 0.18, 7.5, <0.35, >100)
  const resultValueRegex = /(?:[<>]=?\s*)?\d+(?:\.\d+)?/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check each known allergen
    for (const item of ALLERGEN_DICTIONARY) {
      let matchedSynonym = null;
      for (const syn of item.synonyms) {
        // Word boundary match to prevent partial substring confusion
        const synRegex = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (synRegex.test(lowerLine)) {
          matchedSynonym = syn;
          break;
        }
      }

      if (matchedSynonym && !processedAllergens.has(item.name.toLowerCase())) {
        // We found an allergen match on this line. Now examine the line and neighboring lines for result, units, range, and test type.
        const surroundingLines = [line];
        if (i + 1 < lines.length) surroundingLines.push(lines[i + 1]);
        if (i + 2 < lines.length) surroundingLines.push(lines[i + 2]);
        const blockText = surroundingLines.join(' ');

        // Determine Test Modality
        let testType = 'Specific IgE Blood Test';
        if (
          lowerLine.includes('skin prick') ||
          lowerLine.includes('spt') ||
          lowerLine.includes('wheal') ||
          lowerLine.includes('prick test')
        ) {
          testType = 'Skin Prick Test (SPT)';
        } else if (
          lowerLine.includes('challenge') ||
          lowerLine.includes('ofc') ||
          lowerLine.includes('oral food')
        ) {
          testType = 'Oral Food Challenge (OFC)';
        } else if (lowerLine.includes('patch')) {
          testType = 'Patch Test';
        } else if (
          lowerLine.includes('rara') ||
          lowerLine.includes('component') ||
          lowerLine.includes('crd') ||
          lowerLine.includes('recombinant')
        ) {
          testType = 'Component-Resolved Diagnostics (CRD)';
        } else if (lowerLine.includes('total ige')) {
          testType = 'Total IgE Test';
        }

        // Determine Units
        let units = '';
        if (testType === 'Skin Prick Test (SPT)') {
          units = 'mm wheal diameter';
        } else if (testType === 'Oral Food Challenge (OFC)') {
          units = 'grams consumed';
        } else {
          units = 'kUA/L';
        }

        if (/\b(?:kua\/l|kua|ku\/l)\b/i.test(blockText)) {
          units = 'kUA/L';
        } else if (/\b(?:mm\s*wheal|mm)\b/i.test(blockText) && testType.includes('Skin Prick')) {
          units = 'mm wheal diameter';
        } else if (/\b(?:iu\/ml|iu\/l)\b/i.test(blockText)) {
          units = 'IU/mL';
        } else if (/\b(?:grams?|g)\b/i.test(blockText) && testType.includes('Challenge')) {
          units = 'grams consumed';
        }

        // Extract Reference Range first so it is not confused with test result
        let referenceRange = null;
        const refRangeMatch = blockText.match(/(?:reference\s*(?:range|interval)?|ref\.?\s*range)[:\s]+([<>]?=?\s*[\d.]+(?:\s*-\s*[\d.]+)?(?:\s*[a-zA-Z/]+)?)/i) ||
          blockText.match(/(?:<\s*0\.35\s*kUA\/L|<0\.35|<0\.10|0\.00\s*-\s*0\.35)/i);
        if (refRangeMatch) {
          referenceRange = refRangeMatch[1] ? refRangeMatch[1].trim() : refRangeMatch[0].trim();
        } else if (testType === 'Skin Prick Test (SPT)') {
          const sptControlMatch = blockText.match(/(?:histamine:\s*[\d.]+\s*mm|neg(?:ative)?:\s*[\d.]+\s*mm)/i);
          if (sptControlMatch) {
            referenceRange = sptControlMatch[0].trim();
          }
        }

        // Extract Patient Test Result
        let testResult = null;
        let confidence = 'high';
        let confidenceScore = 90;
        let notes = null;

        // Try extracting value on same line after allergen name
        // e.g.: "Peanut IgE   24.6  kUA/L" or "Peanut: 24.6"
        const lineAfterSynonym = line.substring(lowerLine.indexOf(matchedSynonym) + matchedSynonym.length);
        
        // Match numbers, but do not match code like f13, f423, or reference range if present
        const numbersInLine = [];
        const numMatches = lineAfterSynonym.matchAll(/\b(?:[<>]=?\s*)?(\d+(?:\.\d+)?)\b/g);
        for (const nm of numMatches) {
          const valStr = nm[1];
          // Filter out allergen codes like 13, 256, 423 if they match synonym code
          if (valStr.length >= 4 && !valStr.includes('.')) continue; // likely sample or lab code
          numbersInLine.push(valStr);
        }

        if (numbersInLine.length > 0) {
          // In standard tables: Result is typically the first number following the test name
          testResult = numbersInLine[0];
          confidence = 'high';
          confidenceScore = 92;
        } else {
          // Look in next line (multi-row / multi-line label-value pairing)
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextNumMatch = nextLine.match(/\b(?:[<>]=?\s*)?(\d+(?:\.\d+)?)\b/);
            if (nextNumMatch) {
              testResult = nextNumMatch[1];
              confidence = 'medium';
              confidenceScore = 75;
              notes = 'Result extracted from line immediately following allergen name';
            }
          }
        }

        // Check for qualitative test result (Positive / Negative / Reactive)
        if (!testResult) {
          if (/\b(?:positive|reactive|detected|elevated)\b/i.test(lineAfterSynonym)) {
            testResult = 'Positive';
            confidence = 'high';
            confidenceScore = 88;
          } else if (/\b(?:negative|non-reactive|not detected)\b/i.test(lineAfterSynonym)) {
            testResult = 'Negative';
            confidence = 'high';
            confidenceScore = 88;
          }
        }

        // If no test result found, flag for manual review
        if (!testResult) {
          testResult = 'needs_review';
          confidence = 'needs_review';
          confidenceScore = 40;
          notes = 'Allergen name identified but numerical result requires manual confirmation.';
        }

        // Mark allergen as processed to avoid duplicates
        processedAllergens.add(item.name.toLowerCase());

        extractedTests.push({
          allergenName: item.name,
          allergenCategory: item.category,
          testType,
          testResult,
          units,
          referenceRange,
          confidence,
          confidenceScore,
          notes,
          selected: true,
        });
      }
    }
  }

  // Fallback: If no recognized allergens matched, search for generic test lines like "Total IgE" or "Skin Prick Test"
  if (extractedTests.length === 0) {
    const genericTestMatch = text.match(/(?:specific\s*ige|total\s*ige|allergy\s*test|skin\s*prick)[:\s]+([^,\n\r]+)/i);
    if (genericTestMatch && genericTestMatch[1]) {
      extractedTests.push({
        allergenName: 'General Allergen Panel',
        allergenCategory: 'Other Food',
        testType: 'Specific IgE Blood Test',
        testResult: genericTestMatch[1].trim().substring(0, 50),
        units: 'kUA/L',
        referenceRange: null,
        confidence: 'needs_review',
        confidenceScore: 50,
        notes: 'Unlabeled allergy test detected. Please verify allergen and result.',
        selected: true,
      });
    }
  }

  return extractedTests;
}

/**
 * Main Document Understanding Function
 * Ingests raw OCR output and constructs structured, confidence-annotated medical document data.
 */
export function analyzeMedicalDocument(rawText, metadata = {}) {
  const text = rawText || '';
  const lines = normalizeTextLines(text);

  // 1. Extract Facility / Lab Name
  const clinicOrLabName = extractClinicOrLab(text, lines);

  // 2. Extract Doctor Name
  const doctorName = extractDoctorName(text, lines);

  // 3. Extract Test Date
  const testDate = extractDateFromText(text) || new Date();

  // 4. Extract Clinical Confirmation Status
  const clinicalDiagnosisStatus = extractClinicalStatus(text);

  // 5. Extract General Measurements (Absent = null)
  const generalMeasurements = extractGeneralMeasurements(text, lines);

  // 6. Extract Allergy Diagnostic Tests
  const allergyTests = extractAllergyTests(text, lines);

  // 7. Calculate Field Confidence Map
  const fieldConfidence = new Map();

  fieldConfidence.set('clinicOrLabName', {
    score: clinicOrLabName ? 85 : 0,
    status: clinicOrLabName ? 'high' : 'needs_review',
    reason: clinicOrLabName ? 'Laboratory name identified in document header' : 'No recognized laboratory name found',
  });

  fieldConfidence.set('doctorName', {
    score: doctorName ? 85 : 0,
    status: doctorName ? 'high' : 'needs_review',
    reason: doctorName ? 'Physician title and name identified' : 'No ordering physician explicitly named',
  });

  fieldConfidence.set('testDate', {
    score: testDate ? 90 : 30,
    status: testDate ? 'high' : 'needs_review',
    reason: testDate ? 'Valid test date recognized' : 'Defaulted to current date; please verify against paperwork',
  });

  fieldConfidence.set('clinicalDiagnosisStatus', {
    score: 95,
    status: 'high',
    reason: 'Clinical guardrail active: strictly avoids automated diagnosis',
  });

  fieldConfidence.set('allergyTests', {
    score: allergyTests.length > 0 ? (allergyTests.some(t => t.confidence === 'needs_review') ? 70 : 92) : 0,
    status: allergyTests.length > 0 ? (allergyTests.some(t => t.confidence === 'needs_review') ? 'medium' : 'high') : 'needs_review',
    reason: `${allergyTests.length} food allergy test records extracted`,
  });

  return {
    extractedAt: new Date(),
    clinicOrLabName,
    doctorName,
    doctorNotes: null,
    testDate,
    patientName: null,
    clinicalDiagnosisStatus,
    allergyTests,
    generalMeasurements,
    fieldConfidence,
  };
}
