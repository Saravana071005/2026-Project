import mongoose from 'mongoose';

const aiAnalysisRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['single_meal', 'daily_summary', 'symptom_event', 'comprehensive_audit', 'diet_monitoring'],
      default: 'symptom_event',
    },
    foodEntryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyFoodEntry',
      },
    ],
    symptomRecordIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SymptomRecord',
      },
    ],
    relatedAllergyRecordIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AllergyRecord',
      },
    ],
    relatedMedicalTestIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalTestRecord',
      },
    ],
    // 1. Food consumption summary
    foodConsumptionSummary: {
      type: String,
      required: [true, 'Food consumption summary is required'],
      trim: true,
    },
    // 2. Relevant medical profile information
    relevantMedicalProfile: {
      type: String,
      required: [true, 'Relevant medical profile information is required'],
      trim: true,
    },
    // 3. Detected food and symptom associations
    detectedAssociations: [
      {
        foodName: { type: String, trim: true },
        symptomName: { type: String, trim: true },
        associationStrength: {
          type: String,
          enum: [
            'Doctor-Confirmed Allergy Trigger',
            'Repeated Association (Needs Review)',
            'Possible Association (Single Occurrence)',
            'Sensitization Match (Unconfirmed Clinical Allergy)',
            'Unlikely Association / General Reaction',
          ],
          default: 'Possible Association (Single Occurrence)',
        },
        rationale: { type: String, trim: true },
        _id: false,
      },
    ],
    // 4. Possible explanations
    possibleExplanations: {
      type: [String],
      default: [],
    },
    // 5. Risk assessment with supporting reasons
    riskAssessment: {
      level: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Emergency / Severe'],
        default: 'Moderate',
      },
      supportingReasons: {
        type: [String],
        default: [],
      },
    },
    // 6. Missing information or uncertainties
    missingInformation: {
      type: [String],
      default: [],
    },
    // 7. Safe next steps
    safeNextSteps: {
      type: [String],
      default: [],
    },
    // 8. Whether medical consultation is recommended
    medicalConsultationRecommended: {
      recommended: {
        type: Boolean,
        default: true,
      },
      rationale: {
        type: String,
        trim: true,
        default: 'Consult with an allergist or healthcare provider for diagnostic confirmation.',
      },
      urgency: {
        type: String,
        enum: ['Immediate Emergency', 'Prompt (Within 24-48h)', 'Routine Follow-up', 'Optional'],
        default: 'Routine Follow-up',
      },
    },
    // 9. Emergency warning when relevant
    emergencyWarning: {
      isEmergency: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        trim: true,
        default: '',
      },
      actionPlan: {
        type: String,
        trim: true,
        default: '',
      },
    },
    aiProvider: {
      type: String,
      default: 'system',
    },
    modelUsed: {
      type: String,
      default: '',
    },
    rawAIResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    userNotes: {
      type: String,
      trim: true,
      default: '',
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

aiAnalysisRecordSchema.index({ userId: 1, createdAt: -1 });

const AIAnalysisRecord = mongoose.model('AIAnalysisRecord', aiAnalysisRecordSchema);
export default AIAnalysisRecord;
