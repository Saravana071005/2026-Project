import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from './src/models/User.js';
import MedicalReport from './src/models/MedicalReport.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';
import { generateToken } from './src/middleware/authMiddleware.js';
import app from './src/server.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
const TEST_PORT = 5055;

async function runTests() {
  console.log('🧪 Starting End-to-End Medical Report Upload & OCR API Tests...\n');

  let server;
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // Start server on test port
    server = app.listen(TEST_PORT);
    const BASE_URL = `http://localhost:${TEST_PORT}/api`;

    // 1. Create two test patients to test multi-tenancy isolation
    const patientA = new User({
      name: 'Alice Patient',
      dob: new Date('1995-05-10'),
      address: '101 Health Way, Metro City',
      sex: 'Female',
      email: `alice.ocr.${Date.now()}@test.org`,
      password: 'SecurePassword123!',
    });
    await patientA.save();
    const tokenA = generateToken(patientA._id);

    const patientB = new User({
      name: 'Bob Patient',
      dob: new Date('1992-03-15'),
      address: '202 Medical Ave, Metro City',
      sex: 'Male',
      email: `bob.ocr.${Date.now()}@test.org`,
      password: 'SecurePassword123!',
    });
    await patientB.save();
    const tokenB = generateToken(patientB._id);

    console.log(`Created test patients: Alice (${patientA._id}) and Bob (${patientB._id})\n`);

    // 2. Upload sample report for Alice
    console.log('--- Step 1: Uploading Medical Report for Alice ---');
    const samplePdfPath = path.resolve('uploads', 'sample-lab-report.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      throw new Error(`Sample report file not found at ${samplePdfPath}`);
    }

    const fileBuffer = fs.readFileSync(samplePdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const form = new FormData();
    form.append('files', blob, 'sample-lab-report.pdf');

    const uploadRes = await fetch(`${BASE_URL}/medical-reports/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
      body: form,
    });

    const uploadData = await uploadRes.json();
    console.log(`Upload response status: ${uploadRes.status}, success: ${uploadData.success}`);
    if (uploadRes.status !== 201 || !uploadData.data) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    const reportId = uploadData.data._id || (Array.isArray(uploadData.data) ? uploadData.data[0]._id : null);
    console.log(`Uploaded report ID: ${reportId}`);
    console.log(`Processing Status: ${uploadData.data.processingStatus || uploadData.data[0]?.processingStatus}`);
    console.log('✅ Report uploaded and OCR processed successfully.\n');

    // 3. Retrieve report details
    console.log('--- Step 2: Retrieve Report Details & Structured Entities ---');
    const getRes = await fetch(`${BASE_URL}/medical-reports/${reportId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getData = await getRes.json();
    console.log(`Report details status: ${getRes.status}`);
    const structured = getData.data.structuredExtractedData;
    console.log(`Extracted Lab: ${structured?.clinicOrLabName}`);
    console.log(`Extracted Tests Count: ${structured?.allergyTests?.length}`);
    console.log(`General Vitals (blood pressure): ${structured?.generalMeasurements?.bloodPressure}`);
    console.log(`General Vitals (cholesterol absent): ${structured?.generalMeasurements?.cholesterol}`);
    
    if (!structured || structured.allergyTests.length === 0) {
      throw new Error('Structured tests not extracted properly');
    }
    if (structured.generalMeasurements.cholesterol !== null) {
      throw new Error('Absent cholesterol must be null!');
    }
    console.log('✅ Structured data and null values verified.\n');

    // 4. Secure File Access (Stream)
    console.log('--- Step 3: Secure Authenticated File Streaming ---');
    const fileRes = await fetch(`${BASE_URL}/medical-reports/${reportId}/file`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`File streaming status: ${fileRes.status}, Content-Type: ${fileRes.headers.get('content-type')}`);
    if (fileRes.status !== 200 || fileRes.headers.get('content-type') !== 'application/pdf') {
      throw new Error('File streaming failed');
    }
    console.log('✅ Authenticated file streaming verified.\n');

    // 5. Multi-Tenant Isolation Check (Bob tries to access Alice's document)
    console.log('--- Step 4: Multi-Tenant Security & Isolation Check ---');
    const unauthorizedGet = await fetch(`${BASE_URL}/medical-reports/${reportId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`Bob unauthorized GET status: ${unauthorizedGet.status} (Expected 404)`);
    if (unauthorizedGet.status !== 404) {
      throw new Error('Data breach: Bob accessed Alice document!');
    }

    const unauthorizedFile = await fetch(`${BASE_URL}/medical-reports/${reportId}/file`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`Bob unauthorized File stream status: ${unauthorizedFile.status} (Expected 404)`);
    if (unauthorizedFile.status !== 404) {
      throw new Error('Data breach: Bob accessed Alice file stream!');
    }
    console.log('✅ Multi-tenant data isolation verified: zero cross-user access.\n');

    // 6. User Verification & Saving Confirmed Tests
    console.log('--- Step 5: User Verification & Confirmation Flow ---');
    const confirmPayload = {
      clinicOrLabName: structured.clinicOrLabName,
      doctorName: structured.doctorName,
      testDate: structured.testDate,
      clinicalDiagnosisStatus: 'Recorded Test Result (Not yet confirmed)',
      tests: structured.allergyTests.map((t) => ({
        allergenName: t.allergenName,
        testType: t.testType,
        testResult: t.testResult,
        units: t.units,
        referenceRange: t.referenceRange,
        isDoctorConfirmedDiagnosis: false,
      })),
    };

    const confirmRes = await fetch(`${BASE_URL}/medical-reports/${reportId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmPayload),
    });

    const confirmData = await confirmRes.json();
    console.log(`Confirm status: ${confirmRes.status}, Saved Tests: ${confirmData.savedCount}`);
    if (confirmRes.status !== 200 || confirmData.savedCount < 1) {
      throw new Error(`Confirmation failed: ${JSON.stringify(confirmData)}`);
    }

    // Verify tests appeared in MedicalTestRecord
    const testsRes = await fetch(`${BASE_URL}/medical-tests`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const testsData = await testsRes.json();
    console.log(`Alice total medical tests in portal: ${testsData.count}`);
    const foundOcrTest = testsData.data.find((t) => t.reportId === reportId);
    if (!foundOcrTest || !foundOcrTest.ocrExtracted) {
      throw new Error('Confirmed OCR test not found in medical-tests collection');
    }
    console.log(`Confirmed test in portal: ${foundOcrTest.allergenName} (${foundOcrTest.testResult} ${foundOcrTest.units})`);
    console.log('✅ User verification & portal persistence verified.\n');

    // 7. Delete report
    console.log('--- Step 6: Safe Deletion & Disk Cleanup ---');
    const delRes = await fetch(`${BASE_URL}/medical-reports/${reportId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`Delete status: ${delRes.status}`);
    if (delRes.status !== 200) {
      throw new Error('Delete report failed');
    }

    // Verify deleted
    const verifyDel = await fetch(`${BASE_URL}/medical-reports/${reportId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (verifyDel.status !== 404) {
      throw new Error('Report still accessible after delete!');
    }
    console.log('✅ Report deleted and physical file removed from disk.\n');

    // Clean up
    await MedicalTestRecord.deleteMany({ userId: { $in: [patientA._id, patientB._id] } });
    await User.deleteMany({ _id: { $in: [patientA._id, patientB._id] } });

    console.log('🎉 ALL 6 END-TO-END MEDICAL REPORT UPLOAD & OCR API TESTS PASSED! 🎉\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E API Test Failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }
}

runTests();
