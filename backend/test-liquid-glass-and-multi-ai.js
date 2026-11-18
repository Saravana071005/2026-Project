import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
process.env.NODE_ENV = 'test';

import User from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import DailyFoodEntry from './src/models/DailyFoodEntry.js';
import SymptomRecord from './src/models/SymptomRecord.js';
import AIChatMessage from './src/models/AIChatMessage.js';
import { getAIProviderStatus } from './src/services/ai/aiProviderService.js';

const PORT = 5088;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';

async function runLiquidGlassAndMultiAITests() {
  const { default: app } = await import('./src/server.js');
  console.log('🧪 Starting Liquid Glass & Multi-Provider AI Comprehensive Test Suite...\n');

  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log('✅ Connected to MongoDB Atlas.');

  const server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 400));

  try {
    // -------------------------------------------------------------------------
    // Test 1: AI Provider Status Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Multi-Provider AI Architecture Status ---');
    const status = getAIProviderStatus();
    console.log('Provider Status Overview:', status);

    if (!status.supportedProviders.includes('gemini') || !status.supportedProviders.includes('openai')) {
      throw new Error('AI architecture does not list both Gemini and OpenAI as supported providers.');
    }
    if (typeof status.hasGeminiKey !== 'boolean' || typeof status.hasOpenAIKey !== 'boolean') {
      throw new Error('Provider status must expose boolean credential flags, never raw secret strings.');
    }
    console.log('✅ Multi-provider architecture configuration validated (Gemini + OpenAI + Clinical Fallback Engine).');

    // -------------------------------------------------------------------------
    // Test 2: Authenticated User Setup with Rich Clinical Records
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Setting up Patient Context with Confirmed Allergies & Lab Findings ---');
    const testEmail = `patient.liquidglass.${Date.now()}@test.org`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: testEmail,
        password: 'Password123!',
        dob: '1996-04-12',
        sex: 'Male',
        address: '88 MG Road, Bengaluru, Karnataka',
        foodAllergySummary: 'Diagnosed with severe peanut and wheat allergy; prescribed EpiPen auto-injector.',
      }),
    });

    const regData = await regRes.json();
    const token = regData.token;
    const userId = regData.user.id || regData.user._id;
    console.log(`✅ Registered patient "${regData.user.name}" (ID: ${userId})`);

    // Add Doctor-Confirmed Wheat Allergy
    const wheatAllergy = new AllergyRecord({
      userId,
      allergenName: 'Wheat',
      allergenCategory: 'Wheat & Gluten',
      severity: 'Severe / Anaphylactic Risk',
      diagnosisType: 'Doctor-Confirmed Diagnosis',
      knownReactions: ['Hives / Urticaria', 'Throat Tightness'],
      doctorName: 'Dr. V. Raman, MD',
      emergencyMedication: 'EpiPen 0.3mg',
    });
    await wheatAllergy.save();

    // Add Peanut sIgE Test Finding (Sensitization)
    const peanutTest = new MedicalTestRecord({
      userId,
      allergenName: 'Peanut (Ara h 2)',
      testType: 'Specific IgE Blood Test',
      testCategory: 'specific_ige',
      testDate: new Date(),
      testResult: 14.8,
      units: 'kUA/L',
      interpretation: 'Class 3 - High Sensitization',
      isDoctorConfirmedDiagnosis: false,
    });
    await peanutTest.save();

    // Add a Daily Food Log
    const foodEntry = new DailyFoodEntry({
      userId,
      foodName: 'Wheat Dosa with Chutney',
      foodCategory: 'Mixed Dish / Traditional Recipe',
      mealType: 'Breakfast',
      quantity: 2,
      measurementUnit: 'piece',
      ingredients: ['wheat flour', 'rice flour', 'water', 'salt', 'oil'],
      consumptionDate: new Date(),
      consumptionTime: '08:30',
    });
    await foodEntry.save();
    console.log('✅ Saved confirmed allergy, sIgE test, and food diary entry to database.');

    // -------------------------------------------------------------------------
    // Test 3: Personalized AI Context Answering via API
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Personalized Medical Context Grounding in AI Chat ---');
    const chatRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'I ate wheat dosa today and felt itching. What should I do?',
      }),
    });

    const chatData = await chatRes.json();
    if (chatRes.status !== 200 || !chatData.data?.reply) {
      throw new Error(`Chat API failed: ${JSON.stringify(chatData)}`);
    }

    const reply = chatData.data.reply;
    console.log('AI Response Preview:\n', reply.slice(0, 300) + '...\n');

    // Verify profile match and clinical reasoning
    if (!reply.toLowerCase().includes('wheat') && !reply.toLowerCase().includes('profile')) {
      throw new Error('AI response failed to associate the query with the user\'s confirmed Wheat allergy!');
    }
    console.log(`✅ AI Response recognized patient's profile context (Provider Used: ${chatData.data.providerUsed})`);
    console.log(`✅ Sources cited: ${JSON.stringify(chatData.data.sources)}`);

    // -------------------------------------------------------------------------
    // Test 4: Zero-Latency Emergency Anaphylaxis Triage Pre-Check
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Zero-Latency Emergency Anaphylaxis Safety Trigger ---');
    const emergencyRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'My throat is tightening up and I am having trouble breathing!',
      }),
    });

    const emergencyData = await emergencyRes.json();
    if (emergencyData.status === 400 || !emergencyData.data?.isEmergency) {
      throw new Error('Emergency safety check failed to trigger isEmergency: true on acute respiratory distress!');
    }

    if (!emergencyData.data.reply.includes('911') && !emergencyData.data.reply.includes('emergency')) {
      throw new Error('Emergency reply failed to provide immediate 911 / emergency dispatch directions!');
    }
    console.log('✅ Emergency pre-check immediately flagged acute anaphylaxis and delivered urgent triage guidance.');

    // -------------------------------------------------------------------------
    // Test 5: Interactive 3D Anatomy Symptom Logging Integration
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: 3D Anatomical Body Symptom Logging to MongoDB Atlas ---');
    const symptomRes = await fetch(`${BASE_URL}/symptoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symptomName: 'Throat tightness / Constriction, Difficulty swallowing',
        symptomCategory: 'Respiratory',
        symptomSeverity: 'Severe',
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: '12:45',
        onsetInterval: 'Rapid (15 - 30 mins)',
        additionalSymptoms: ['Hoarseness / Change in voice'],
        additionalNotes: 'Logged via Interactive 3D Anatomy Model. Target Anatomical Region: Throat & Larynx.',
      }),
    });

    const symptomData = await symptomRes.json();
    if (symptomRes.status !== 201 || !symptomData.data?._id) {
      throw new Error(`Symptom creation failed: ${JSON.stringify(symptomData)}`);
    }

    const savedSymptomId = symptomData.data._id;
    console.log(`✅ Saved anatomical symptom record from 3D model (ID: ${savedSymptomId})`);
    console.log(`   Emergency alert triggered: ${symptomData.data.isEmergencyAlertTriggered}`);

    // Verify stored record in MongoDB
    const fetchedSymptom = await SymptomRecord.findById(savedSymptomId);
    if (!fetchedSymptom || !fetchedSymptom.additionalNotes.includes('3D Anatomy Model')) {
      throw new Error('Symptom record was not properly persisted in MongoDB Atlas with anatomical metadata.');
    }
    console.log('✅ Verified anatomical metadata persistence in MongoDB Atlas.');

    // -------------------------------------------------------------------------
    // Test 6: AI Status Endpoint Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Verify GET /api/ai-chat/status ---');
    const statusRes = await fetch(`${BASE_URL}/ai-chat/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusJson = await statusRes.json();
    if (statusRes.status !== 200 || !statusJson.data?.supportedProviders) {
      throw new Error(`GET /api/ai-chat/status failed: ${JSON.stringify(statusJson)}`);
    }
    console.log('✅ Active AI Status Endpoint verified:', statusJson.data);

    // -------------------------------------------------------------------------
    // Test 7: Cleanup Synthetic Records
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Cleanup Synthetic Records ---');
    await AllergyRecord.deleteMany({ userId });
    await MedicalTestRecord.deleteMany({ userId });
    await DailyFoodEntry.deleteMany({ userId });
    await SymptomRecord.deleteMany({ userId });
    await AIChatMessage.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    console.log('✅ Cleaned up synthetic patient and clinical logs.');

    console.log('\n🎉 ALL LIQUID GLASS & MULTI-PROVIDER AI TESTS PASSED WITH 100% SUCCESS! 🎉\n');
  } catch (err) {
    console.error('❌ Detailed error caught in suite:', err);
    throw err;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runLiquidGlassAndMultiAITests().catch((err) => {
  console.error('❌ Liquid Glass & Multi-AI Test Failed:', err);
  process.exit(1);
});
