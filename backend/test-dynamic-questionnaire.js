import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import MedicalReport from './src/models/MedicalReport.js';
import { generateToken } from './src/middleware/authMiddleware.js';
import {
  detectDocumentTestType,
  buildTestSpecificParameters,
  analyzeMedicalDocument,
} from './src/services/ocr/documentUnderstandingService.js';
import { TEST_SCHEMAS, SUPPORTED_TEST_TYPES_LIST } from './src/config/testSchemas.js';
import app from './src/server.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
const TEST_PORT = 5056;

async function runDynamicQuestionnaireTests() {
  console.log('🧪 Starting Comprehensive Dynamic Questionnaire & Test Modality Verification Tests...\n');

  let server;
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ 1. MongoDB Connected successfully.');

    server = app.listen(TEST_PORT);
    const BASE_URL = `http://localhost:${TEST_PORT}/api`;

    // -------------------------------------------------------------
    // Test Suite 1: GET /api/medical-tests/schemas
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 1: Diagnostic Test Modality Schemas API ---');
    const schemasRes = await fetch(`${BASE_URL}/medical-tests/schemas`);
    const schemasData = await schemasRes.json();

    if (schemasRes.status !== 200 || !schemasData.success) {
      throw new Error(`Failed to fetch test schemas: ${JSON.stringify(schemasData)}`);
    }

    const schemasMap = schemasData.schemas || (Array.isArray(schemasData.data) ? Object.fromEntries(schemasData.data.map(s => [s.id, s])) : schemasData.data);
    const requiredModalityIds = [
      'specific_ige',
      'skin_prick',
      'total_ige',
      'crd',
      'oral_challenge',
      'bat',
      'patch_test',
      'intradermal',
    ];

    for (const modId of requiredModalityIds) {
      if (!schemasMap[modId]) {
        throw new Error(`Missing expected schema modality '${modId}' in API response!`);
      }
      const schema = schemasMap[modId];
      if (!schema.name || !schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
        throw new Error(`Schema '${modId}' has invalid or empty field specifications!`);
      }
      if (!schema.clinicalSignificance) {
        throw new Error(`Schema '${modId}' is missing clinical significance documentation!`);
      }
    }
    console.log(`✅ Schemas API returned all ${requiredModalityIds.length} clinical diagnostic schemas.`);

    // -------------------------------------------------------------
    // Test Suite 2: Multi-Tenant Users Setup & Profile Reuse
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Multi-Tenant Setup & Profile Association ---');
    const userA = new User({
      name: 'Dr. Jane Watson',
      dob: new Date('1988-11-20'),
      address: '742 Evergreen Terrace, Medical District',
      sex: 'Female',
      email: `jane.watson.${Date.now()}@clinic-test.org`,
      password: 'SecurePassword123!',
    });
    await userA.save();
    const tokenA = generateToken(userA._id);

    const userB = new User({
      name: 'John Patient',
      dob: new Date('1990-04-12'),
      address: '123 Baker Street',
      sex: 'Male',
      email: `john.patient.${Date.now()}@clinic-test.org`,
      password: 'SecurePassword123!',
    });
    await userB.save();
    const tokenB = generateToken(userB._id);

    console.log(`✅ Created test users: User A (${userA.name}) and User B (${userB.name})`);

    // -------------------------------------------------------------
    // Test Suite 3: Creating and Saving All 8 Diagnostic Test Modalities
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 3: Dynamic Questionnaire Submissions for All 8 Test Types ---');

    const testSubmissions = [
      {
        modalityId: 'specific_ige',
        payload: {
          testCategory: 'specific_ige',
          allergenName: 'Peanut (Arachis hypogaea)',
          testType: 'Specific IgE Blood Test',
          testResult: '14.5',
          units: 'kUA/L',
          referenceRange: '< 0.35 kUA/L',
          testDate: '2026-05-10',
          testSpecificParameters: {
            allergenName: 'Peanut (Arachis hypogaea)',
            specificIgEValue: '14.5',
            units: 'kUA/L',
            referenceInterval: '< 0.35 kUA/L',
            igeClass: 'Class 3 (3.50 - 17.49 kUA/L - High)',
            laboratoryName: 'Metropolitan Immunoassay Lab',
            assayPlatform: 'Phadia ImmunoCAP 250',
          },
          parameterStatus: {
            specificIgEValue: 'user_verified',
            igeClass: 'user_verified',
          },
          customParameters: [
            { key: 'Specific IgG4', value: '1.20', unit: 'mg/L' },
          ],
          clinicOrLabName: 'Metropolitan Immunoassay Lab',
          isDoctorConfirmedDiagnosis: true,
          clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        },
      },
      {
        modalityId: 'skin_prick',
        payload: {
          testCategory: 'skin_prick',
          allergenName: 'Cow Milk Extract',
          testType: 'Skin Prick Test (SPT)',
          testResult: '6 mm',
          units: 'mm wheal diameter',
          testDate: '2026-05-12',
          testSpecificParameters: {
            allergenName: 'Cow Milk Extract',
            whealDiameter: '6 mm',
            flareDiameter: '18 mm',
            negativeControlWheal: '0 mm',
            positiveControlWheal: '5 mm (Histamine dihydrochloride 10 mg/mL)',
            netDifference: '6 mm (wheal >= 3 mm greater than saline)',
            testSite: 'Volar aspect of forearm',
            prickMethod: 'Standardized bifurcated prick lancet',
          },
          parameterStatus: {
            whealDiameter: 'user_verified',
            negativeControlWheal: 'user_verified',
            positiveControlWheal: 'user_verified',
            netDifference: 'user_verified',
          },
          isDoctorConfirmedDiagnosis: false,
          clinicalDiagnosisStatus: 'Recorded Test Result (Not yet confirmed)',
        },
      },
      {
        modalityId: 'total_ige',
        payload: {
          testCategory: 'total_ige',
          allergenName: 'Total Serum IgE',
          testType: 'Total Serum IgE',
          testResult: '385',
          units: 'kU/L',
          referenceRange: '0 - 100 kU/L',
          testDate: '2026-05-14',
          testSpecificParameters: {
            totalIgEValue: '385',
            units: 'kU/L',
            ageReferenceInterval: 'Adult Reference Interval: 0 - 100 kU/L (or < 150 kU/L)',
            totalIgEElevated: 'Elevated (atopic background indicator)',
            atopicClinicalContext: 'Known atopic dermatitis and allergic rhinitis',
          },
          isDoctorConfirmedDiagnosis: false,
        },
      },
      {
        modalityId: 'crd',
        payload: {
          testCategory: 'crd',
          allergenName: 'Peanut Component Ara h 2',
          testType: 'Component-Resolved Diagnostics (CRD)',
          testResult: '8.4',
          units: 'kUA/L',
          referenceRange: '< 0.10 kUA/L',
          testDate: '2026-05-15',
          testSpecificParameters: {
            allergenSource: 'Peanut',
            componentName: 'Ara h 2',
            proteinFamily: '2S Albumin (Seed storage protein)',
            componentIgEValue: '8.4',
            units: 'kUA/L',
            clinicalSignificanceCategory: 'High clinical risk: heat/digestion-stable storage protein associated with systemic reactions and persistence',
            wholeExtractIgE: '14.5 kUA/L',
          },
          isDoctorConfirmedDiagnosis: true,
          clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        },
      },
      {
        modalityId: 'oral_challenge',
        payload: {
          testCategory: 'oral_challenge',
          allergenName: 'Baked Egg in Muffin',
          testType: 'Oral Food Challenge (OFC)',
          testResult: 'Tolerant / Negative',
          units: 'Cumulative Dose: 4.2g protein',
          testDate: '2026-05-18',
          testSpecificParameters: {
            foodTested: 'Baked Egg in Muffin',
            challengeType: 'Open supervised incremental oral challenge',
            foodMatrix: 'Standard muffin with 2.2g baked egg protein per serving',
            cumulativeDose: '4.2 g egg protein ingested',
            elicitingDose: 'None (no clinical symptoms at full dose)',
            challengeOutcome: 'Passed / Negative (Tolerant to baked egg form)',
            timeToReaction: 'None observed through 2-hour observation window',
            clinicalSetting: 'Hospital Allergy Day Unit with IV access & resuscitation readiness',
          },
          isDoctorConfirmedDiagnosis: true,
          clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        },
      },
      {
        modalityId: 'bat',
        payload: {
          testCategory: 'bat',
          allergenName: 'Hazelnut Extract BAT',
          testType: 'Basophil Activation Test (BAT)',
          testResult: '44.8%',
          units: '% activated basophils',
          testDate: '2026-05-20',
          testSpecificParameters: {
            allergenTested: 'Hazelnut Extract (Corylus avellana)',
            activationMarker: 'CD63 (or CD203c up-regulation)',
            percentBasophilsActivated: '44.8%',
            allergenStimulationConcentration: '10 ng/mL',
            stimulationThreshold: 'Cut-off threshold: > 15% CD63+ basophils',
            qualityControlsValid: 'Negative baseline control < 5%; Positive anti-Fc-epsilon-RI control > 50%',
          },
          isDoctorConfirmedDiagnosis: false,
        },
      },
      {
        modalityId: 'patch_test',
        payload: {
          testCategory: 'patch_test',
          allergenName: 'Soy Protein Isolate APT',
          testType: 'Patch Test',
          testResult: 'Grade 2+ (Positive)',
          units: 'Erythema + papules at 72h',
          testDate: '2026-05-22',
          testSpecificParameters: {
            allergenTested: 'Soy Protein Isolate (in petrolatum vehicle)',
            applicationDuration: '48 hours occlusion via Finn chambers',
            readingTimePoint: '72 hours post-application',
            erythemaGrade: 'Grade 2+ (Well-defined erythema and infiltration with distinct papules)',
            morphologicResponse: 'Positive non-IgE cell-mediated eczematous reaction',
          },
          isDoctorConfirmedDiagnosis: false,
        },
      },
      {
        modalityId: 'intradermal',
        payload: {
          testCategory: 'intradermal',
          allergenName: 'Historical Drug / Venom Intradermal Record',
          testType: 'Intradermal Test (Not Recommended)',
          testResult: '7 mm wheal',
          units: 'mm wheal diameter',
          testDate: '2026-05-25',
          clinicalWarningAcknowledged: true,
          testSpecificParameters: {
            allergenTested: 'Historical Drug / Venom Record',
            whealDiameter: '7 mm',
            doctorInterpretation: 'Documented historical intradermal test. Note: per AAAAI/EAACI, not recommended for food allergy evaluation.',
          },
          isDoctorConfirmedDiagnosis: false,
        },
      },
    ];

    const createdRecordIds = [];

    for (const testCase of testSubmissions) {
      const res = await fetch(`${BASE_URL}/medical-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(testCase.payload),
      });

      const body = await res.json();
      if (res.status !== 201 || !body.success) {
        throw new Error(`Failed to create test for modality '${testCase.modalityId}': ${JSON.stringify(body)}`);
      }

      const record = body.data;
      createdRecordIds.push(record._id);

      // Verify modality and testSpecificParameters persistence
      if (record.testCategory !== testCase.modalityId) {
        throw new Error(`Expected testCategory '${testCase.modalityId}', got '${record.testCategory}'`);
      }

      // Verify parameters were stored in MongoDB
      const storedParams = record.testSpecificParameters || {};
      for (const [k, expectedVal] of Object.entries(testCase.payload.testSpecificParameters)) {
        const actualVal = storedParams[k];
        if (actualVal === undefined) {
          throw new Error(`Missing expected testSpecificParameter '${k}' in saved record for '${testCase.modalityId}'`);
        }
        if (String(actualVal) !== String(expectedVal)) {
          throw new Error(`Value mismatch for '${k}' in '${testCase.modalityId}': expected '${expectedVal}', got '${actualVal}'`);
        }
      }

      console.log(`  ✓ Successfully created and verified modality '${testCase.modalityId}' (${record.testType})`);
    }

    console.log(`✅ All 8 diagnostic test modalities successfully created with test-specific parameters.`);

    // -------------------------------------------------------------
    // Test Suite 4: Multi-Tenant Data Isolation Checks
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 4: Multi-Tenant Authorization Isolation Checks ---');
    const aliceRecordId = createdRecordIds[0];

    // User B tries to read User A's test record
    const getRes = await fetch(`${BASE_URL}/medical-tests/${aliceRecordId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (getRes.status !== 404 && getRes.status !== 403) {
      throw new Error(`Security breach! User B should not be able to read User A's test record. Got status: ${getRes.status}`);
    }
    console.log('  ✓ User B prevented from reading User A test record (404/403).');

    // User B tries to update User A's test record
    const putRes = await fetch(`${BASE_URL}/medical-tests/${aliceRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ allergenName: 'Hacked Allergen' }),
    });
    if (putRes.status !== 404 && putRes.status !== 403) {
      throw new Error(`Security breach! User B should not be able to update User A's record. Got status: ${putRes.status}`);
    }
    console.log('  ✓ User B prevented from updating User A test record (404/403).');

    // User B tries to delete User A's test record
    const delRes = await fetch(`${BASE_URL}/medical-tests/${aliceRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (delRes.status !== 404 && delRes.status !== 403) {
      throw new Error(`Security breach! User B should not be able to delete User A's record. Got status: ${delRes.status}`);
    }
    console.log('  ✓ User B prevented from deleting User A test record (404/403).');

    // -------------------------------------------------------------
    // Test Suite 5: OCR Document Understanding & Modality Detection
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 5: OCR Document Understanding & Test Modality Classifier ---');

    const sampleTexts = [
      {
        expectedModality: 'skin_prick',
        text: `
          ALLERGY CLINICAL LABORATORY - CUTANEOUS TESTING
          Patient: Jane Watson    Date: 2026-05-10
          SKIN PRICK TEST (SPT) REPORT
          Negative Control (Saline): 0 mm
          Positive Control (Histamine): 5 mm wheal
          Allergen Tested: Peanut Extract
          Wheal Diameter: 6 mm
          Net Difference: 6 mm (Wheal >= 3 mm net)
          Prick Method: Bifurcated lancet on volar forearm
        `,
      },
      {
        expectedModality: 'crd',
        text: `
          MOLECULAR ALLERGOLOGY - COMPONENT-RESOLVED DIAGNOSTICS (CRD)
          Allergen: Peanut (Arachis hypogaea)
          Component Name: Ara h 2
          Protein Family: 2S Albumin Storage Protein
          Component IgE Concentration: 8.4 kUA/L (High Risk)
          Whole Extract ImmunoCAP: 14.5 kUA/L
        `,
      },
      {
        expectedModality: 'oral_challenge',
        text: `
          PEDIATRIC ALLERGY CLINIC - ORAL FOOD CHALLENGE (OFC)
          Challenge Protocol: Open Oral Challenge
          Food Matrix: Baked Egg in Wheat Muffin
          Dosing Schedule: Incremental 15-minute doses
          Cumulative Dose: 4.2 g egg protein ingested
          Challenge Outcome: Passed / Negative (Tolerant)
          Medical Setting: Hospital Day Unit under direct physician supervision
        `,
      },
      {
        expectedModality: 'bat',
        text: `
          FLOW CYTOMETRY CELLULAR IMMUNOLOGY - BASOPHIL ACTIVATION TEST (BAT)
          Allergen Stimulated: Hazelnut Extract
          Activation Marker: CD63+ Basophils
          Stimulation Result: 44.8% CD63 activation at 10 ng/mL
          Stimulation Threshold: > 15% positive cut-off
        `,
      },
      {
        expectedModality: 'total_ige',
        text: `
          ROCHE COBAS CLINICAL IMMUNOCHEMISTRY
          Total Serum IgE (Total IgE)
          Result: 385 kU/L
          Reference Interval: Adult expected normal 0 - 100 kU/L
          Interpretation: Elevated IgE concentration, atopic tendency
        `,
      },
    ];

    for (const sample of sampleTexts) {
      const lines = sample.text.split('\n').map((l) => l.trim()).filter(Boolean);
      const detection = detectDocumentTestType(sample.text, lines);

      if (detection.testCategory !== sample.expectedModality) {
        throw new Error(`Classifier failed for expected '${sample.expectedModality}', detected '${detection.testCategory}' with confidence ${detection.confidence}`);
      }
      console.log(`  ✓ Correctly classified modality '${sample.expectedModality}' (detected '${detection.testType}', confidence ${(detection.confidence * 100).toFixed(0)}%)`);
    }

    // -------------------------------------------------------------
    // Test Suite 6: Modality Mismatch Flagging
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 6: Modality Mismatch Flagging ---');
    const sptDocText = `
      SKIN PRICK TEST (SPT) REPORT
      Negative Control (Saline): 0 mm
      Positive Control (Histamine): 5 mm wheal
      Allergen: Peanut Extract
      Wheal: 6 mm
    `;
    const analyzedMismatch = analyzeMedicalDocument(sptDocText, {
      selectedTestType: 'Specific IgE Blood Test',
      filename: 'spt_report.pdf',
    });

    if (!analyzedMismatch.testTypeMismatch) {
      throw new Error(`Expected testTypeMismatch to be TRUE when selected is 'Specific IgE Blood Test' but document is clearly SPT!`);
    }
    if (analyzedMismatch.detectedTestType !== 'Skin Prick Test (SPT)') {
      throw new Error(`Expected detectedTestType to be 'Skin Prick Test (SPT)', got '${analyzedMismatch.detectedTestType}'`);
    }
    console.log(`  ✓ Correctly detected and flagged test type mismatch:`);
    console.log(`    Selected: '${analyzedMismatch.selectedTestType}' vs Detected: '${analyzedMismatch.detectedTestType}'`);
    console.log(`    Details: ${analyzedMismatch.testMismatchDetails}`);

    // -------------------------------------------------------------
    // Test Suite 7: Strict Missing Data Handling (No Fabrications)
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 7: Strict Missing Data Handling (Nulls & Not Mentioned) ---');
    const partialSPTText = `
      SKIN PRICK TEST REPORT
      Allergen: Peanut
      Wheal Diameter: 5 mm
      (Notice: negative control and positive control are omitted from this document)
    `;
    const partialLines = partialSPTText.split('\n').map((l) => l.trim()).filter(Boolean);
    const { testSpecificParameters, parameterStatus } = buildTestSpecificParameters(
      'skin_prick',
      { name: 'Peanut', category: 'Peanuts' },
      '5 mm',
      'mm',
      null,
      partialSPTText,
      partialSPTText,
      {}
    );

    // Negative control was omitted from text: must be null, not 0 or invented
    const negVal = Object.prototype.hasOwnProperty.call(testSpecificParameters, 'negativeControl')
      ? testSpecificParameters.negativeControl
      : testSpecificParameters.negativeControlWheal;
    const negStatus = Object.prototype.hasOwnProperty.call(parameterStatus, 'negativeControl')
      ? parameterStatus.negativeControl
      : parameterStatus.negativeControlWheal;
    if (negVal !== null) {
      throw new Error(`Strict Missing Data Rule Violated: negativeControl should be null when not in text, got '${negVal}'`);
    }
    if (negStatus !== 'not_mentioned') {
      throw new Error(`Expected status 'not_mentioned' for omitted parameter, got '${negStatus}'`);
    }

    // Wheal diameter was mentioned: must be extracted
    if (testSpecificParameters.whealDiameter !== '5 mm') {
      throw new Error(`Expected whealDiameter to be '5 mm', got '${testSpecificParameters.whealDiameter}'`);
    }
    if (parameterStatus.whealDiameter !== 'extracted') {
      throw new Error(`Expected status 'extracted' for present parameter, got '${parameterStatus.whealDiameter}'`);
    }
    console.log('  ✓ Verified: Missing parameters strictly preserved as null with status "not_mentioned".');
    console.log('  ✓ Verified: Present parameters correctly marked as "extracted". Zero values never fabricated.');

    // -------------------------------------------------------------
    // Test Suite 8: Clean-up Test Data
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 8: Cleaning up test documents ---');
    await MedicalTestRecord.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log('✅ Cleaned up temporary test database records.');

    console.log('\n🎉 ALL DYNAMIC QUESTIONNAIRE & TEST MODALITY TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }
}

runDynamicQuestionnaireTests().catch((err) => {
  console.error('\n❌ Test Suite Failed with Error:', err);
  process.exit(1);
});
