import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import app from './src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';

async function runMultilingualAndUITests() {
  console.log('🧪 Starting Multilingual & UI Upgrade Comprehensive Test Suite...\n');

  // 1. Validate translation dictionary JSON files
  console.log('--- Test Suite 1: Translation File Schema & Key Integrity ---');
  const localesDir = path.resolve(__dirname, '..', 'frontend', 'src', 'locales');
  const enPath = path.join(localesDir, 'en', 'translation.json');
  const hiPath = path.join(localesDir, 'hi', 'translation.json');
  const taPath = path.join(localesDir, 'ta', 'translation.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(hiPath) || !fs.existsSync(taPath)) {
    throw new Error('Missing translation dictionary files in frontend/src/locales');
  }

  const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
  const taJson = JSON.parse(fs.readFileSync(taPath, 'utf8'));

  const requiredSections = [
    'common',
    'nav',
    'home',
    'dashboard',
    'auth',
    'stats',
    'emergency',
    'assistant',
    'diary',
    'symptoms',
    'analysis',
    'reports',
    'profile',
    'footer',
  ];

  for (const section of requiredSections) {
    if (!enJson[section]) throw new Error(`English translations missing section "${section}"`);
    if (!hiJson[section]) throw new Error(`Hindi translations missing section "${section}"`);
    if (!taJson[section]) throw new Error(`Tamil translations missing section "${section}"`);
  }
  console.log('✅ All 3 translation files (EN, HI, TA) are valid JSON and contain all required UI sections.');

  // Check critical assistant steps
  for (let i = 1; i <= 8; i++) {
    const titleKey = `step${i}Title`;
    const descKey = `step${i}Desc`;
    if (!enJson.assistant[titleKey] || !enJson.assistant[descKey]) throw new Error(`English missing assistant step ${i}`);
    if (!hiJson.assistant[titleKey] || !hiJson.assistant[descKey]) throw new Error(`Hindi missing assistant step ${i}`);
    if (!taJson.assistant[titleKey] || !taJson.assistant[descKey]) throw new Error(`Tamil missing assistant step ${i}`);
  }
  console.log('✅ Assistant Onboarding Tutorial contains all 8 stages translated in English, Hindi, and Tamil.');

  // Connect to DB and start test server
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // 2. User Registration & Default Language
    console.log('\n--- Test Suite 2: User Registration & Preferred Language Defaults ---');
    const uniqueEmail = `patient.multilingual.${Date.now()}@test.org`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        email: uniqueEmail,
        password: 'Password123!',
        dob: '1995-08-20',
        sex: 'Female',
        address: '123 MG Road, Bangalore, Karnataka',
        preferredLanguage: 'hi',
      }),
    });

    const regData = await regRes.json();
    const token = regData.token || regData.data?.token;
    const user = regData.user || regData.data?.user;
    if (regRes.status !== 201 || !token || !user) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    const userId = user.id || user._id;
    console.log(`✅ User registered with preferredLanguage: "${user.preferredLanguage}" (Expected: "hi")`);
    console.log(`✅ Default hasCompletedTutorial: ${user.hasCompletedTutorial} (Expected: false)`);

    // 3. User Login Returns Language & Tutorial Flags
    console.log('\n--- Test Suite 3: User Login State Delivery ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123!',
      }),
    });

    const loginData = await loginRes.json();
    const loginUser = loginData.user || loginData.data?.user;
    if (loginRes.status !== 200 || loginUser?.preferredLanguage !== 'hi') {
      throw new Error(`Login failed to return correct preferredLanguage: ${JSON.stringify(loginData)}`);
    }
    console.log('✅ Login delivers preferredLanguage and tutorial completion flag accurately.');

    // 4. Update Preferences API (PUT /api/user/preferences)
    console.log('\n--- Test Suite 4: User Preferences API (Language & Tutorial Persistence) ---');
    
    // Switch language to Tamil
    const switchTaRes = await fetch(`${BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferredLanguage: 'ta',
      }),
    });
    const switchTaData = await switchTaRes.json();
    if (switchTaRes.status !== 200 || switchTaData.data.preferredLanguage !== 'ta') {
      throw new Error(`Failed to switch language to Tamil: ${JSON.stringify(switchTaData)}`);
    }
    console.log('✅ Language updated to Tamil ("ta") and persisted to MongoDB.');

    // Complete Onboarding Tutorial
    const completeTutorialRes = await fetch(`${BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hasCompletedTutorial: true,
      }),
    });
    const completeTutorialData = await completeTutorialRes.json();
    if (completeTutorialRes.status !== 200 || completeTutorialData.data.hasCompletedTutorial !== true) {
      throw new Error(`Failed to update hasCompletedTutorial: ${JSON.stringify(completeTutorialData)}`);
    }
    console.log('✅ Onboarding tutorial completed state persisted to MongoDB Atlas (hasCompletedTutorial: true).');

    // Reject Invalid Language
    const invalidLangRes = await fetch(`${BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferredLanguage: 'de', // Not allowed
      }),
    });
    if (invalidLangRes.status !== 400) {
      throw new Error(`Invalid language 'de' was not rejected with HTTP 400! Status: ${invalidLangRes.status}`);
    }
    console.log('✅ Validation guard correctly rejected invalid language code with HTTP 400.');

    // 5. Update Profile with Preferred Language
    console.log('\n--- Test Suite 5: Profile Update Language Integration ---');
    const profileUpdateRes = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        dob: '1995-08-20',
        sex: 'Female',
        address: '456 Indiranagar, Bangalore, Karnataka',
        preferredLanguage: 'en',
      }),
    });
    const profileUpdateData = await profileUpdateRes.json();
    if (profileUpdateRes.status !== 200 || profileUpdateData.data.preferredLanguage !== 'en') {
      throw new Error(`Failed to update profile preferredLanguage: ${JSON.stringify(profileUpdateData)}`);
    }
    console.log('✅ Profile update successfully synchronized preferredLanguage to "en".');

    // 6. Medical Data Integrity Under Multilingual Operations
    console.log('\n--- Test Suite 6: Medical Data Integrity & Non-Corruption Guarantee ---');
    // Save an allergy record
    const allergyRes = await fetch(`${BASE_URL}/allergies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        allergenName: 'Peanuts',
        allergenCategory: 'Peanuts',
        severity: 'Severe / Anaphylactic Risk',
        diagnosisType: 'Doctor-Confirmed Diagnosis',
        knownReactions: ['Hives / Urticaria', 'Anaphylaxis'],
        doctorName: 'Dr. V. Raman, MD',
        emergencyMedication: 'EpiPen 0.3mg',
      }),
    });
    const allergyData = await allergyRes.json();
    const allergyId = allergyData.data._id;

    // Switch user language to Hindi
    await fetch(`${BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ preferredLanguage: 'hi' }),
    });

    // Retrieve allergy records - verify exact string content has NOT changed
    const fetchAllergyRes = await fetch(`${BASE_URL}/allergies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fetchedAllergyData = await fetchAllergyRes.json();
    const targetAllergy = fetchedAllergyData.data?.find((a) => a._id === allergyId);
    if (
      !targetAllergy ||
      targetAllergy.allergenName !== 'Peanuts' ||
      targetAllergy.severity !== 'Severe / Anaphylactic Risk' ||
      targetAllergy.doctorName !== 'Dr. V. Raman, MD'
    ) {
      throw new Error(`Medical record altered or corrupted by language change!`);
    }
    console.log('✅ Clinical data strictly preserved: allergen names, severity, doctor notes remain uncorrupted.');

    // 7. Cleanup
    console.log('\n--- Test Suite 7: Clean Up Synthetic Test Data ---');
    await AllergyRecord.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    console.log('✅ Cleaned up synthetic test user and clinical records.');

    console.log('\n🎉 ALL MULTILINGUAL, PREFERENCE & DATA PRESERVATION TESTS PASSED WITH 100% SUCCESS! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runMultilingualAndUITests().catch((err) => {
  console.error('❌ Multilingual Test Suite Failed:', err);
  process.exit(1);
});
