import mongoose from 'mongoose';

const allergyRecordSchema = new mongoose.Schema(
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
    allergenCategory: {
      type: String,
      enum: [
        'Peanuts',
        'Tree Nuts',
        'Milk & Dairy',
        'Eggs',
        'Fish',
        'Crustacean Shellfish',
        'Wheat & Gluten',
        'Soybeans',
        'Sesame',
        'Fruits & Vegetables',
        'Legumes & Seeds',
        'Spices',
        'Other Food',
      ],
      default: 'Other Food',
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe / Anaphylactic Risk'],
      default: 'Moderate',
    },
    diagnosisType: {
      type: String,
      enum: [
        'Doctor-Confirmed Diagnosis',
        'Prescription Documented',
        'Suspected by Patient',
        'Family History / Precautionary',
      ],
      default: 'Doctor-Confirmed Diagnosis',
    },
    knownReactions: {
      type: [String],
      default: [],
    },
    reactionDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Reaction description cannot exceed 1000 characters'],
    },
    doctorName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Doctor name cannot exceed 100 characters'],
    },
    emergencyMedication: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Medication cannot exceed 200 characters'],
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

allergyRecordSchema.index({ userId: 1, allergenName: 1 });

const AllergyRecord = mongoose.model('AllergyRecord', allergyRecordSchema);
export default AllergyRecord;
