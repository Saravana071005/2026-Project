import mongoose from 'mongoose';

const allergyTestItemSchema = new mongoose.Schema(
  {
    allergenName: {
      type: String,
      required: true,
      trim: true,
    },
    allergenCategory: {
      type: String,
      default: 'Other Food',
    },
    testType: {
      type: String,
      required: true,
      default: 'Specific IgE Blood Test',
    },
    testResult: {
      type: String,
      required: true,
      trim: true,
    },
    units: {
      type: String,
      trim: true,
      default: '',
    },
    referenceRange: {
      type: String,
      trim: true,
      default: null,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low', 'needs_review'],
      default: 'needs_review',
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    testCategory: {
      type: String,
      default: 'specific_ige',
    },
    testSpecificParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    parameterStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // e.g. { whealDiameter: 'extracted', negativeControl: 'not_mentioned' }
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
      default: null,
    },
    selected: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const medicalReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    ocrEngine: {
      type: String,
      enum: ['tesseract', 'google-vision', 'pdf-native', 'hybrid'],
      default: 'hybrid',
    },
    ocrExtractedText: {
      type: String,
      default: '',
    },
    // Dynamic Test-Specific Metadata
    selectedTestType: {
      type: String,
      default: null,
      index: true,
    },
    detectedTestType: {
      type: String,
      default: null,
      index: true,
    },
    testTypeMismatch: {
      type: Boolean,
      default: false,
    },
    testMismatchDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    auditTrail: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        details: { type: String, default: '' },
        _id: false,
      },
    ],
    structuredExtractedData: {
      extractedAt: {
        type: Date,
        default: null,
      },
      clinicOrLabName: {
        type: String,
        default: null,
      },
      doctorName: {
        type: String,
        default: null,
      },
      doctorNotes: {
        type: String,
        default: null,
      },
      testDate: {
        type: Date,
        default: null,
      },
      patientName: {
        type: String,
        default: null,
      },
      clinicalDiagnosisStatus: {
        type: String,
        default: 'Recorded Test Result (Not yet confirmed)',
      },
      allergyTests: {
        type: [allergyTestItemSchema],
        default: [],
      },
      generalMeasurements: {
        bloodPressure: {
          type: String,
          default: null,
        },
        bloodSugar: {
          type: String,
          default: null,
        },
        cholesterol: {
          type: String,
          default: null,
        },
        totalIgE: {
          type: String,
          default: null,
        },
        otherLabValues: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    },
    fieldConfidence: {
      type: Map,
      of: new mongoose.Schema(
        {
          score: { type: Number, default: 0 },
          status: {
            type: String,
            enum: ['high', 'medium', 'low', 'needs_review'],
            default: 'needs_review',
          },
          reason: { type: String, default: '' },
        },
        { _id: false }
      ),
      default: {},
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'confirmed', 'rejected', 'failed'],
      default: 'pending',
      index: true,
    },
    userVerificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'verified_and_saved', 'rejected'],
      default: 'unverified',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    relatedMedicalTestRecordIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalTestRecord',
      },
    ],
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

medicalReportSchema.index({ userId: 1, createdAt: -1 });

const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
export default MedicalReport;
