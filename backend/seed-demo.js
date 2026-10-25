import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { calculateAge } from './src/models/User.js';
import AllergyRecord from './src/models/AllergyRecord.js';
import MedicalTestRecord from './src/models/MedicalTestRecord.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB Atlas / Local Database.');

    const demoEmail = 'demo.patient@health.org';

    // Remove existing demo data to prevent duplication
    const existing = await User.findOne({ email: demoEmail });
    if (existing) {
      await AllergyRecord.deleteMany({ userId: existing._id });
      await MedicalTestRecord.deleteMany({ userId: existing._id });
      await User.deleteOne({ _id: existing._id });
      console.log('[Seed] Removed previous demo records.');
    }

    const dob = new Date('1996-04-12');
    const demoUser = new User({
      name: 'Eleanor Vance',
      dob,
      age: calculateAge(dob),
      address: '742 Evergreen Terrace, Medical District, Springfield, IL 62704',
      sex: 'Female',
      email: demoEmail,
      password: 'DemoPatient2026!', // Will be bcrypt-hashed via pre-save hook
      foodAllergySummary:
        'Diagnosed with severe peanut allergy and moderate shellfish sensitivity. Prescribed twin EpiPen auto-injectors. Avoids tree nuts and cross-contaminated bakery products.',
    });

    await demoUser.save();
    console.log(`[Seed] Created Demo User: ${demoUser.name} (${demoUser.email})`);

    // Create 3 realistic Food Allergy Records
    const allergies = [
      {
        userId: demoUser._id,
        allergenName: 'Peanuts',
        allergenCategory: 'Peanuts',
        severity: 'Severe / Anaphylactic Risk',
        diagnosisType: 'Doctor-Confirmed Diagnosis',
        knownReactions: [
          'Anaphylaxis',
          'Throat Tightness',
          'Hives / Urticaria',
          'Wheezing / Shortness of Breath',
        ],
        reactionDescription:
          'Acute systemic anaphylactic reaction within 5 minutes of trace ingestion. Required immediate intramuscular epinephrine.',
        doctorName: 'Dr. Marcus Bennett, MD, FAAAAI',
        emergencyMedication: 'EpiPen Auto-Injector 0.3mg (Twin-Pack)',
      },
      {
        userId: demoUser._id,
        allergenName: 'Crustacean Shellfish (Shrimp & Lobster)',
        allergenCategory: 'Crustacean Shellfish',
        severity: 'Moderate',
        diagnosisType: 'Doctor-Confirmed Diagnosis',
        knownReactions: [
          'Facial / Lip Swelling (Angioedema)',
          'Oral Itching / Tingling',
          'Stomach Cramps / Diarrhea',
        ],
        reactionDescription:
          'Labial angioedema and severe gastrointestinal cramping after restaurant shrimp consumption.',
        doctorName: 'Dr. Marcus Bennett, MD, FAAAAI',
        emergencyMedication: 'Cetirizine 10mg & Prednisone taper',
      },
      {
        userId: demoUser._id,
        allergenName: 'Soybeans & Soy Lecithin',
        allergenCategory: 'Soybeans',
        severity: 'Mild',
        diagnosisType: 'Prescription Documented',
        knownReactions: ['Oral Itching / Tingling', 'Eczema Flare-ups'],
        reactionDescription:
          'Mild perioral pruritus and localized eczema exacerbation with concentrated soy protein isolate.',
        doctorName: 'Dr. Elena Rostova, MD',
        emergencyMedication: 'Diphenhydramine 25mg PRN',
      },
    ];

    await AllergyRecord.insertMany(allergies);
    console.log(`[Seed] Inserted ${allergies.length} food allergy records.`);

    // Create 3 realistic Medical Test Records
    const tests = [
      {
        userId: demoUser._id,
        allergenName: 'Peanut (rAra h 2 component)',
        testType: 'Specific IgE Blood Test',
        testDate: new Date('2026-06-15'),
        testResult: '24.6',
        units: 'kUA/L (Class 4 - Very High)',
        isDoctorConfirmedDiagnosis: true,
        clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        doctorNotes:
          'High rAra h 2 titer strongly predicts high clinical risk for systemic anaphylaxis. Strict complete avoidance of all peanut ingredients prescribed. EpiPen renewal authorized.',
        recordedReactionDetails:
          'Correlates with prior acute anaphylaxis history. Retest scheduled in 18 months.',
        clinicOrLabName: 'Quest Diagnostics Immunology Laboratory',
      },
      {
        userId: demoUser._id,
        allergenName: 'Shrimp (Penaeus aztecus)',
        testType: 'Skin Prick Test (SPT)',
        testDate: new Date('2026-06-15'),
        testResult: '7.5',
        units: 'mm wheal diameter (Negative control: 0mm, Histamine: 5mm)',
        isDoctorConfirmedDiagnosis: true,
        clinicalDiagnosisStatus: 'Doctor-Confirmed Diagnosis',
        doctorNotes:
          'Positive skin prick wheal significantly exceeds histamine control. Patient advised against all crustaceans and mollusk cross-exposure.',
        recordedReactionDetails:
          'Erythema flare and 7.5mm wheal documented at 15-minute observation.',
        clinicOrLabName: 'Metro Allergy & Asthma Specialists',
      },
      {
        userId: demoUser._id,
        allergenName: "Cow's Milk (Casein / Bos d 8)",
        testType: 'Specific IgE Blood Test',
        testDate: new Date('2026-08-20'),
        testResult: '0.18',
        units: 'kUA/L (Class 0/1 - Borderline / Low)',
        isDoctorConfirmedDiagnosis: false,
        clinicalDiagnosisStatus: 'Recorded Test Result (Not yet confirmed)',
        doctorNotes:
          'Low level sensitization detected on blood test. Patient does not exhibit adverse reactions to baked milk. Inconclusive for clinical allergy; Oral Food Challenge recommended before restricting diet.',
        recordedReactionDetails: 'No acute symptoms documented during ordinary diet.',
        clinicOrLabName: 'Apex Diagnostic Laboratory',
      },
    ];

    await MedicalTestRecord.insertMany(tests);
    console.log(`[Seed] Inserted ${tests.length} medical test records.`);

    console.log('✅ Demo seed completed successfully!');
    console.log('Credentials:');
    console.log('  Email:    demo.patient@health.org');
    console.log('  Password: DemoPatient2026!');
  } catch (err) {
    console.error('[Seed Error]:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
