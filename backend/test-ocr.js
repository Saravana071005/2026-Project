import assert from 'assert';
import {
  analyzeMedicalDocument,
  extractGeneralMeasurements,
  extractClinicalStatus,
  extractAllergyTests,
  ALLERGEN_DICTIONARY,
} from './src/services/ocr/documentUnderstandingService.js';
import { parsePdf } from './src/services/ocr/pdfParseService.js';

console.log('🧪 Starting Intelligent Medical OCR & Document Understanding Verification Suite...\n');

// ============================================================================
// Test 1: Tabular Lab Report Extraction & Reference Range Separation
// ============================================================================
console.log('--- Test 1: Tabular Lab Report (Quest / LabCorp Style) ---');
const sampleTabularReport = `
QUEST DIAGNOSTICS IMMUNOLOGY LABORATORY
100 Medical Center Parkway, Suite 400
Ordering Physician: Dr. Marcus Bennett, MD, FAAAAI
Patient Name: Eleanor Vance    DOB: 1996-04-12    Age: 30 Y/O    Sex: F
Collection Date: 2026-06-15    Specimen ID: 948271-X8

ALLERGEN SPECIFIC IgE REPORT
Test Name                    Result    Flag    Units      Reference Interval
Peanut (f13) IgE             24.6       H      kUA/L      < 0.35 kUA/L
Cow's Milk (f2) IgE          0.18              kUA/L      < 0.35 kUA/L
Egg White (f1) IgE           1.45       H      kUA/L      < 0.35 kUA/L
Soybean (f14) IgE            0.85       H      kUA/L      < 0.35 kUA/L

CLINICAL VITALS & OBSERVATIONS
Blood Pressure: 100/70 mmHg
Fasting Blood Sugar: 95 mg/dL
`;

const result1 = analyzeMedicalDocument(sampleTabularReport);
console.log(`Extracted Lab Name: "${result1.clinicOrLabName}"`);
console.log(`Extracted Doctor: "${result1.doctorName}"`);
console.log(`Extracted Allergy Tests Count: ${result1.allergyTests.length}`);

assert.strictEqual(
  result1.clinicOrLabName.includes('QUEST DIAGNOSTICS'),
  true,
  'Lab name should identify Quest Diagnostics'
);
assert.strictEqual(
  result1.doctorName.includes('Dr. Marcus Bennett'),
  true,
  'Doctor name should identify Dr. Marcus Bennett'
);
assert.strictEqual(result1.allergyTests.length >= 4, true, 'Should extract at least 4 allergen tests');

const peanutTest = result1.allergyTests.find((t) => t.allergenName === 'Peanut');
assert.ok(peanutTest, 'Peanut test must be found');
assert.strictEqual(peanutTest.testResult, '24.6', 'Peanut result must be exactly 24.6');
assert.strictEqual(peanutTest.units, 'kUA/L', 'Peanut units must be kUA/L');
assert.ok(
  peanutTest.referenceRange && peanutTest.referenceRange.includes('0.35'),
  'Reference range must be separated and contain 0.35'
);
assert.notStrictEqual(
  peanutTest.testResult,
  peanutTest.referenceRange,
  'Patient result must NOT be confused with reference range'
);
assert.strictEqual(peanutTest.confidence, 'high', 'Confidence should be high for clean tabular row');

console.log('✅ Tabular extraction & reference range separation verified.\n');

// ============================================================================
// Test 2: Missing Data Handling (Mandatory Requirement #5)
// ============================================================================
console.log('--- Test 2: Missing Data Handling (Must be NULL, never invented) ---');
console.log('Vitals in report:', result1.generalMeasurements);
assert.strictEqual(
  result1.generalMeasurements.bloodPressure,
  '100/70',
  'Blood pressure must be 100/70'
);
assert.strictEqual(
  result1.generalMeasurements.bloodSugar,
  '95',
  'Blood sugar must be 95'
);
assert.strictEqual(
  result1.generalMeasurements.cholesterol,
  null,
  'Cholesterol is absent and MUST be null'
);
assert.strictEqual(
  result1.generalMeasurements.totalIgE,
  null,
  'Total IgE is absent and MUST be null'
);
console.log('✅ Absent values are strictly null (verified: cholesterol=null, totalIgE=null).\n');

// ============================================================================
// Test 3: Decimal Precision Preservation
// ============================================================================
console.log('--- Test 3: Decimal Precision Preservation ---');
const milkTest = result1.allergyTests.find((t) => t.allergenName === "Cow's Milk");
assert.ok(milkTest, "Cow's milk test must be found");
assert.strictEqual(milkTest.testResult, '0.18', 'Decimal 0.18 must be preserved exactly as string');
assert.strictEqual(milkTest.units, 'kUA/L', 'Units must be kUA/L');

const eggTest = result1.allergyTests.find((t) => t.allergenName === 'Egg White');
assert.ok(eggTest, 'Egg white test must be found');
assert.strictEqual(eggTest.testResult, '1.45', 'Decimal 1.45 must be preserved exactly');
console.log('✅ Decimal precision preserved with 100% fidelity.\n');

// ============================================================================
// Test 4: Skin Prick Test (SPT) Wheal Diameter & Controls
// ============================================================================
console.log('--- Test 4: Skin Prick Test (SPT) & Controls ---');
const sampleSptReport = `
METRO ALLERGY & ASTHMA CLINIC
Skin Prick Test Report
Date: 2026-08-20
Diagnosing Doctor: Dr. Elena Rostova, MD

Controls:
Histamine (Positive Control): 5.0 mm wheal
Saline (Negative Control): 0.0 mm wheal

Allergen Wheal Readings (15 minutes):
Crustacean Shellfish (Shrimp): 7.5 mm wheal
Walnut: 5.5 mm wheal
Peanut: 8.0 mm wheal
`;

const resultSpt = analyzeMedicalDocument(sampleSptReport);
assert.strictEqual(resultSpt.allergyTests.length >= 3, true, 'Should extract SPT tests');

const shrimpTest = resultSpt.allergyTests.find((t) => t.allergenCategory === 'Crustacean Shellfish');
assert.ok(shrimpTest, 'Shrimp test must be extracted');
assert.strictEqual(shrimpTest.testType, 'Skin Prick Test (SPT)', 'Test type must be Skin Prick Test');
assert.strictEqual(shrimpTest.testResult, '7.5', 'Shrimp wheal size must be 7.5');
assert.strictEqual(shrimpTest.units, 'mm wheal diameter', 'Units must be mm wheal diameter');
console.log(`Shrimp SPT: Result=${shrimpTest.testResult} ${shrimpTest.units}, Type=${shrimpTest.testType}`);
console.log('✅ Skin Prick Test wheal recognition verified.\n');

// ============================================================================
// Test 5: Clinical Distinction Rule & Absence of Auto-Diagnosis
// ============================================================================
console.log('--- Test 5: Clinical Distinction Rule (No Auto-Diagnosis) ---');
// Report without explicit confirmation:
assert.strictEqual(
  result1.clinicalDiagnosisStatus,
  'Recorded Test Result (Not yet confirmed)',
  'Default status must not claim confirmed diagnosis'
);

// Report WITH explicit physician confirmation statement:
const confirmedReport = `
Hospital of Immunology
Doctor-Confirmed Diagnosis: Confirmed severe peanut anaphylaxis.
Peanut IgE: 24.6 kUA/L
`;
const resultConfirmed = analyzeMedicalDocument(confirmedReport);
assert.strictEqual(
  resultConfirmed.clinicalDiagnosisStatus,
  'Doctor-Confirmed Diagnosis',
  'Status must reflect explicit doctor confirmation statement'
);
console.log('✅ Clinical Distinction Rule verified (sensitization != auto-diagnosis).\n');

// ============================================================================
// Test 6: Native Digital PDF Document Parsing
// ============================================================================
console.log('--- Test 6: Digital PDF Document Extraction (pdf-parse) ---');
try {
  const pdfOutput = await parsePdf('../Food_Allergy_Detection_System_Complete_Project_Audit.pdf');
  assert.ok(pdfOutput.rawText.length > 1000, 'PDF text extraction should extract document content');
  assert.ok(pdfOutput.pageCount >= 10, 'PDF page count should be >= 10');
  console.log(`PDF Parsed successfully: ${pdfOutput.rawText.length} characters across ${pdfOutput.pageCount} pages.`);
  console.log('✅ PDF digital document parsing verified.\n');
} catch (err) {
  console.error('PDF Parse Error:', err);
  throw err;
}

// ============================================================================
// Test 7: Multi-Column & Variable Layout Resilience
// ============================================================================
console.log('--- Test 7: Multi-Column & Key-Value Variable Layouts ---');
const multiColumnReport = `
---------------------------------------------------------------
PATIENT DETAILS                  LABORATORY FINDINGS
Name: John Doe                   Specific IgE:
Age: 45                          Peanut Component (rAra h 2): 18.4 kUA/L
ID: 884129                       Sesame Seed: 3.2 kUA/L
---------------------------------------------------------------
`;
const resultMulti = analyzeMedicalDocument(multiColumnReport);
const araH2Test = resultMulti.allergyTests.find((t) => t.allergenName.includes('Ara h 2'));
assert.ok(araH2Test, 'Component rAra h 2 must be found in multi-column layout');
assert.strictEqual(araH2Test.testResult, '18.4', 'Result must be 18.4');
// Ensure patient Age: 45 or ID: 884129 was NOT assigned as test result!
assert.notStrictEqual(araH2Test.testResult, '45', 'Patient age must not be confused with test result');
assert.notStrictEqual(araH2Test.testResult, '884129', 'Patient ID must not be confused with test result');
console.log('✅ Multi-column layout parsed without field contamination.\n');

console.log('🎉 ALL 7 MEDICAL OCR & DOCUMENT UNDERSTANDING TESTS PASSED! 🎉\n');
