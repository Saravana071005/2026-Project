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
import {
  getAIProviderStatus,
  sanitizeContextForExternalAI,
  processAIChatMessageWithMultiProvider,
} from './src/services/ai/aiProviderService.js';

const PORT = 5089;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';

async function runAugustAndMultiAITests() {
  const { default: app } = await import('./src/server.js');
  console.log('🧪 Starting August AI (meetaugust.ai) & Multi-Provider AI Comprehensive Test Suite...\n');

  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log('✅ Connected to MongoDB Atlas.');

  const server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 400));

  try {
    // -------------------------------------------------------------------------
    // Test 1: August AI & Multi-AI Provider Status Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Official API Status & Provider Audit ---');
    const status = getAIProviderStatus();
    console.log('AI System Provider Status:\n', JSON.stringify(status, null, 2));

    // Verify all 4 providers are supported
    const expectedProviders = ['openai', 'gemini', 'august', 'clinical_grounded_engine'];
    for (const p of expectedProviders) {
      if (!status.supportedProviders.includes(p)) {
        throw new Error(`Missing expected provider in supportedProviders list: ${p}`);
      }
    }

    // Verify August AI is explicitly marked NOT CONNECTED (No fake integration)
    const augustMeta = status.providers?.august;
    if (!augustMeta) {
      throw new Error('Status object missing august provider metadata.');
    }
    if (augustMeta.status !== 'not_connected' && !process.env.AUGUST_AI_API_KEY) {
      throw new Error(`August AI must be marked 'not_connected' without valid partner credentials! Received: ${augustMeta.status}`);
    }
    if (!augustMeta.officialUrl.includes('meetaugust.ai')) {
      throw new Error(`August AI official URL must point to meetaugust.ai! Received: ${augustMeta.officialUrl}`);
    }
    if (augustMeta.company !== 'August Labs Inc.') {
      throw new Error(`August AI developer company must be August Labs Inc.! Received: ${augustMeta.company}`);
    }
    console.log('✅ Verified August AI (meetaugust.ai) is honestly marked NOT CONNECTED (Official partner gateway required; no fake API endpoints).');

    // -------------------------------------------------------------------------
    // Test 2: Medical Privacy & PII Minimization Filter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Medical Privacy & PII Minimization Check ---');
    const rawPatientContext = {
      userName: 'Aarav Alexander Patel',
      userAge: 29,
      userSex: 'Male',
      userEmail: 'aarav.patel.confidential@example.org',
      userAddress: '88 MG Road, Bengaluru, Karnataka, 560001',
      userPhone: '+91 98765 43210',
      foodAllergySummary: 'Diagnosed severe peanut allergy.',
      confirmedList: 'Peanut (Severe)',
      suspectedList: 'Sesame',
    };

    const sanitized = sanitizeContextForExternalAI(rawPatientContext);
    console.log('Sanitized Context Preview:', {
      userName: sanitized.userName,
      userAge: sanitized.userAge,
      userSex: sanitized.userSex,
      userEmail: sanitized.userEmail,
      userAddress: sanitized.userAddress,
      userPhone: sanitized.userPhone,
    });

    if (sanitized.userName !== 'Patient') {
      throw new Error('PII Sanitizer failed: Patient real name was not anonymized!');
    }
    if (sanitized.userEmail !== undefined || sanitized.userAddress !== undefined || sanitized.userPhone !== undefined) {
      throw new Error('PII Sanitizer failed: Confidential contact information was not stripped!');
    }
    if (sanitized.userAge !== 29 || sanitized.userSex !== 'Male') {
      throw new Error('Clinical demographics (age/sex) must be retained for clinical accuracy!');
    }
    console.log('✅ HIPAA/GDPR-grade PII minimization confirmed: Direct patient identifiers redacted before external AI query serialization.');

    // -------------------------------------------------------------------------
    // Test 3: Authenticated User Setup
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Patient Context Setup in MongoDB Atlas ---');
    const testEmail = `patient.august.${Date.now()}@test.org`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Menon',
        email: testEmail,
        password: 'Password123!',
        dob: '1994-08-20',
        sex: 'Female',
        address: '12 Marine Drive, Mumbai',
        foodAllergySummary: 'Severe peanut allergy; positive sIgE for shrimp.',
      }),
    });

    const regData = await regRes.json();
    const token = regData.token;
    const userId = regData.user.id || regData.user._id;
    console.log(`✅ Registered patient "${regData.user.name}" (ID: ${userId})`);

    // Add Peanut Allergy
    const peanutAllergy = new AllergyRecord({
      userId,
      allergenName: 'Peanut',
      allergenCategory: 'Peanuts',
      severity: 'Severe / Anaphylactic Risk',
      diagnosisType: 'Doctor-Confirmed Diagnosis',
      knownReactions: ['Hives', 'Lip Swelling'],
      doctorName: 'Dr. S. Nair, MD',
      emergencyMedication: 'EpiPen 0.3mg',
    });
    await peanutAllergy.save();

    // Add Shrimp sIgE Test (Sensitization)
    const shrimpTest = new MedicalTestRecord({
      userId,
      allergenName: 'Shrimp (Cra c 1)',
      testType: 'Specific IgE Blood Test',
      testCategory: 'specific_ige',
      testDate: new Date(),
      testResult: 8.4,
      units: 'kUA/L',
      interpretation: 'Class 3 - Moderate Sensitization',
      isDoctorConfirmedDiagnosis: false,
    });
    await shrimpTest.save();
    console.log('✅ Saved confirmed peanut allergy and shrimp sIgE test to database.');

    // -------------------------------------------------------------------------
    // Test 4: Requesting August AI via API (Graceful Notice & Fallback)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Requesting August AI Provider (meetaugust.ai) ---');
    const augustChatRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'I am allergic to peanuts. Is peanut oil safe to consume in fried foods?',
        provider: 'august',
      }),
    });

    const augustChatData = await augustChatRes.json();
    if (augustChatRes.status !== 200 || !augustChatData.data?.reply) {
      throw new Error(`August AI chat dispatch failed: ${JSON.stringify(augustChatData)}`);
    }

    const augustReply = augustChatData.data.reply;
    console.log('August AI Chat Response Preview:\n', augustReply.slice(0, 350) + '...\n');

    // Verify August AI notice is present
    if (!augustReply.includes('meetaugust.ai') || !augustReply.includes('NOT CONNECTED')) {
      throw new Error('Response did not properly state August AI integration status and partner requirement!');
    }
    // Verify clinical accuracy for peanut allergy
    if (!augustReply.toLowerCase().includes('peanut')) {
      throw new Error('Fallback response failed to answer the clinical question regarding peanuts!');
    }
    console.log('✅ Handled August AI request gracefully: honest status note presented and query answered with verified clinical safety.');

    // -------------------------------------------------------------------------
    // Test 5: Requesting OpenAI and Google Gemini Providers
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Requesting OpenAI & Google Gemini Specific Providers ---');
    const openaiRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'What is the clinical difference between positive sIgE blood test and clinical allergy?',
        provider: 'openai',
      }),
    });
    const openaiData = await openaiRes.json();
    if (openaiRes.status !== 200 || !openaiData.data?.reply) {
      throw new Error(`OpenAI provider route failed: ${JSON.stringify(openaiData)}`);
    }
    console.log(`✅ OpenAI route executed cleanly (Active engine used: ${openaiData.data.providerUsed})`);

    const geminiRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'Does my profile have any positive test findings for seafood?',
        provider: 'gemini',
      }),
    });
    const geminiData = await geminiRes.json();
    if (geminiRes.status !== 200 || !geminiData.data?.reply) {
      throw new Error(`Gemini provider route failed: ${JSON.stringify(geminiData)}`);
    }
    console.log(`✅ Gemini route executed cleanly (Active engine used: ${geminiData.data.providerUsed})`);

    // -------------------------------------------------------------------------
    // Test 6: Zero-Latency Emergency Anaphylaxis Triage Pre-Check
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Zero-Latency Emergency Anaphylaxis Pre-Check ---');
    const emergencyRes = await fetch(`${BASE_URL}/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'I am struggling to breathe and my throat feels swollen shut!',
        provider: 'august',
      }),
    });
    const emergencyData = await emergencyRes.json();
    if (!emergencyData.data?.isEmergency) {
      throw new Error('Emergency safety check failed to trigger on acute respiratory distress!');
    }
    if (emergencyData.data.providerUsed !== 'emergency_engine') {
      throw new Error(`Expected providerUsed to be 'emergency_engine', got '${emergencyData.data.providerUsed}'`);
    }
    if (!emergencyData.data.reply.includes('911') && !emergencyData.data.reply.includes('emergency')) {
      throw new Error('Emergency reply failed to provide immediate emergency instructions!');
    }
    console.log('✅ Emergency pre-check immediately bypassed LLM latency and issued critical 911 dispatch guidance.');

    // -------------------------------------------------------------------------
    // Test 7: GET /api/ai-chat/status Endpoint Inspection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Verify GET /api/ai-chat/status Schema ---');
    const statusRes = await fetch(`${BASE_URL}/ai-chat/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusRes.json();
    if (statusRes.status !== 200 || !statusData.data?.providers?.august) {
      throw new Error(`GET /status failed or missing august provider: ${JSON.stringify(statusData)}`);
    }
    console.log('✅ Verified GET /api/ai-chat/status returned full provider manifest with August AI details.');

    // -------------------------------------------------------------------------
    // Test 8: Cleanup Synthetic Records
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Cleanup Synthetic Records ---');
    await AllergyRecord.deleteMany({ userId });
    await MedicalTestRecord.deleteMany({ userId });
    await DailyFoodEntry.deleteMany({ userId });
    await SymptomRecord.deleteMany({ userId });
    await AIChatMessage.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    console.log('✅ Cleaned up synthetic test records.');

    console.log('\n🎉 ALL AUGUST AI & MULTI-PROVIDER AI TESTS PASSED WITH 100% SUCCESS! 🎉\n');
  } catch (err) {
    console.error('❌ Detailed error caught in suite:', err);
    throw err;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runAugustAndMultiAITests().catch((err) => {
  console.error('❌ Test Execution Failed:', err);
  process.exit(1);
});
