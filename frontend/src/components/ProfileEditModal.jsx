import React, { useState, useEffect } from 'react';
import { X, AlertCircle, UserCheck, Calendar, MapPin, Mail, Sparkles } from 'lucide-react';
import { calculateAge } from '../utils/ageCalculator';
import { useAuth } from '../context/AuthContext';

export default function ProfileEditModal({ isOpen, onClose, onUpdated }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState('Male');
  const [email, setEmail] = useState('');
  const [foodAllergySummary, setFoodAllergySummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      const formattedDob = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
      setDob(formattedDob);
      setCalculatedAge(user.dob ? calculateAge(user.dob) : null);
      setAddress(user.address || '');
      setSex(user.sex || 'Male');
      setEmail(user.email || '');
      setFoodAllergySummary(user.foodAllergySummary || '');
    }
    setError('');
  }, [user, isOpen]);

  // Handle dynamic recalculation of age whenever DOB changes
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!dob) {
      setError('Date of birth is required.');
      return;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        dob,
        address: address.trim(),
        sex,
        email: email.trim(),
        foodAllergySummary: foodAllergySummary.trim(),
      };

      const result = await updateProfile(payload);
      if (onUpdated) onUpdated(result.user);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Failed to update profile. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-teal-200" />
            <div>
              <h3 className="text-lg font-bold">Edit Personal Profile</h3>
              <p className="text-xs text-teal-100">
                Update demographic details and allergy summary saved in MongoDB Atlas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

            {/* Calculated Age (Read-only dynamically computed) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Calculated Age</span>
                <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-calculated from DOB
                </span>
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-between">
                <span>{calculatedAge !== null ? `${calculatedAge} years old` : 'Select DOB above'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Verified
                </span>
              </div>
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sex / Biological Gender <span className="text-rose-500">*</span>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, apartment, city, state, postal code"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs resize-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Food Allergy Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              General Food Allergy Summary / History
            </label>
            <textarea
              rows={3}
              value={foodAllergySummary}
              onChange={(e) => setFoodAllergySummary(e.target.value)}
              placeholder="e.g. Diagnosed with peanut allergy at age 5; carries EpiPen. Avoids tree nuts and cross-contaminated bakery products."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
