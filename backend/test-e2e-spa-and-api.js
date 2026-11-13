import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import app from './src/server.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runSpaAndApiTests() {
  console.log('🧪 Starting Full E2E HTTP Suite: SPA Refresh, Routing Isolation & API Validation...\n');

  try {
    let retries = 50;
    while (mongoose.connection.readyState !== 1 && retries > 0) {
      await new Promise((r) => setTimeout(r, 100));
      retries--;
    }
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection timed out');
    }
    console.log('✅ Connected to MongoDB.');

    // Wait a brief moment for server to bind
    await new Promise((r) => setTimeout(r, 300));

    // --- TEST 1: Health Check ---
    console.log('--- Test 1: API Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    console.log(`✅ Health check passed: status=${healthRes.status}, service="${healthData.service}"\n`);

    // --- TEST 2: SPA Refresh / Direct GET on /login ---
    console.log('--- Test 2: SPA Refresh on /login ---');
    const loginPageRes = await fetch(`${BASE_URL}/login`);
    const loginHtml = await loginPageRes.text();
    const isLoginHtml = loginPageRes.headers.get('content-type')?.includes('text/html');
    if (loginPageRes.status !== 200 || !isLoginHtml || !loginHtml.includes('<div id="root">')) {
      throw new Error(`SPA /login refresh failed! Status: ${loginPageRes.status}`);
    }
    console.log(`✅ Direct GET /login returns 200 OK HTML (index.html served cleanly).\n`);

    // --- TEST 3: SPA Refresh / Direct GET on /register ---
    console.log('--- Test 3: SPA Refresh on /register ---');
    const regPageRes = await fetch(`${BASE_URL}/register`);
    const regHtml = await regPageRes.text();
    const isRegHtml = regPageRes.headers.get('content-type')?.includes('text/html');
    if (regPageRes.status !== 200 || !isRegHtml || !regHtml.includes('<div id="root">')) {
      throw new Error(`SPA /register refresh failed! Status: ${regPageRes.status}`);
    }
    console.log(`✅ Direct GET /register returns 200 OK HTML (index.html served cleanly).\n`);

    // --- TEST 4: SPA Refresh / Direct GET on /dashboard ---
    console.log('--- Test 4: SPA Refresh on /dashboard ---');
    const dashPageRes = await fetch(`${BASE_URL}/dashboard`);
    const dashHtml = await dashPageRes.text();
    const isDashHtml = dashPageRes.headers.get('content-type')?.includes('text/html');
    if (dashPageRes.status !== 200 || !isDashHtml || !dashHtml.includes('<div id="root">')) {
      throw new Error(`SPA /dashboard refresh failed! Status: ${dashPageRes.status}`);
    }
    console.log(`✅ Direct GET /dashboard returns 200 OK HTML (index.html served cleanly).\n`);

    // --- TEST 5: SPA Refresh / Direct GET on unknown frontend route ---
    console.log('--- Test 5: SPA Fallback on Unknown Frontend Route ---');
    const unknownPageRes = await fetch(`${BASE_URL}/some/deep/unknown/path`);
    const unknownHtml = await unknownPageRes.text();
    if (unknownPageRes.status !== 200 || !unknownHtml.includes('<div id="root">')) {
      throw new Error(`SPA fallback on unknown route failed! Status: ${unknownPageRes.status}`);
    }
    console.log(`✅ Unknown frontend route serves index.html (client-side NotFoundPage will render).\n`);

    // --- TEST 6: Strict API Isolation - /api/* Must NEVER Serve HTML ---
    console.log('--- Test 6: API Isolation Guarantee (/api/* never returns HTML) ---');
    const unknownApiRes = await fetch(`${BASE_URL}/api/nonexistent-endpoint`);
    const unknownApiData = await unknownApiRes.json();
    const isApiJson = unknownApiRes.headers.get('content-type')?.includes('application/json');
    if (unknownApiRes.status !== 404 || !isApiJson || unknownApiData.success !== false) {
      throw new Error(`API isolation failed! Endpoint returned status ${unknownApiRes.status} instead of JSON 404`);
    }
    console.log(`✅ API isolation verified: GET /api/nonexistent-endpoint returned JSON 404: "${unknownApiData.message}"\n`);

    // --- TEST 7: Authentication & Registration ---
    console.log('--- Test 7: User Registration & Dynamic Age Calculation ---');
    const testEmail = `patient.spa.${Date.now()}@example.org`;
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        dob: '1990-02-20',
        address: '742 Evergreen Terrace',
        sex: 'Female',
        email: testEmail,
        password: 'Password123!',
        foodAllergySummary: 'Allergic to shellfish and tree nuts',
      }),
    });
    const registerData = await registerRes.json();
    if (registerRes.status !== 201 || !registerData.token) {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }
    const token = registerData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log(`✅ Registered patient "${registerData.user.name}", calculated age: ${registerData.user.age}\n`);

    // --- TEST 8: Invalid ObjectId Guard Validation (Returns 400, never 500 CastError) ---
    console.log('--- Test 8: Invalid ObjectId Guard Validation ---');
    const badId = 'not-a-valid-object-id';

    const badAllergyRes = await fetch(`${BASE_URL}/api/allergies/${badId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ allergenName: 'Test' }),
    });
    const badAllergyData = await badAllergyRes.json();
    if (badAllergyRes.status !== 400) {
      throw new Error(`Expected 400 for bad allergy ID, got ${badAllergyRes.status}`);
    }

    const badTestRes = await fetch(`${BASE_URL}/api/medical-tests/${badId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ allergenName: 'Test' }),
    });
    const badTestData = await badTestRes.json();
    if (badTestRes.status !== 400) {
      throw new Error(`Expected 400 for bad test ID, got ${badTestRes.status}`);
    }

    const badReportRes = await fetch(`${BASE_URL}/api/medical-reports/${badId}`, {
      headers: authHeaders,
    });
    const badReportData = await badReportRes.json();
    if (badReportRes.status !== 400) {
      throw new Error(`Expected 400 for bad report ID, got ${badReportRes.status}`);
    }
    console.log(`✅ All invalid ObjectId requests cleanly returned HTTP 400 Bad Request.\n`);

    // --- TEST 9: Allergy Record CRUD ---
    console.log('--- Test 9: Food Allergy CRUD Operations ---');
    const createAllergyRes = await fetch(`${BASE_URL}/api/allergies`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        allergenName: 'Cashew',
        allergenCategory: 'Tree Nuts',
        severity: 'Severe / Anaphylactic Risk',
        diagnosisType: 'Doctor-Confirmed Diagnosis',
        knownReactions: ['Hives', 'Lip Swelling'],
        doctorName: 'Dr. Emily Vance',
        emergencyMedication: 'EpiPen 0.3mg',
      }),
    });
    const createAllergyData = await createAllergyRes.json();
    if (createAllergyRes.status !== 201) {
      throw new Error(`Create allergy failed: status=${createAllergyRes.status}, data=${JSON.stringify(createAllergyData)}`);
    }
    const allergyId = createAllergyData.data._id;

    // Update allergy
    const updateAllergyRes = await fetch(`${BASE_URL}/api/allergies/${allergyId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        severity: 'Moderate',
      }),
    });
    const updateAllergyData = await updateAllergyRes.json();
    if (updateAllergyRes.status !== 200 || updateAllergyData.data.severity !== 'Moderate') {
      throw new Error(`Update allergy failed: status=${updateAllergyRes.status}, data=${JSON.stringify(updateAllergyData)}`);
    }

    // Delete allergy
    const delAllergyRes = await fetch(`${BASE_URL}/api/allergies/${allergyId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (delAllergyRes.status !== 200) throw new Error('Delete allergy failed');
    console.log('✅ Food allergy record created, updated, and deleted successfully.\n');

    // --- TEST 10: Medical Test Record CRUD ---
    console.log('--- Test 10: Medical Test Record CRUD Operations ---');
    const createTestRes = await fetch(`${BASE_URL}/api/medical-tests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        allergenName: 'Shrimp',
        testType: 'Specific IgE Blood Test',
        testDate: '2026-08-10',
        testResult: '14.2',
        units: 'kUA/L',
        isDoctorConfirmedDiagnosis: true,
        clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        clinicOrLabName: 'Apex Health Diagnostics',
      }),
    });
    const createTestData = await createTestRes.json();
    if (createTestRes.status !== 201) {
      throw new Error(`Create medical test failed: status=${createTestRes.status}, data=${JSON.stringify(createTestData)}`);
    }
    const testId = createTestData.data._id;

    // Update test
    const updateTestRes = await fetch(`${BASE_URL}/api/medical-tests/${testId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        doctorNotes: 'Patient advised to strictly avoid all crustacean seafood.',
      }),
    });
    const updateTestData = await updateTestRes.json();
    if (updateTestRes.status !== 200 || !updateTestData.data.doctorNotes.includes('avoid all crustacean')) {
      throw new Error('Update medical test failed');
    }

    // Delete test
    const delTestRes = await fetch(`${BASE_URL}/api/medical-tests/${testId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (delTestRes.status !== 200) throw new Error('Delete medical test failed');
    console.log('✅ Medical test record created, updated, and deleted successfully.\n');

    // Cleanup synthetic test user
    await User.deleteOne({ email: testEmail });
    await AllergyRecord.deleteMany({ userId: registerData.user._id });
    await MedicalTestRecord.deleteMany({ userId: registerData.user._id });

    console.log('🎉 ALL 10 SPA REFRESH, ROUTING ISOLATION & API TESTS PASSED! 🎉\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Closed MongoDB test connection.');
    process.exit(process.exitCode || 0);
  }
}

runSpaAndApiTests();
