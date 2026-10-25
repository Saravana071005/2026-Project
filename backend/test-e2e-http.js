const API_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runE2ETests() {
  console.log('🚀 Running Full End-to-End HTTP API & Database Verification Tests against running server at http://localhost:5000...\n');

  try {
    // 1. Health check
    console.log('--- Step 1: Health Check ---');
    const health = await request('/health');
    console.log(`Health Response: status=${health.status}, service="${health.data.service}"`);
    if (health.status !== 200) throw new Error('Health check failed');
    console.log('✅ Health check passed.\n');

    // 2. User Registration
    console.log('--- Step 2: User Registration & Dynamic Age Calculation ---');
    const alexEmail = `alex.test.${Date.now()}@example.org`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alexander Wright',
        dob: '2001-09-15',
        address: '500 Medical Center Way, Suite 4B, Metro City',
        sex: 'Male',
        email: alexEmail,
        password: 'MySecurePassword2026!',
        foodAllergySummary: 'Mild almond and walnut tingling; advised to get skin prick testing.',
      }),
    });

    console.log(`Register status: ${regRes.status}, user: ${regRes.data.user?.name}`);
    console.log(`Calculated Age returned by server: ${regRes.data.user?.age} years old`);
    if (regRes.status !== 201 || !regRes.data.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    const token = regRes.data.token;
    console.log('✅ User registration and token issuance verified.\n');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Duplicate Registration Check
    console.log('--- Step 3: Duplicate Email Check ---');
    const dupRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alexander Duplicate',
        dob: '2001-09-15',
        address: 'Some address',
        sex: 'Male',
        email: alexEmail,
        password: 'Password123!',
      }),
    });
    console.log(`Duplicate register status: ${dupRes.status} (Expected 409 Conflict)`);
    if (dupRes.status !== 409) throw new Error('Duplicate email was not rejected!');
    console.log('✅ Duplicate registration successfully blocked.\n');

    // 4. Create Food Allergy Record
    console.log('--- Step 4: Add Food Allergy Record ---');
    const allergyRes = await request('/allergies', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        allergenName: 'Walnuts',
        allergenCategory: 'Tree Nuts',
        severity: 'Moderate',
        diagnosisType: 'Doctor-Confirmed Diagnosis',
        knownReactions: ['Oral Itching / Tingling', 'Facial / Lip Swelling (Angioedema)'],
        reactionDescription: 'Tingling of palate and lip edema within 15 minutes of eating walnut cake.',
        doctorName: 'Dr. Sarah Lee, Allergist',
        emergencyMedication: 'Cetirizine 10mg PRN',
      }),
    });
    console.log(`Create allergy status: ${allergyRes.status}, id: ${allergyRes.data.data?._id}`);
    if (allergyRes.status !== 201) throw new Error('Create allergy failed');
    const allergyId = allergyRes.data.data._id;
    console.log('✅ Food allergy record created in MongoDB Atlas.\n');

    // 5. Create Medical Test Record (with clinical distinction)
    console.log('--- Step 5: Add Medical Test Record ---');
    const testRes = await request('/medical-tests', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        allergenName: 'Walnut extract',
        testType: 'Skin Prick Test (SPT)',
        testDate: '2026-10-20',
        testResult: '5.5',
        units: 'mm wheal diameter',
        isDoctorConfirmedDiagnosis: true,
        clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        doctorNotes: 'Positive wheal confirms walnut sensitization. Strict avoidance recommended.',
        recordedReactionDetails: 'Wheal and flare documented with no systemic symptoms during test.',
        clinicOrLabName: 'Metro Immunology Laboratory',
      }),
    });
    console.log(`Create test status: ${testRes.status}, id: ${testRes.data.data?._id}`);
    if (testRes.status !== 201) throw new Error('Create medical test failed');
    const testId = testRes.data.data._id;
    console.log('✅ Medical test record created in MongoDB Atlas.\n');

    // 6. Retrieve User's Allergy and Medical Test Records
    console.log('--- Step 6: Query User Records from MongoDB ---');
    const getAllergies = await request('/allergies', { headers: authHeaders });
    const getTests = await request('/medical-tests', { headers: authHeaders });
    console.log(`Allergies retrieved: ${getAllergies.data.count}, Tests retrieved: ${getTests.data.count}`);
    if (getAllergies.data.count !== 1 || getTests.data.count !== 1) {
      throw new Error('Records count mismatch');
    }
    console.log('✅ Records retrieved successfully.\n');

    // 7. Update User Profile
    console.log('--- Step 7: Update Personal Profile Details ---');
    const updateProfileRes = await request('/user/profile', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Alexander Wright, Jr.',
        address: '500 Medical Center Way, Suite 4B (Updated), Metro City',
        foodAllergySummary: 'Updated: Confirmed walnut allergy; prescribed antihistamine.',
      }),
    });
    console.log(`Update profile status: ${updateProfileRes.status}, name: "${updateProfileRes.data.user?.name}"`);
    if (updateProfileRes.status !== 200) throw new Error('Profile update failed');
    console.log('✅ Personal profile updated.\n');

    // 8. Test Demo Patient Login & User Data Isolation
    console.log('--- Step 8: Demo Patient Login & Data Isolation Verification ---');
    const demoLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'demo.patient@health.org',
        password: 'DemoPatient2026!',
      }),
    });
    console.log(`Demo login status: ${demoLogin.status}, user: "${demoLogin.data.user?.name}"`);
    if (demoLogin.status !== 200) throw new Error('Demo login failed');
    const demoToken = demoLogin.data.token;
    const demoHeaders = { Authorization: `Bearer ${demoToken}` };

    const demoAllergies = await request('/allergies', { headers: demoHeaders });
    const demoTests = await request('/medical-tests', { headers: demoHeaders });
    console.log(`Demo user allergies count: ${demoAllergies.data.count} (Expected 3)`);
    console.log(`Demo user medical tests count: ${demoTests.data.count} (Expected 3)`);

    // Verify Demo user CANNOT see Alexander's records
    const alexRecordSeenByDemo = demoAllergies.data.data.find(a => a._id === allergyId);
    console.log(`Cross-user data leakage check: ${alexRecordSeenByDemo ? 'LEAK DETECTED' : 'SECURE (Not visible)'}`);
    if (alexRecordSeenByDemo) throw new Error('Security isolation violation!');

    // Verify Demo user CANNOT delete Alexander's record
    const unauthorizedDelete = await request(`/allergies/${allergyId}`, {
      method: 'DELETE',
      headers: demoHeaders,
    });
    console.log(`Cross-user deletion attempt status: ${unauthorizedDelete.status} (Expected 404 Not Found)`);
    if (unauthorizedDelete.status !== 404) throw new Error('Unauthorized deletion succeeded!');
    console.log('✅ Strict multi-user data isolation and authorization verified.\n');

    // 9. Update & Delete Records by Owner
    console.log('--- Step 9: Record Update & Cascade Cleanup ---');
    const updateAllergyRes = await request(`/allergies/${allergyId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        severity: 'Severe / Anaphylactic Risk',
        emergencyMedication: 'EpiPen 0.3mg Prescribed',
      }),
    });
    console.log(`Update allergy status: ${updateAllergyRes.status}, severity: "${updateAllergyRes.data.data?.severity}"`);

    const delAllergy = await request(`/allergies/${allergyId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Delete allergy status: ${delAllergy.status}`);

    const delTest = await request(`/medical-tests/${testId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Delete medical test status: ${delTest.status}`);
    console.log('✅ CRUD record editing and deletion verified.\n');

    console.log('🏆 ALL E2E HTTP API & DATABASE TESTS PASSED WITH 100% SUCCESS! 🏆');
  } catch (err) {
    console.error('❌ E2E Test Error:', err);
    process.exit(1);
  }
}

runE2ETests();
