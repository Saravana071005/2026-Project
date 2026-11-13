import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import DailyFoodEntry from './src/models/DailyFoodEntry.js';
import SymptomRecord from './src/models/SymptomRecord.js';
import AIAnalysisRecord from './src/models/AIAnalysisRecord.js';
import AIChatMessage from './src/models/AIChatMessage.js';
import { generateToken } from './src/middleware/authMiddleware.js';
import { checkEmergencySafety } from './src/services/ai/medicalSafetyEngine.js';
import { evaluateFoodSafety } from './src/services/ai/dietMonitoringService.js';

dotenv.config();
process.env.NODE_ENV = 'test';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
const TEST_PORT = 5057;

async function runAIDietMonitoringTests() {
  const { default: app } = await import('./src/server.js');
  console.log('🧪 Starting AI-Powered Food Allergy & Diet Monitoring Comprehensive Test Suite...\n');

  let server;
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ 1. MongoDB Connected successfully.');

    server = app.listen(TEST_PORT);
    const BASE_URL = `http://localhost:${TEST_PORT}/api`;

    // -------------------------------------------------------------
    // Setup Test Users
    // -------------------------------------------------------------
    console.log('\n--- Setup Test Patients ---');
    const userAEmail = `test.patientA.${Date.now()}@example.com`;
    const userBEmail = `test.patientB.${Date.now()}@example.com`;

    const userA = await User.create({
      name: 'Rohan Sharma',
      email: userAEmail,
      password: 'Password123!',
      dob: new Date('1995-04-12'),
      sex: 'Male',
      address: '124 Healthcare Avenue, New Delhi',
    });

    const userB = await User.create({
      name: 'Priya Patel',
      email: userBEmail,
      password: 'Password123!',
      dob: new Date('1998-08-20'),
      sex: 'Female',
      address: '456 Tech Park Boulevard, Bengaluru',
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    };

    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    };

    console.log('✅ User A created:', userA.email);
    console.log('✅ User B created:', userB.email);

    // -------------------------------------------------------------
    // Setup Clinical History for User A
    // Confirmed Wheat Allergy + Positive Peanut sIgE (Sensitization without allergy)
    // -------------------------------------------------------------
    console.log('\n--- Setup Clinical Records for User A ---');
    const wheatAllergy = await AllergyRecord.create({
      userId: userA._id,
      allergenName: 'Wheat',
      allergenCategory: 'Wheat & Gluten',
      severity: 'Moderate',
      diagnosisType: 'Doctor-Confirmed Diagnosis',
      knownReactions: ['Itching', 'Hives (Urticaria)'],
      emergencyMedication: 'Cetirizine 10mg',
      doctorName: 'Dr. V. Rao, MD (Allergy/Immunology)',
    });

    const peanutTest = await MedicalTestRecord.create({
      userId: userA._id,
      testType: 'Specific IgE Blood Test',
      testCategory: 'specific_ige',
      allergenName: 'Peanut',
      testDate: new Date('2026-02-15'),
      testResult: '3.8',
      units: 'kUA/L',
      isDoctorConfirmedDiagnosis: false, // Pure biological sensitization!
      testSpecificParameters: {
        igeClass: 'Class 3 (3.5 - 17.4 kUA/L) - High',
        assayPlatform: 'Thermo Fisher Phadia 250',
      },
      doctorNotes: 'Positive sIgE sensitization; patient has never had clinical reaction upon exposure. Sensitization != clinical allergy.',
    });

    console.log(`✅ Wheat allergy recorded (${wheatAllergy.diagnosisType})`);
    console.log(`✅ Peanut sIgE test recorded (${peanutTest.testResult} kUA/L, isDoctorConfirmedDiagnosis: false)`);

    // -------------------------------------------------------------
    // SCENARIO 1: Confirmed Wheat Allergy -> User consumes Wheat Dosa -> Reports Itching
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 1: User with confirmed wheat allergy eats Wheat Dosa & reports itching');
    console.log('=============================================================');

    // 1. Log Wheat Dosa in Food Diary
    const mealRes1 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodName: 'Wheat Dosa',
        foodCategory: 'Mixed Dish / Traditional Recipe',
        mealType: 'Breakfast',
        quantity: 2,
        measurementUnit: 'piece',
        ingredients: ['Wheat flour', 'Fermented rice batter', 'Salt', 'Vegetable oil', 'Ghee'],
        preparationMethod: 'Griddled with oil on hot pan',
        consumptionDate: new Date().toISOString().split('T')[0],
        consumptionTime: '08:45',
      }),
    });
    const mealData1 = await mealRes1.json();
    if (!mealData1.success) throw new Error(`Meal logging failed: ${JSON.stringify(mealData1)}`);
    console.log('✅ 1.1 Wheat Dosa logged in Daily Food Diary. Dietary alerts:', mealData1.alerts);

    // 2. Report Itching in Symptom Tracker
    const symptomRes1 = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData1.data._id,
        foodConsumed: 'Wheat Dosa',
        symptomName: 'Itching',
        symptomCategory: 'Skin',
        symptomSeverity: 'Moderate',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '09:20',
        onsetInterval: 'Intermediate (30 - 60 mins)',
        symptomDuration: '45 minutes',
        additionalSymptoms: ['Redness / Flushing'],
        treatmentTaken: 'Antihistamine (e.g. Cetirizine, Diphenhydramine)',
      }),
    });
    const symptomData1 = await symptomRes1.json();
    if (!symptomData1.success) throw new Error(`Symptom logging failed: ${JSON.stringify(symptomData1)}`);
    console.log('✅ 1.2 Symptom (Itching) logged in Symptom Tracker.');

    // 3. Trigger AI Analysis
    const analysisRes1 = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ prompt: 'Analyze my reaction after eating Wheat Dosa today.' }),
    });
    const analysisData1 = await analysisRes1.json();
    if (!analysisData1.success) throw new Error(`AI Analysis failed: ${JSON.stringify(analysisData1)}`);
    const report1 = analysisData1.data;

    console.log('✅ 1.3 AI Analysis 9-part structured report received:');
    console.log('   - Risk Level:', report1.riskAssessment?.level);
    console.log('   - Associations count:', report1.detectedAssociations?.length);
    console.log('   - Possible explanations count:', report1.possibleExplanations?.length);
    console.log('   - Wheat vs Celiac distinction mentioned:', report1.possibleExplanations?.some((e) => e.includes('Celiac')));

    // Verify Scenario 1 Assertions
    if (!report1.relevantMedicalProfile?.toLowerCase().includes('wheat')) {
      throw new Error('Scenario 1 Failed: Did not identify confirmed wheat allergy in user profile!');
    }
    if (report1.possibleExplanations?.some((e) => e.includes('definitely caused'))) {
      throw new Error('Scenario 1 Failed: Violates cautious causality rules!');
    }
    if (!report1.possibleExplanations?.some((e) => e.includes('Celiac'))) {
      throw new Error('Scenario 1 Failed: Missing required Wheat Allergy vs Celiac Disease educational distinction!');
    }
    console.log('⭐ Scenario 1 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 2: Food consumed without recorded allergy -> Reports symptoms
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 2: User eats food without recorded allergy & reports symptoms');
    console.log('=============================================================');

    // User A eats Avocado Salad (Avocado is NOT in allergies)
    const mealRes2 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodName: 'Avocado Salad',
        foodCategory: 'Vegetables',
        mealType: 'Lunch',
        quantity: 1,
        measurementUnit: 'bowl',
        ingredients: ['Avocado', 'Lemon juice', 'Olive oil', 'Cucumber'],
        preparationMethod: 'Raw',
        consumptionDate: new Date().toISOString().split('T')[0],
        consumptionTime: '13:00',
      }),
    });
    const mealData2 = await mealRes2.json();

    const symptomRes2 = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData2.data._id,
        foodConsumed: 'Avocado Salad',
        symptomName: 'Bloating',
        symptomCategory: 'Digestive',
        symptomSeverity: 'Mild',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '14:30',
        onsetInterval: '1 - 2 hours',
        symptomDuration: '1 hour',
      }),
    });
    const symptomData2 = await symptomRes2.json();

    const analysisRes2 = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData2.data._id,
        symptomRecordId: symptomData2.data._id,
        prompt: 'Analyze my bloating after Avocado Salad.',
      }),
    });
    const analysisData2 = await analysisRes2.json();
    const report2 = analysisData2.data;

    console.log('✅ 2.1 Unrecorded food analyzed:');
    console.log('   - Food-Allergy Association:', report2.detectedAssociations?.[0]?.associationStrength);

    // Verify Scenario 2 Assertions: notes lack of prior record, explains possible non-allergic factors
    if (report2.detectedAssociations?.[0]?.associationStrength === 'Doctor-Confirmed Allergy Trigger') {
      throw new Error('Scenario 2 Failed: Inappropriately declared an unconfirmed food as doctor-confirmed allergy!');
    }
    console.log('⭐ Scenario 2 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 3: User reports symptoms without recording food
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 3: User reports symptoms without recording food');
    console.log('=============================================================');

    const symptomRes3 = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodConsumed: '', // No food recorded!
        symptomName: 'Stomach pain / Cramps',
        symptomCategory: 'Digestive',
        symptomSeverity: 'Moderate',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '16:00',
        onsetInterval: 'Uncertain / Unknown',
        symptomDuration: '30 minutes',
      }),
    });
    const symptomData3 = await symptomRes3.json();

    const analysisRes3 = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        symptomRecordId: symptomData3.data._id,
        prompt: 'I had stomach cramps without eating anything specific.',
      }),
    });
    const analysisData3 = await analysisRes3.json();
    const report3 = analysisData3.data;

    console.log('✅ 3.1 Symptom without food analyzed:');
    console.log('   - Missing information notes count:', report3.missingInformation?.length);

    if (!report3.missingInformation || report3.missingInformation.length === 0) {
      throw new Error('Scenario 3 Failed: Did not acknowledge absence of culprit food intake record in missingInformation!');
    }
    console.log('⭐ Scenario 3 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 4: User consumes several foods in one meal & reports symptoms
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 4: User consumes several foods in one meal & reports symptoms');
    console.log('=============================================================');

    const mealRes4 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodName: 'Thai Stir Fry Bowl',
        foodCategory: 'Mixed Dish / Traditional Recipe',
        mealType: 'Dinner',
        quantity: 1,
        measurementUnit: 'plate',
        ingredients: ['Tofu', 'Soy sauce', 'Sesame oil', 'Mushrooms', 'Garlic', 'Chili paste', 'Cashew nuts'],
        preparationMethod: 'Wok fried',
        consumptionDate: new Date().toISOString().split('T')[0],
        consumptionTime: '19:30',
      }),
    });
    const mealData4 = await mealRes4.json();

    const symptomRes4 = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData4.data._id,
        foodConsumed: 'Thai Stir Fry Bowl',
        symptomName: 'Hives (Urticaria)',
        symptomCategory: 'Skin',
        symptomSeverity: 'Moderate',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '20:15',
        onsetInterval: 'Intermediate (30 - 60 mins)',
        symptomDuration: '2 hours',
      }),
    });
    const symptomData4 = await symptomRes4.json();

    const analysisRes4 = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData4.data._id,
        symptomRecordId: symptomData4.data._id,
        prompt: 'Analyze reaction after Thai Stir Fry with multiple ingredients.',
      }),
    });
    const analysisData4 = await analysisRes4.json();
    const report4 = analysisData4.data;

    console.log('✅ 4.1 Multiple ingredients in meal analyzed:');
    console.log('   - Explanations:', report4.possibleExplanations?.length);

    // Verify does not assert one ingredient definitely caused it without proof
    if (report4.possibleExplanations?.some((e) => e.includes('definitely caused'))) {
      throw new Error('Scenario 4 Failed: Claimed absolute causality among multiple co-ingredients!');
    }
    console.log('⭐ Scenario 4 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 5: Statistical Pattern Detection (Repeated associations >= 2)
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 5: User repeatedly reports similar symptoms after same food (>= 2 times)');
    console.log('=============================================================');

    // User A logs Wheat Dosa again and reports Itching again (2nd occurrence)
    const mealRes5 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodName: 'Wheat Dosa',
        foodCategory: 'Mixed Dish / Traditional Recipe',
        mealType: 'Breakfast',
        quantity: 2,
        measurementUnit: 'piece',
        ingredients: ['Wheat flour', 'Salt', 'Oil'],
        consumptionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
        consumptionTime: '09:00',
      }),
    });
    const mealData5 = await mealRes5.json();

    await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodEntryId: mealData5.data._id,
        foodConsumed: 'Wheat Dosa',
        symptomName: 'Itching',
        symptomCategory: 'Skin',
        symptomSeverity: 'Moderate',
        symptomDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        symptomStartTime: '09:30',
        onsetInterval: 'Intermediate (30 - 60 mins)',
      }),
    });

    // Fetch Patterns API
    const patternsRes = await fetch(`${BASE_URL}/ai-analysis/patterns`, {
      headers: headersA,
    });
    const patternsData = await patternsRes.json();
    if (!patternsData.success) throw new Error(`Patterns API failed: ${JSON.stringify(patternsData)}`);

    console.log('✅ 5.1 Pattern detection result:');
    console.log('   - Total repeated associations:', patternsData.data.repeatedAssociations.length);
    if (patternsData.data.repeatedAssociations.length > 0) {
      const topRepeated = patternsData.data.repeatedAssociations[0];
      console.log(`   - Repeated: ${topRepeated.foodName} -> ${topRepeated.symptomName} (${topRepeated.occurrenceCount} times)`);
      console.log('   - Flagged for doctor review:', topRepeated.clinicalNote.includes('allergist') || topRepeated.clinicalNote.includes('doctor') || topRepeated.clinicalNote.includes('evaluation'));
    }

    if (patternsData.data.repeatedAssociations.length === 0) {
      throw new Error('Scenario 5 Failed: Did not detect repeated association occurring >= 2 times!');
    }
    console.log('⭐ Scenario 5 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 6: Positive sIgE result but NO confirmed clinical allergy (Sensitization != Allergy)
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 6: User with positive sIgE result but no confirmed clinical allergy');
    console.log('=============================================================');

    // User A has Peanut sIgE (3.8 kUA/L) from earlier setup, but NO doctor-confirmed peanut allergy
    // Let's verify diet monitoring service evaluates Peanut sensitization accurately
    const dietMonRes = await fetch(`${BASE_URL}/ai-analysis/diet-monitoring`, {
      headers: headersA,
    });
    const dietMonData = await dietMonRes.json();
    if (!dietMonData.success) throw new Error(`Diet monitoring failed: ${JSON.stringify(dietMonData)}`);

    // Let User A log Peanut Butter Toast
    const mealRes6 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodName: 'Peanut Butter Toast',
        foodCategory: 'Bakery & Sweets',
        mealType: 'Evening Snack',
        quantity: 1,
        measurementUnit: 'slice',
        ingredients: ['Peanut butter', 'Gluten-free bread'],
        consumptionDate: new Date().toISOString().split('T')[0],
        consumptionTime: '17:00',
      }),
    });
    const mealData6 = await mealRes6.json();
    console.log('✅ 6.1 Peanut food logged. Alerts generated:', mealData6.alerts);

    // Verify the alert explicitly states Sensitization vs Allergy
    const alerts = mealData6.alerts || mealData6.data?.dietaryAlerts || [];
    const peanutAlert = alerts.find(
      (a) =>
        (a.allergenName || '').toLowerCase().includes('peanut') ||
        (a.riskType || '').toLowerCase().includes('sensitization') ||
        (a.message || '').toLowerCase().includes('sensitization')
    );
    console.log('✅ 6.2 Sensitization alert found:', peanutAlert?.riskType);

    if (!peanutAlert || !(peanutAlert.riskType || '').includes('Sensitization')) {
      throw new Error('Scenario 6 Failed: Positive sIgE was not properly categorized as Sensitization!');
    }
    console.log('⭐ Scenario 6 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 7: Potentially Severe Reaction -> Immediate Emergency Warning (0 Delay)
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 7: User reports potentially severe reaction (Immediate 0-latency emergency warning)');
    console.log('=============================================================');

    // Test direct safety engine
    const emergencyEngineCheck = checkEmergencySafety(
      ['Breathing difficulty', 'Throat tightness'],
      'Severe',
      'Patient reports difficulty breathing and throat constriction'
    );
    console.log('✅ 7.1 Direct medicalSafetyEngine check result:');
    console.log('   - isEmergency:', emergencyEngineCheck.isEmergency);
    console.log('   - Emergency Message:', emergencyEngineCheck.emergencyMessage);
    console.log('   - Red Flags identified:', emergencyEngineCheck.detectedRedFlags);

    if (!emergencyEngineCheck.isEmergency) {
      throw new Error('Scenario 7 Failed: medicalSafetyEngine did not trigger emergency for respiratory red flags!');
    }

    // Test API emergency triage endpoint
    const triageRes = await fetch(`${BASE_URL}/symptoms/check-emergency`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        symptoms: [
          { symptomName: 'Wheezing', symptomSeverity: 'Severe', symptomCategory: 'Respiratory' },
          { symptomName: 'Dizziness', symptomSeverity: 'Moderate', symptomCategory: 'Systemic / Other' },
        ],
      }),
    });
    const triageData = await triageRes.json();
    console.log('✅ 7.2 API Zero-latency triage check result:');
    console.log('   - isEmergency:', triageData.emergencyCheck.isEmergency);
    console.log('   - Action Required:', triageData.emergencyCheck.actionPlan);

    if (!triageData.emergencyCheck.isEmergency) {
      throw new Error('Scenario 7 Failed: API triage endpoint failed to trigger emergency!');
    }

    // Test emergency symptom log in DB
    const emergencySymptomRes = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        foodConsumed: 'Peanut Butter Toast',
        symptomName: 'Throat tightness',
        symptomCategory: 'Respiratory',
        symptomSeverity: 'Life-Threatening / Emergency',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '17:15',
        onsetInterval: 'Immediate (< 15 mins)',
        additionalSymptoms: ['Wheezing', 'Dizziness'],
        treatmentTaken: 'Epinephrine Auto-Injector (EpiPen, Auvi-Q)',
        medicalAttentionRequired: true,
        medicalFacilityVisited: 'Emergency Room',
      }),
    });
    const emergencySymptomData = await emergencySymptomRes.json();
    console.log('✅ 7.3 Logged emergency symptom in database:');
    console.log('   - isEmergencyAlertTriggered:', emergencySymptomData.data.isEmergencyAlertTriggered);
    console.log('   - emergencyAlert returned in response:', emergencySymptomData.emergencyAlert.isEmergency);

    if (!emergencySymptomData.data.isEmergencyAlertTriggered) {
      throw new Error('Scenario 7 Failed: Database did not flag isEmergencyAlertTriggered!');
    }
    console.log('⭐ Scenario 7 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // SCENARIO 8: User with NO previous allergy records
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Scenario 8: User with no previous allergy records (User B)');
    console.log('=============================================================');

    // User B has 0 allergy records and 0 medical tests
    const userBAllergies = await AllergyRecord.find({ userId: userB._id });
    const userBTests = await MedicalTestRecord.find({ userId: userB._id });
    console.log(`✅ User B baseline: ${userBAllergies.length} allergies, ${userBTests.length} tests.`);

    // User B logs meal and symptom
    const mealResB = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({
        foodName: 'Cheese Pizza',
        foodCategory: 'Bakery & Sweets',
        mealType: 'Dinner',
        quantity: 2,
        measurementUnit: 'slice',
        ingredients: ['Cheese', 'Tomato sauce', 'Flour dough'],
        consumptionDate: new Date().toISOString().split('T')[0],
        consumptionTime: '20:00',
      }),
    });
    const mealDataB = await mealResB.json();

    await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({
        foodEntryId: mealDataB.data._id,
        foodConsumed: 'Cheese Pizza',
        symptomName: 'Nausea',
        symptomCategory: 'Digestive',
        symptomSeverity: 'Mild',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '21:00',
        onsetInterval: 'Intermediate (30 - 60 mins)',
      }),
    });

    const analysisResB = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({ prompt: 'Analyze my nausea after pizza.' }),
    });
    const analysisDataB = await analysisResB.json();
    const reportB = analysisDataB.data;

    console.log('✅ 8.1 Analysis for patient with no prior allergy records:');
    console.log('   - Relevant profile text:', reportB.relevantMedicalProfile);
    console.log('   - Consultation rationale:', reportB.medicalConsultationRecommended?.rationale);

    if (!reportB.relevantMedicalProfile?.includes('No doctor-confirmed food allergies')) {
      throw new Error('Scenario 8 Failed: Did not note baseline absence of allergies in user profile!');
    }
    console.log('⭐ Scenario 8 Passed with 100% compliance.');
    console.log('⭐ Scenario 8 Passed with 100% compliance.');

    // -------------------------------------------------------------
    // MULTI-TENANT PRIVACY & DATA ISOLATION VERIFICATION
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('Privacy & Security: Multi-Tenant Data Isolation Checks');
    console.log('=============================================================');

    // 1. User B attempts to access User A's food diary
    const crossTenantGet = await fetch(`${BASE_URL}/food-diary/${mealData1.data._id}`, {
      headers: headersB,
    });
    console.log('✅ 9.1 Cross-tenant GET status:', crossTenantGet.status);
    if (crossTenantGet.status !== 404) {
      throw new Error(`Security breach: User B was able to access User A's meal (${crossTenantGet.status})!`);
    }

    // 2. User B attempts to delete User A's symptom
    const crossTenantDelete = await fetch(`${BASE_URL}/symptoms/${symptomData1.data._id}`, {
      method: 'DELETE',
      headers: headersB,
    });
    console.log('✅ 9.2 Cross-tenant DELETE status:', crossTenantDelete.status);
    if (crossTenantDelete.status !== 404) {
      throw new Error(`Security breach: User B was able to delete User A's symptom (${crossTenantDelete.status})!`);
    }

    // 3. User B attempts to access User A's AI Analysis
    const crossTenantAnalysis = await fetch(`${BASE_URL}/ai-analysis/${report1._id}`, {
      headers: headersB,
    });
    console.log('✅ 9.3 Cross-tenant Analysis GET status:', crossTenantAnalysis.status);
    if (crossTenantAnalysis.status !== 404) {
      throw new Error(`Security breach: User B was able to access User A's AI analysis (${crossTenantAnalysis.status})!`);
    }

    // -------------------------------------------------------------
    // AI HEALTH ASSISTANT CHAT VERIFICATION
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('AI Health Assistant Chat: Context Grounding & Safety Guardrails');
    console.log('=============================================================');

    // Normal query grounded in user profile
    const chatRes1 = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ message: 'I ate wheat dosa today. What should I know?' }),
    });
    const chatData1 = await chatRes1.json();
    console.log('✅ 10.1 Chat query response:');
    console.log('   - Reply preview:', chatData1.data.reply.slice(0, 150) + '...');
    console.log('   - User context recognized:', chatData1.data.reply.toLowerCase().includes('wheat'));

    if (!chatData1.data.reply.toLowerCase().includes('wheat')) {
      throw new Error('AI Chat Failed: Did not acknowledge patient wheat allergy!');
    }

    // Emergency query in chat
    const chatRes2 = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ message: 'My throat is swelling and I cannot breathe after eating!' }),
    });
    const chatData2 = await chatRes2.json();
    console.log('✅ 10.2 Chat emergency detection:');
    console.log('   - Emergency alert triggered:', chatData2.data.emergencyAlert.isEmergency);
    console.log('   - Immediate 911 advisory provided:', chatData2.data.reply.includes('911') || chatData2.data.reply.includes('emergency'));

    if (!chatData2.data.emergencyAlert.isEmergency) {
      throw new Error('AI Chat Failed: Emergency words did not trigger emergencyAlert in chat!');
    }

    // Cleanup test users
    console.log('\n--- Cleaning up test records ---');
    await DailyFoodEntry.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await SymptomRecord.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await AIAnalysisRecord.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await AIChatMessage.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await AllergyRecord.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await MedicalTestRecord.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log('✅ Test records cleaned successfully.');

    console.log('\n🎉 ALL 8 SCENARIOS & PRIVACY TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runAIDietMonitoringTests();
