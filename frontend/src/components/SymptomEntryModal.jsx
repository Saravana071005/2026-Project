import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  HeartPulse,
  PhoneCall,
  Utensils,
} from 'lucide-react';
import api from '../services/api';

const SYMPTOM_CATEGORIES = {
  Skin: ['Itching', 'Hives (Urticaria)', 'Rashes', 'Redness / Flushing', 'Swelling (Angioedema)', 'Warmth / Heat sensation'],
  Digestive: ['Stomach pain / Cramps', 'Nausea', 'Vomiting', 'Diarrhea', 'Bloating', 'Indigestion'],
  Respiratory: ['Wheezing', 'Cough', 'Breathing difficulty', 'Throat tightness', 'Nasal congestion', 'Sneezing'],
  'Systemic / Other': ['Dizziness', 'Faintness', 'Chest tightness', 'Confusion / Collapse', 'Hypotension', 'Other symptom'],
};

const SEVERITY_LEVELS = [
  { level: 'Mild', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { level: 'Moderate', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { level: 'Severe', color: 'bg-rose-50 text-rose-800 border-rose-300' },
  { level: 'Life-Threatening / Emergency', color: 'bg-red-100 text-red-900 border-red-500 font-extrabold animate-pulse' },
];

const ONSET_INTERVALS = [
  'Immediate (< 15 mins)',
  'Rapid (15 - 30 mins)',
  'Intermediate (30 - 60 mins)',
  '1 - 2 hours',
  '2 - 4 hours',
  'Delayed (> 4 hours)',
  'Uncertain / Unknown',
];

const TREATMENTS_LIST = [
  'None',
  'Antihistamine (e.g. Cetirizine, Diphenhydramine)',
  'Epinephrine Auto-Injector (EpiPen, Auvi-Q)',
  'Inhaler / Bronchodilator (Albuterol)',
  'Oral Corticosteroids',
  'Other Medication',
];

const TODAY_DATE_STR = new Date().toISOString().split('T')[0];

export default function SymptomEntryModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  recentFoods = [],
}) {
  const [foodEntryId, setFoodEntryId] = useState('');
  const [foodConsumed, setFoodConsumed] = useState('');
  const [_consumptionTime, setConsumptionTime] = useState('');
  const [symptomName, setSymptomName] = useState('Itching');
  const [symptomCategory, setSymptomCategory] = useState('Skin');
  const [symptomSeverity, setSymptomSeverity] = useState('Moderate');
  const [symptomDate, setSymptomDate] = useState(TODAY_DATE_STR);
  const [symptomStartTime, setSymptomStartTime] = useState('13:00');
  const [onsetInterval, setOnsetInterval] = useState('Intermediate (30 - 60 mins)');
  const [symptomDuration, setSymptomDuration] = useState('30 minutes');
  const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
  const [treatmentTaken, setTreatmentTaken] = useState('None');
  const [medicalAttentionRequired, setMedicalAttentionRequired] = useState(false);
  const [medicalFacilityVisited, setMedicalFacilityVisited] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFoodEntryId(initialData.foodEntryId?._id || initialData.foodEntryId || '');
      setFoodConsumed(initialData.foodConsumed || '');
      setSymptomName(initialData.symptomName || 'Itching');
      setSymptomCategory(initialData.symptomCategory || 'Skin');
      setSymptomSeverity(initialData.symptomSeverity || 'Moderate');
      setSymptomDate(
        initialData.symptomDate
          ? new Date(initialData.symptomDate).toISOString().split('T')[0]
          : TODAY_DATE_STR
      );
      setSymptomStartTime(initialData.symptomStartTime || '13:00');
      setOnsetInterval(initialData.onsetInterval || 'Intermediate (30 - 60 mins)');
      setSymptomDuration(initialData.symptomDuration || '');
      setAdditionalSymptoms(initialData.additionalSymptoms || []);
      setTreatmentTaken(initialData.treatmentTaken || 'None');
      setMedicalAttentionRequired(!!initialData.medicalAttentionRequired);
      setMedicalFacilityVisited(initialData.medicalFacilityVisited || '');
      setAdditionalNotes(initialData.additionalNotes || '');
    } else {
      setFoodEntryId('');
      setFoodConsumed('');
      setConsumptionTime('');
      setSymptomName('Itching');
      setSymptomCategory('Skin');
      setSymptomSeverity('Moderate');
      setSymptomDate(TODAY_DATE_STR);
      setSymptomStartTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setOnsetInterval('Intermediate (30 - 60 mins)');
      setSymptomDuration('30 minutes');
      setAdditionalSymptoms([]);
      setTreatmentTaken('None');
      setMedicalAttentionRequired(false);
      setMedicalFacilityVisited('');
      setAdditionalNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  // Real-time Emergency Pre-Check
  const isEmergencyActive = useMemo(() => {
    const combined = [
      symptomName,
      ...additionalSymptoms,
      symptomSeverity,
      additionalNotes,
    ].join(' ').toLowerCase();

    const redFlags = [
      'breathing difficulty',
      'difficulty breathing',
      'trouble breathing',
      'shortness of breath',
      'wheezing',
      'throat tightness',
      'swelling (angioedema)',
      'swollen tongue',
      'faintness',
      'collapse',
      'confusion',
      'anaphylaxis',
    ];

    const hasRedFlag = redFlags.some((flag) => combined.includes(flag));
    const isLifeThreatening =
      symptomSeverity === 'Life-Threatening / Emergency' || symptomSeverity === 'Severe';

    // Multi-system check (e.g. skin + respiratory, or skin + digestive)
    const hasSkin = combined.includes('itching') || combined.includes('hives') || combined.includes('rash');
    const hasResp = combined.includes('wheez') || combined.includes('throat') || combined.includes('breath');
    const hasDig = combined.includes('vomit') || combined.includes('stomach') || combined.includes('diarrhea');

    return hasRedFlag || isLifeThreatening || (hasSkin && (hasResp || hasDig));
  }, [symptomName, additionalSymptoms, symptomSeverity, additionalNotes]);

  if (!isOpen) return null;

  const toggleAdditionalSymptom = (symp) => {
    if (additionalSymptoms.includes(symp)) {
      setAdditionalSymptoms(additionalSymptoms.filter((s) => s !== symp));
    } else {
      setAdditionalSymptoms([...additionalSymptoms, symp]);
    }
  };

  const handleSelectRecentFood = (food) => {
    if (!food) {
      setFoodEntryId('');
      setFoodConsumed('');
      return;
    }
    setFoodEntryId(food._id);
    setFoodConsumed(food.foodName);
    if (food.consumptionTime) {
      setConsumptionTime(food.consumptionTime);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!symptomName.trim()) {
      setError('Please select or specify a symptom name.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        foodEntryId: foodEntryId || null,
        foodConsumed: foodConsumed.trim(),
        symptomName: symptomName.trim(),
        symptomCategory,
        symptomSeverity,
        symptomDate,
        symptomStartTime,
        onsetInterval,
        symptomDuration: symptomDuration.trim(),
        additionalSymptoms,
        treatmentTaken,
        medicalAttentionRequired,
        medicalFacilityVisited: medicalFacilityVisited.trim(),
        additionalNotes: additionalNotes.trim(),
      };

      let response;
      if (initialData?._id) {
        response = await api.put(`/symptoms/${initialData._id}`, payload);
      } else {
        response = await api.post('/symptoms', payload);
      }

      const savedSymptom = response.data.data;
      onSaved(savedSymptom, !!initialData?._id, response.data.emergencyAlert);
      onClose();
    } catch (err) {
      console.error('Failed to save symptom record:', err);
      setError(err.response?.data?.message || 'Failed to save symptom record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-700 via-rose-800 to-amber-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <HeartPulse className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Edit Reaction in Journal' : 'Record Symptom / Reaction in Journal'}
              </h3>
              <p className="text-xs text-rose-100">
                Log reactions after eating to correlate with food intake and medical test records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IMMEDIATE ZERO-LATENCY EMERGENCY SAFETY ALERT BANNER */}
        {isEmergencyActive && (
          <div className="p-4 bg-red-600 text-white flex items-start gap-3 shadow-inner animate-pulse">
            <PhoneCall className="w-6 h-6 text-white shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs space-y-1">
              <p className="font-black text-sm uppercase tracking-wider">
                CRITICAL ALLERGY EMERGENCY ADVISORY:
              </p>
              <p className="leading-relaxed">
                The symptoms you have selected (such as breathing difficulty, throat tightness, or multi-system involvement) indicate a potential severe allergic reaction or anaphylaxis.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 font-bold text-red-100">
                <span className="bg-white text-red-700 px-2.5 py-1 rounded-lg text-xs font-black">
                  CALL EMERGENCY SERVICES (911 / 112) NOW
                </span>
                <span>• Use prescribed Epinephrine (EpiPen) without delay.</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Linked Food (Optional) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-rose-600" />
              Food Consumed (Select from recent meals or enter manually)
            </label>

            {recentFoods.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-500 font-semibold shrink-0">Recent:</span>
                {recentFoods.slice(0, 4).map((f) => (
                  <button
                    key={f._id}
                    type="button"
                    onClick={() => handleSelectRecentFood(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                      foodEntryId === f._id
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.foodName} ({f.mealType})
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={foodConsumed}
              onChange={(e) => setFoodConsumed(e.target.value)}
              placeholder="e.g. Wheat Dosa, Peanut Butter, or leave empty if unknown"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-slate-500 italic">
              Note: You can record symptoms even if you are not sure which food caused them.
            </p>
          </div>

          {/* Primary Symptom Category & Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Select Primary Symptom Category & Symptom <span className="text-rose-500">*</span>
            </label>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {Object.keys(SYMPTOM_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSymptomCategory(cat);
                    setSymptomName(SYMPTOM_CATEGORIES[cat][0]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    symptomCategory === cat
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Selectable Pills for Active Category */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYMPTOM_CATEGORIES[symptomCategory].map((symp) => (
                <button
                  key={symp}
                  type="button"
                  onClick={() => setSymptomName(symp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    symptomName === symp
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {symp}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Symptom Severity Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map(({ level, color }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSymptomSeverity(level)}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    symptomSeverity === level
                      ? `${color} ring-2 ring-rose-500 shadow-xs`
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Concurrent Symptoms */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="text-xs font-bold text-slate-700">
              Additional Accompanying Symptoms (Select all that occurred)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Itching',
                'Hives',
                'Facial Swelling',
                'Stomach Pain',
                'Nausea',
                'Vomiting',
                'Wheezing',
                'Throat Tightness',
                'Dizziness',
                'Faintness',
                'Cough',
                'Diarrhea',
              ]
                .filter((s) => s !== symptomName)
                .map((symp) => {
                  const isSelected = additionalSymptoms.includes(symp);
                  return (
                    <button
                      key={symp}
                      type="button"
                      onClick={() => toggleAdditionalSymptom(symp)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {symp} {isSelected && '✓'}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Timing Row: Date, Start Time, Onset Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Symptom Date
              </label>
              <input
                type="date"
                required
                value={symptomDate}
                onChange={(e) => setSymptomDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Start Time
              </label>
              <input
                type="time"
                required
                value={symptomStartTime}
                onChange={(e) => setSymptomStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Time After Food (Onset)</label>
              <select
                value={onsetInterval}
                onChange={(e) => setOnsetInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {ONSET_INTERVALS.map((intv) => (
                  <option key={intv} value={intv}>
                    {intv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration & Treatment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Symptom Duration</label>
              <input
                type="text"
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                placeholder="e.g. 45 minutes, 2 hours, Still ongoing"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Treatment Taken</label>
              <select
                value={treatmentTaken}
                onChange={(e) => setTreatmentTaken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {TREATMENTS_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medical Attention Checkbox */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Did you require emergency or hospital medical care?
              </span>
              <span className="text-[11px] text-slate-500">
                Check this if you visited an emergency department or urgent care clinic.
              </span>
            </div>
            <input
              type="checkbox"
              checked={medicalAttentionRequired}
              onChange={(e) => setMedicalAttentionRequired(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
            />
          </div>

          {medicalAttentionRequired && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Hospital / Facility Name</label>
              <input
                type="text"
                value={medicalFacilityVisited}
                onChange={(e) => setMedicalFacilityVisited(e.target.value)}
                placeholder="e.g. Metro City Emergency Department"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* User Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Detailed Clinical Description</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Itching began around lips 20 minutes after eating dosa. Spread to forearms with raised hives. Disappeared after 1 hour."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                isEmergencyActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : initialData ? 'Update Symptom Entry' : 'Save Symptom to Journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
