import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Calendar,
  MapPin,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { calculateAge } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage({ setActivePage }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState('Male');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [foodAllergySummary, setFoodAllergySummary] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle live DOB change and dynamic age calculation
  const handleDobChange = (e) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const age = calculateAge(val);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!dob) {
      setError('Please select your date of birth.');
      return;
    }
    if (new Date(dob) > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your residential address.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        dob,
        address: address.trim(),
        sex,
        email: email.trim(),
        password,
        foodAllergySummary: foodAllergySummary.trim(),
      };

      await register(payload);
      setSuccess('Account created successfully! Connecting you to your health dashboard...');
      setTimeout(() => {
        setActivePage('dashboard');
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Registration failed. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="px-8 py-6 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-teal-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Create Patient Account</h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Register to log prescriptions, lab tests, and food allergy records in MongoDB Atlas
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 text-teal-600" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Birth (DOB) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Auto-Calculated Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Calculated Age</span>
                <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Dynamic from DOB
                </span>
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-between shadow-xs">
                <span>{calculatedAge !== null ? `${calculatedAge} years old` : 'Select DOB'}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-medium">
                  Auto-Computed
                </span>
              </div>
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sex / Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential address, city, state, postal code"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs resize-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Food Allergy Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Food Allergy Details / Clinical Background
            </label>
            <textarea
              rows={2}
              value={foodAllergySummary}
              onChange={(e) => setFoodAllergySummary(e.target.value)}
              placeholder="e.g. Known peanut allergy since age 6; carries Epipen; mild tingling with soy."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Saving details to MongoDB Atlas...</span>
            ) : (
              <>
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Redirect to login */}
          <div className="text-center pt-2 text-xs text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setActivePage('login')}
              className="font-bold text-teal-600 hover:text-teal-800 underline"
            >
              Sign In Here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
