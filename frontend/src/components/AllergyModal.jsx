import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import api from '../services/api';

const COMMON_REACTIONS = [
  'Hives / Urticaria',
  'Anaphylaxis',
  'Facial / Lip Swelling (Angioedema)',
  'Wheezing / Shortness of Breath',
  'Vomiting / Nausea',
  'Stomach Cramps / Diarrhea',
  'Oral Itching / Tingling',
  'Dizziness / Drop in Blood Pressure',
  'Throat Tightness',
  'Eczema Flare-ups',
];

const CATEGORIES = [
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
];

export default function AllergyModal({ isOpen, onClose, onSaved, initialData }) {
  const [allergenName, setAllergenName] = useState('');
  const [allergenCategory, setAllergenCategory] = useState('Peanuts');
  const [severity, setSeverity] = useState('Moderate');
  const [diagnosisType, setDiagnosisType] = useState('Doctor-Confirmed Diagnosis');
  const [selectedReactions, setSelectedReactions] = useState([]);
  const [reactionDescription, setReactionDescription] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [emergencyMedication, setEmergencyMedication] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setAllergenName(initialData.allergenName || '');
      setAllergenCategory(initialData.allergenCategory || 'Peanuts');
      setSeverity(initialData.severity || 'Moderate');
      setDiagnosisType(initialData.diagnosisType || 'Doctor-Confirmed Diagnosis');
      setSelectedReactions(initialData.knownReactions || []);
      setReactionDescription(initialData.reactionDescription || '');
      setDoctorName(initialData.doctorName || '');
      setEmergencyMedication(initialData.emergencyMedication || '');
    } else {
      setAllergenName('');
      setAllergenCategory('Peanuts');
      setSeverity('Moderate');
      setDiagnosisType('Doctor-Confirmed Diagnosis');
      setSelectedReactions([]);
      setReactionDescription('');
      setDoctorName('');
      setEmergencyMedication('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleReaction = (reaction) => {
    if (selectedReactions.includes(reaction)) {
      setSelectedReactions(selectedReactions.filter((r) => r !== reaction));
    } else {
      setSelectedReactions([...selectedReactions, reaction]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allergenName.trim()) {
      setError('Please provide the food allergen name.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      allergenName: allergenName.trim(),
      allergenCategory,
      severity,
      diagnosisType,
      knownReactions: selectedReactions,
      reactionDescription: reactionDescription.trim(),
      doctorName: doctorName.trim(),
      emergencyMedication: emergencyMedication.trim(),
    };

    try {
      let res;
      if (initialData && initialData._id) {
        res = await api.put(`/allergies/${initialData._id}`, payload);
      } else {
        res = await api.post('/allergies', payload);
      }

      onSaved(res.data.data, !!initialData);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Failed to save food allergy record. Please check the inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-teal-200" />
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Update Food Allergy Record' : 'Record New Food Allergy'}
              </h3>
              <p className="text-xs text-teal-100">
                Logged to your secure health record in MongoDB Atlas
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Allergen Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Food Allergen Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={allergenName}
                onChange={(e) => setAllergenName(e.target.value)}
                placeholder="e.g. Peanuts, Shrimp, Cow's Milk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Allergen Category
              </label>
              <select
                value={allergenCategory}
                onChange={(e) => setAllergenCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs bg-white"
              >
                <option value="Mild">Mild (Minor rash, localized itching)</option>
                <option value="Moderate">Moderate (Systemic hives, swelling, GI distress)</option>
                <option value="Severe / Anaphylactic Risk">
                  Severe / Anaphylactic Risk (Airway restriction, EpiPen required)
                </option>
              </select>
            </div>

            {/* Diagnosis Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diagnosis Classification
              </label>
              <select
                value={diagnosisType}
                onChange={(e) => setDiagnosisType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs bg-white"
              >
                <option value="Doctor-Confirmed Diagnosis">Doctor-Confirmed Diagnosis</option>
                <option value="Prescription Documented">Prescription Documented</option>
                <option value="Suspected by Patient">Suspected by Patient</option>
                <option value="Family History / Precautionary">Family History / Precautionary</option>
              </select>
            </div>
          </div>

          {/* Known Reactions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Known Allergic Reactions & Symptoms
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_REACTIONS.map((reaction) => {
                const isSelected = selectedReactions.includes(reaction);
                return (
                  <button
                    type="button"
                    key={reaction}
                    onClick={() => toggleReaction(reaction)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {reaction}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reaction Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Reaction Notes / Patient Experience
            </label>
            <textarea
              rows={2}
              value={reactionDescription}
              onChange={(e) => setReactionDescription(e.target.value)}
              placeholder="Describe symptom onset, timing, exposure details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prescribing Doctor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diagnosing Doctor / Clinic
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. A. Johnson, MD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Emergency Medication */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prescribed Emergency Medication
              </label>
              <input
                type="text"
                value={emergencyMedication}
                onChange={(e) => setEmergencyMedication(e.target.value)}
                placeholder="e.g. Epinephrine Auto-Injector 0.3mg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              {loading ? 'Saving to Database...' : initialData ? 'Update Record' : 'Save Allergy Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
