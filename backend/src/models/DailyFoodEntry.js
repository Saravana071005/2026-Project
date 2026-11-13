import mongoose from 'mongoose';

const dailyFoodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [150, 'Food name cannot exceed 150 characters'],
    },
    foodCategory: {
      type: String,
      enum: [
        'Grains & Cereals',
        'Dairy & Eggs',
        'Meat & Poultry',
        'Fish & Seafood',
        'Nuts & Seeds',
        'Legumes & Pulses',
        'Fruits',
        'Vegetables',
        'Beverages',
        'Bakery & Sweets',
        'Mixed Dish / Traditional Recipe',
        'Snacks & Packaged Foods',
        'Condiments & Spices',
        'Other',
      ],
      default: 'Mixed Dish / Traditional Recipe',
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner', 'Late Night / Other'],
      required: [true, 'Meal type is required'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0.1, 'Quantity must be at least 0.1'],
    },
    measurementUnit: {
      type: String,
      trim: true,
      default: 'serving',
      maxlength: [50, 'Measurement unit cannot exceed 50 characters'],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    preparationMethod: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Preparation method cannot exceed 150 characters'],
    },
    consumptionDate: {
      type: Date,
      required: [true, 'Consumption date is required'],
      default: Date.now,
    },
    consumptionTime: {
      type: String,
      required: [true, 'Consumption time is required (HH:MM)'],
      trim: true,
      default: '12:00',
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    // Automated diet monitoring flags (e.g. potential allergens identified)
    dietaryAlerts: [
      {
        allergenName: { type: String, trim: true },
        matchedIngredient: { type: String, trim: true },
        riskType: {
          type: String,
          enum: [
            'Doctor-Confirmed Allergy',
            'Suspected / History',
            'Sensitization finding',
            'Sensitization Finding (Unconfirmed Clinical Allergy)',
            'Sensitization Match (Unconfirmed)',
            'Previous Reported Reaction',
            'Cross-Contact Risk',
            'Other Alert',
          ],
          default: 'Sensitization Finding (Unconfirmed Clinical Allergy)',
        },
        message: { type: String, trim: true },
        _id: false,
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

// Compound index for chronological querying of a user's food diary
dailyFoodEntrySchema.index({ userId: 1, consumptionDate: -1, mealType: 1 });
dailyFoodEntrySchema.index({ userId: 1, foodName: 1 });

const DailyFoodEntry = mongoose.model('DailyFoodEntry', dailyFoodEntrySchema);
export default DailyFoodEntry;
