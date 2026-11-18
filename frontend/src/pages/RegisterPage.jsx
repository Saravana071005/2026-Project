import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  ArrowRight,
} from 'lucide-react';
import { calculateAge } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';

const TODAY_DATE_STRING = new Date().toISOString().split('T')[0];

export default function RegisterPage({ setActivePage }) {
  const { t } = useTranslation();
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
      setError(t('auth.fullName') + ' ' + t('common.required'));
      return;
    }
    if (!dob) {
      setError(t('auth.dob') + ' ' + t('common.required'));
      return;
    }
    if (new Date(dob) > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    if (!address.trim()) {
      setError(t('auth.address') + ' ' + t('common.required'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.email') + ' ' + t('common.required'));
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
      const specificFieldErr = err.response?.data?.errors?.[0]?.message;
      const serverMsg = err.response?.data?.message;
      if (specificFieldErr) {
        setError(specificFieldErr);
      } else if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError(
          'Cannot connect to backend server. Please verify your network connection or ensure the backend service on Render is active.'
        );
      } else {
        setError('Registration failed. Please verify your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        {/* Header Banner */}
        <div className="px-8 py-7 bg-teal-700 text-white relative">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-teal-800 border border-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('auth.registerTitle')}</h2>
              <p className="text-xs text-teal-100 mt-0.5">
                {t('auth.registerSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 text-slate-900" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.fullName')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-slate-900 text-slate-900 text-sm bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.email')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-slate-900 text-slate-900 text-sm bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.dob')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  max={TODAY_DATE_STRING}
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs transition-all bg-white"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Auto-Calculated Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>{t('auth.calculatedAge')}</span>
                <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('auth.autoComputed')}
                </span>
              </label>
              <div className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/80 text-slate-900 text-sm font-semibold flex items-center justify-between shadow-2xs">
                <span>{calculatedAge !== null ? `${calculatedAge} ${t('common.yearsOld')}` : t('auth.dob')}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                  {t('auth.autoComputed')}
                </span>
              </div>
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.sex')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs bg-white"
              >
                <option value="Male">{t('auth.male')}</option>
                <option value="Female">{t('auth.female')}</option>
                <option value="Other">{t('auth.other')}</option>
                <option value="Prefer not to say">{t('auth.preferNotToSay')}</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.address')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('auth.address')}
                className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs resize-none bg-white"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.password')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('auth.confirmPassword')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Food Allergy Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.initialAllergyDetails')}
            </label>
            <textarea
              rows={2}
              value={foodAllergySummary}
              onChange={(e) => setFoodAllergySummary(e.target.value)}
              placeholder="e.g. Known peanut allergy since age 6; carries Epipen; mild tingling with soy."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs resize-none bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>{t('auth.savingAtlas')}</span>
            ) : (
              <>
                <span>{t('auth.registerSubmit')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Redirect to login */}
          <div className="text-center pt-2 text-xs text-slate-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => setActivePage('login')}
              className="font-bold text-teal-700 hover:text-teal-800 hover:underline ml-1 cursor-pointer"
            >
              {t('auth.signInHere')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
