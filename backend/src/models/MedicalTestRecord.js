import mongoose from 'mongoose';

const medicalTestRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    allergenName: {
      type: String,
      required: [true, 'Food allergen name is required'],
      trim: true,
      maxlength: [100, 'Allergen name cannot exceed 100 characters'],
    },
    testType: {
      type: String,
      required: [true, 'Medical test type is required'],
      trim: true,
      enum: {
        values: [
          'Skin Prick Test (SPT)',
          'Specific IgE Blood Test',
          'Oral Food Challenge (OFC)',
          'Patch Test',
          'Total IgE Test',
          'Total Serum IgE',
          'Component-Resolved Diagnostics (CRD)',
          'Basophil Activation Test (BAT)',
          'Intradermal Test (Not Recommended)',
          'Doctor Clinical Evaluation / Prescription',
          'Other',
        ],
        message: '{VALUE} is not a recognized test type',
      },
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
      validate: {
        validator: function (val) {
          return val <= new Date();
        },
        message: 'Test date cannot be in the future',
      },
    },
    testResult: {
      type: String,
      required: [true, 'Test result as written in report is required'],
      trim: true,
      maxlength: [200, 'Test result cannot exceed 200 characters'],
    },
    units: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Units cannot exceed 100 characters'],
    },
    referenceRange: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Reference range cannot exceed 100 characters'],
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalReport',
      default: null,
      index: true,
    },
    ocrExtracted: {
      type: Boolean,
      default: false,
    },
    // Distinguish recorded test result from a doctor-confirmed diagnosis
    isDoctorConfirmedDiagnosis: {
      type: Boolean,
      default: false,
    },
    clinicalDiagnosisStatus: {
      type: String,
      enum: [
        'Recorded Test Result (Not yet confirmed)',
        'Doctor-Confirmed Diagnosis',
        'Prescription Observation',
        'Inconclusive / Retest Recommended',
      ],
      default: 'Recorded Test Result (Not yet confirmed)',
    },
    doctorNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Doctor notes cannot exceed 2000 characters'],
    },
    recordedReactionDetails: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Reaction details cannot exceed 1000 characters'],
    },
    clinicOrLabName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Clinic or lab name cannot exceed 150 characters'],
    },
    // Dynamic Test-Specific Medical Questionnaire Fields
    testCategory: {
      type: String,
      enum: [
        'specific_ige',
        'skin_prick',
        'total_ige',
        'crd',
        'oral_challenge',
        'bat',
        'patch_test',
        'intradermal',
        'other',
      ],
      default: 'other',
      index: true,
    },
    testSpecificParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    parameterStatus: {
      type: Map,
      of: String, // 'extracted' | 'not_mentioned' | 'needs_review' | 'user_verified'
      default: {},
    },
    parameterConfidence: {
      type: Map,
      of: Number, // 0 to 100
      default: {},
    },
    customParameters: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
        unit: { type: String, trim: true, default: '' },
        _id: false,
      },
    ],
    originalExtractedValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null, // Preserves raw OCR output for auditing
    },
    clinicalWarningAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for querying user's records ordered by date
medicalTestRecordSchema.index({ userId: 1, testDate: -1 });

const MedicalTestRecord = mongoose.model('MedicalTestRecord', medicalTestRecordSchema);
export default MedicalTestRecord;
