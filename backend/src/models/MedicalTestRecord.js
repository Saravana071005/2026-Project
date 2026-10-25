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
          'Component-Resolved Diagnostics (CRD)',
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
