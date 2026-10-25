import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (val) {
          return val <= new Date();
        },
        message: 'Date of birth cannot be in the future',
      },
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    sex: {
      type: String,
      required: [true, 'Sex is required'],
      enum: {
        values: ['Male', 'Female', 'Other', 'Prefer not to say'],
        message: '{VALUE} is not a valid option for sex',
      },
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password in queries by default
    },
    foodAllergySummary: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Allergy summary cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook: auto-compute age from DOB
userSchema.pre('save', function (next) {
  if (this.dob) {
    this.age = calculateAge(this.dob);
  }
  next();
});

// Pre-save hook: hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
