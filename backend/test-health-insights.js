/**
 * Comprehensive Verification Test Suite:
 * AI Assistant Removal & Health Insights Verification with OCR and ML Preservation
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import DailyFoodEntry from './src/models/DailyFoodEntry.js';
import SymptomRecord from './src/models/SymptomRecord.js';
import AIAnalysisRecord from './src/models/AIAnalysisRecord.js';
import { generateToken } from './src/middleware/authMiddleware.js';
import { analyzeMedicalDocument } from './src/services/ocr/documentUnderstandingService.js';
import { checkEmergencySafety } from './src/services/ai/medicalSafetyEngine.js';

dotenv.config();
process.env.NODE_ENV = 'test';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
const TEST_PORT = 5058;

async function runHealthInsightsVerification() {
  const { default: app } = await import('./src/server.js');
  console.log('🧪 Starting Health Insights & System Preservation Verification Suite...\n');

  let server;
  let testUser;

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ 1. MongoDB Connected successfully.');

    server = app.listen(TEST_PORT);
    const BASE_URL = `http://localhost:${TEST_PORT}/api`;

    // 1. Create a Clean Test Patient
    testUser = await User.create({
      name: 'Clinical Test Patient',
      email: `test.insights.${Date.now()}@example.com`,
      password: 'Password123!',
      dob: new Date('1992-04-10'),
      age: 32,
      sex: 'Female',
      phone: '9876543210',
      address: '10 Medical Center Blvd, Bangalore',
    });
    const token = generateToken(testUser._id);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log('✅ 2. Test user created:', testUser.email);

    // 2. VERIFY COMPLETE AI CHATBOT EXCLUSION (404)
    console.log('\n--- VERIFYING COMPLETE AI CHATBOT REMOVAL ---');
    const aiChatEndpoints = [
      { method: 'POST', path: '/ai-chat/message', body: { message: 'hello' } },
      { method: 'GET', path: '/ai-chat/history' },
      { method: 'DELETE', path: '/ai-chat/history' },
      { method: 'GET', path: '/ai-chat/status' },
    ];

    for (const ep of aiChatEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      console.log(`   - ${ep.method} ${ep.path} -> Status: ${res.status}`);
      if (res.status !== 404) {
        throw new Error(`AI Chat endpoint ${ep.path} still active! Got status ${res.status}`);
      }
    }
    console.log('✅ 3. All conversational AI Assistant endpoints confirmed 404 (excised completely).');

    // 3. SEED CLINICAL DATA: Confirmed Allergy + Unconfirmed Sensitization
    console.log('\n--- SEEDING PATIENT CLINICAL CONTEXT ---');
    await AllergyRecord.create({
      userId: testUser._id,
      allergenName: 'Peanut',
      allergenCategory: 'Peanuts',
      severity: 'Severe / Anaphylactic Risk',
      diagnosisType: 'Doctor-Confirmed Diagnosis',
      reactionDescription: 'Hives and facial swelling upon ingestion',
      knownReactions: ['Hives (Urticaria)', 'Facial Swelling'],
      emergencyMedication: 'EpiPen 0.3mg',
      doctorName: 'Dr. Sarah Smith, Allergist',
      diagnosisDate: new Date('2023-01-15'),
    });

    await MedicalTestRecord.create({
      userId: testUser._id,
      testName: 'Shrimp Specific IgE Blood Test',
      testType: 'Specific IgE Blood Test',
      testCategory: 'specific_ige',
      allergenName: 'Shrimp',
      testResult: '2.4',
      units: 'kUA/L',
      referenceRange: '< 0.35 kUA/L',
      isDoctorConfirmedDiagnosis: false,
      doctorNotes: 'Positive sIgE sensitization; unconfirmed clinical allergy.',
      testDate: new Date('2024-03-10'),
    });
    console.log('✅ 4. Patient profile seeded: Peanut (Doctor-Confirmed) & Shrimp (Sensitization Only).');

    // 4. TEST DAILY FOOD DIARY & DETERMINISTIC ALLERGEN CROSS-MATCHING
    console.log('\n--- TESTING FOOD DIARY ALLERGEN MATCHING ---');
    const diaryRes = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        foodName: 'Thai Peanut Noodle Bowl',
        foodCategory: 'Mixed Dish / Traditional Recipe',
        mealType: 'Dinner',
        quantity: 1,
        measurementUnit: 'bowl',
        ingredients: ['Rice Noodles', 'Crushed Peanuts', 'Peanut Sauce', 'Shrimp', 'Lime'],
        consumptionDate: new Date().toISOString().split('T')[0],
      }),
    });
    const diaryData = await diaryRes.json();
    console.log('✅ 5. Food diary logged. Status:', diaryRes.status);
    console.log('   - Generated Alerts Count:', diaryData.alerts?.length);
    if (!diaryData.alerts || diaryData.alerts.length < 2) {
      throw new Error('Allergen cross-matching failed to detect Peanut (confirmed) and Shrimp (sensitization)!');
    }
    console.log('   - Alert 1 (Confirmed):', diaryData.alerts[0]?.riskType);
    console.log('   - Alert 2 (Sensitization):', diaryData.alerts[1]?.riskType);

    // 5. TEST SYMPTOM JOURNAL & IMMEDIATE EMERGENCY TRIAGE
    console.log('\n--- TESTING SYMPTOM JOURNAL & EMERGENCY TRIAGE ---');
    const severeTriage = checkEmergencySafety(['difficulty breathing', 'swelling of throat']);
    console.log('   - Medical Safety Engine Emergency Check:', severeTriage.isEmergency);
    if (!severeTriage.isEmergency) {
      throw new Error('Medical Safety Engine failed on severe symptoms!');
    }

    const symptomRes = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        foodEntryId: diaryData.data._id,
        foodConsumed: 'Thai Peanut Noodle Bowl',
        symptomName: 'Mild Hives on Forearm',
        symptomCategory: 'Skin',
        symptomSeverity: 'Mild',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '19:45',
        notes: 'Noticeable 45 mins after meal',
      }),
    });
    const symptomData = await symptomRes.json();
    console.log('✅ 6. Mild symptom logged. Status:', symptomRes.status);

    // 6. TEST DETERMINISTIC HEALTH INSIGHTS ANALYSIS ENGINE
    console.log('\n--- TESTING DETERMINISTIC HEALTH INSIGHTS ENGINE ---');
    const analyzeRes = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers,
    });
    const analyzeData = await analyzeRes.json();
    console.log('✅ 7. Health Insights generated. Status:', analyzeRes.status);
    console.log('   - Risk Level:', analyzeData.data?.riskAssessment?.level);
    console.log('   - Detected Associations:', analyzeData.data?.detectedAssociations?.length);
    console.log('   - Possible Explanations:', analyzeData.data?.possibleExplanations?.length);
    console.log('   - Physician Consultation Rationale:', analyzeData.data?.medicalConsultationRecommended?.rationale?.slice(0, 100) + '...');
    console.log('   - Missing Information Items:', analyzeData.data?.missingInformation?.length);

    if (!analyzeData.data?.riskAssessment?.level || !Array.isArray(analyzeData.data?.detectedAssociations)) {
      throw new Error('Health Insights analysis missing essential clinical structure!');
    }

    // 7. TEST STATISTICAL PATTERN DETECTION ENGINE (ML RECURRENCE)
    console.log('\n--- TESTING STATISTICAL PATTERN RECURRENCE (ML) ---');
    // Log second identical incident to trigger recurrence threshold (count >= 2)
    const mealRes2 = await fetch(`${BASE_URL}/food-diary`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        foodName: 'Thai Peanut Noodle Bowl',
        foodCategory: 'Mixed Dish / Traditional Recipe',
        mealType: 'Lunch',
        quantity: 1,
        measurementUnit: 'serving',
        ingredients: ['Peanuts', 'Rice noodles'],
        consumptionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      }),
    });
    const mealData2 = await mealRes2.json();

    await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        foodEntryId: mealData2.data._id,
        foodConsumed: 'Thai Peanut Noodle Bowl',
        symptomName: 'Mild Hives on Forearm',
        symptomCategory: 'Skin',
        symptomSeverity: 'Mild',
        symptomDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        symptomStartTime: '13:00',
      }),
    });

    const patternsRes = await fetch(`${BASE_URL}/ai-analysis/patterns`, {
      headers,
    });
    const patternsData = await patternsRes.json();
    console.log('✅ 8. Statistical Pattern Detection results:');
    console.log('   - Patterns count:', patternsData.data?.totalPatternsDetected);
    console.log('   - Repeated patterns count:', patternsData.data?.repeatedPatternsCount);

    const patternsList = patternsData.data?.detectedPatterns || [];
    if (patternsList.length > 0) {
      console.log(`   - Identified Association: "${patternsList[0].foodName}" -> "${patternsList[0].symptomName}" (Count: ${patternsList[0].occurrenceCount})`);
      console.log('   - Clinical Recommendation:', patternsList[0].clinicalRecommendation?.slice(0, 80) + '...');
    }
    if (patternsList.length === 0 || patternsList[0].occurrenceCount < 2) {
      throw new Error('Statistical pattern detection failed to identify recurring association!');
    }

    // 8. TEST OCR PARSING PRESERVATION (NO LLM DEPENDENCY)
    console.log('\n--- TESTING OCR SYSTEM PRESERVATION (100% NON-LLM) ---');
    const sampleTabularReport = `
QUEST DIAGNOSTICS IMMUNOLOGY LABORATORY
Ordering Physician: Dr. Marcus Bennett, MD
Patient Name: Test Patient    Age: 32 Y/O    Sex: F
Collection Date: 2026-06-15

ALLERGEN SPECIFIC IgE REPORT
Test Name                    Result    Flag    Units      Reference Interval
Peanut (f13) IgE             14.8       H      kUA/L      < 0.35 kUA/L
Cow's Milk (f2) IgE          0.12              kUA/L      < 0.35 kUA/L
Wheat (f4) IgE               3.40       H      kUA/L      < 0.35 kUA/L

CLINICAL VITALS & OBSERVATIONS
Blood Pressure: 110/70 mmHg
Fasting Blood Sugar: 92 mg/dL
`;

    const parsedOCR = analyzeMedicalDocument(sampleTabularReport);
    console.log('✅ 9. Non-LLM OCR Document Understanding parsed:');
    console.log('   - Detected tests count:', parsedOCR.allergyTests?.length);
    console.log('   - Lab Name detected:', parsedOCR.clinicOrLabName);
    console.log('   - Doctor Name detected:', parsedOCR.doctorName);
    console.log('   - Missing Cholesterol is NULL:', parsedOCR.generalMeasurements.cholesterol === null);
    if (!parsedOCR.allergyTests || parsedOCR.allergyTests.length < 3) {
      throw new Error('OCR Document Understanding failed to extract structured allergy tests!');
    }
    const peanutTest = parsedOCR.allergyTests.find((t) => t.allergenName === 'Peanut');
    console.log('   - Peanut Test Extracted Result:', peanutTest?.testResult, peanutTest?.units, 'Ref:', peanutTest?.referenceRange);
    if (!peanutTest || peanutTest.testResult !== '14.8' || peanutTest.units !== 'kUA/L') {
      throw new Error('OCR parser failed to accurately extract Peanut quantitative result (14.8 kUA/L)!');
    }

    // Cleanup
    console.log('\n--- CLEANING UP TEST DATA ---');
    await DailyFoodEntry.deleteMany({ userId: testUser._id });
    await SymptomRecord.deleteMany({ userId: testUser._id });
    await AIAnalysisRecord.deleteMany({ userId: testUser._id });
    await AllergyRecord.deleteMany({ userId: testUser._id });
    await MedicalTestRecord.deleteMany({ userId: testUser._id });
    await User.deleteMany({ _id: testUser._id });
    console.log('✅ 10. Cleaned test patient records.');

    console.log('\n🎉 ALL HEALTH INSIGHTS, OCR, AND ML VERIFICATIONS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Health Insights Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runHealthInsightsVerification();
