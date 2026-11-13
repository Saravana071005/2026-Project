import mongoose from 'mongoose';

const symptomRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    foodEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyFoodEntry',
      default: null,
      index: true,
    },
    foodConsumed: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Food consumed cannot exceed 150 characters'],
    },
    consumptionDateTime: {
      type: Date,
      default: null,
    },
    symptomName: {
      type: String,
      required: [true, 'Primary symptom name is required'],
      trim: true,
      maxlength: [100, 'Symptom name cannot exceed 100 characters'],
    },
    symptomCategory: {
      type: String,
      enum: ['Skin', 'Digestive', 'Respiratory', 'Systemic / Other'],
      required: [true, 'Symptom category is required'],
    },
    symptomSeverity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Life-Threatening / Emergency'],
      default: 'Moderate',
      required: [true, 'Symptom severity is required'],
    },
    symptomDate: {
      type: Date,
      required: [true, 'Symptom date is required'],
      default: Date.now,
    },
    symptomStartTime: {
      type: String,
      required: [true, 'Symptom start time is required (HH:MM)'],
      trim: true,
      default: '12:30',
    },
    onsetInterval: {
      type: String,
      enum: [
        'Immediate (< 15 mins)',
        'Rapid (15 - 30 mins)',
        'Intermediate (30 - 60 mins)',
        '1 - 2 hours',
        '2 - 4 hours',
        'Delayed (> 4 hours)',
        'Uncertain / Unknown',
      ],
      default: 'Intermediate (30 - 60 mins)',
    },
    symptomDuration: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Symptom duration cannot exceed 100 characters'],
    },
    additionalSymptoms: {
      type: [String],
      default: [],
    },
    treatmentTaken: {
      type: String,
      trim: true,
      default: 'None',
      maxlength: [200, 'Treatment description cannot exceed 200 characters'],
    },
    medicalAttentionRequired: {
      type: Boolean,
      default: false,
    },
    medicalFacilityVisited: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Medical facility cannot exceed 150 characters'],
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isEmergencyAlertTriggered: {
      type: Boolean,
      default: false,
    },
    emergencyAlertDetails: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Emergency alert details cannot exceed 1000 characters'],
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

// Compound index for querying a user's symptoms chronologically
symptomRecordSchema.index({ userId: 1, symptomDate: -1 });
symptomRecordSchema.index({ userId: 1, symptomName: 1 });

const SymptomRecord = mongoose.model('SymptomRecord', symptomRecordSchema);
export default SymptomRecord;
