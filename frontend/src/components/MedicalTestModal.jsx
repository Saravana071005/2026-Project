import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertCircle,
  FileCheck,
  Info,
  Check,
  User,
  Sparkles,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TEST_SCHEMAS,
  SUPPORTED_TEST_TYPES_LIST,
  getTestSchemaByIdOrName,
} from '../config/testSchemas';

const TODAY_DATE_STRING = new Date().toISOString().split('T')[0];

export default function MedicalTestModal({ isOpen, onClose, onSaved, initialData, defaultCategory = null }) {
  const { user } = useAuth();

  // Test Modality Category Selection
  const [selectedCategory, setSelectedCategory] = useState('specific_ige');
  const activeSchema = useMemo(
    () => TEST_SCHEMAS[selectedCategory] || TEST_SCHEMAS.specific_ige,
    [selectedCategory]
  );

  // Form Values State (Keyed by schema field keys)
  const [formValues, setFormValues] = useState({});
  const [customParams, setCustomParams] = useState([]);

  // Clinical Confirmation & Common Clinical Meta
  const [isDoctorConfirmedDiagnosis, setIsDoctorConfirmedDiagnosis] = useState(false);
  const [clinicalDiagnosisStatus, setClinicalDiagnosisStatus] = useState(
    'Recorded Test Result (Not yet confirmed)'
  );
  const [doctorNotes, setDoctorNotes] = useState('');
  const [recordedReactionDetails, setRecordedReactionDetails] = useState('');
  const [clinicOrLabName, setClinicOrLabName] = useState('');
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize or reset form state on open / initialData change
  useEffect(() => {
    if (initialData) {
      const resolvedSchema = getTestSchemaByIdOrName(
        initialData.testCategory || initialData.testType
      );
      setSelectedCategory(resolvedSchema.id);

      const initialVals = {
        allergenName: initialData.allergenName || '',
        testDate: initialData.testDate
          ? new Date(initialData.testDate).toISOString().split('T')[0]
          : TODAY_DATE_STRING,
        specificIgEValue: initialData.testResult || '',
        whealDiameter: initialData.testResult || '',
        totalIgEValue: initialData.testResult || '',
        units: initialData.units || resolvedSchema.defaultUnits || '',
        referenceInterval: initialData.referenceRange || '',
        ...(initialData.testSpecificParameters || {}),
      };
      setFormValues(initialVals);

      setCustomParams(initialData.customParameters || []);
      setIsDoctorConfirmedDiagnosis(!!initialData.isDoctorConfirmedDiagnosis);
      setClinicalDiagnosisStatus(
        initialData.clinicalDiagnosisStatus || 'Recorded Test Result (Not yet confirmed)'
      );
      setDoctorNotes(initialData.doctorNotes || '');
      setRecordedReactionDetails(initialData.recordedReactionDetails || '');
      setClinicOrLabName(initialData.clinicOrLabName || '');
      setWarningAcknowledged(!!initialData.clinicalWarningAcknowledged);
    } else {
      const startCategory = defaultCategory || 'specific_ige';
      const schema = TEST_SCHEMAS[startCategory] || TEST_SCHEMAS.specific_ige;
      setSelectedCategory(schema.id);

      const defaultVals = {
        testDate: TODAY_DATE_STRING,
        units: schema.defaultUnits || '',
      };
      schema.fields.forEach((f) => {
        if (f.default !== undefined) {
          defaultVals[f.key] = f.default;
        }
      });
      setFormValues(defaultVals);

      setCustomParams([]);
      setIsDoctorConfirmedDiagnosis(false);
      setClinicalDiagnosisStatus('Recorded Test Result (Not yet confirmed)');
      setDoctorNotes('');
      setRecordedReactionDetails('');
      setClinicOrLabName('');
      setWarningAcknowledged(false);
    }
    setError('');
  }, [initialData, isOpen, defaultCategory]);

  if (!isOpen) return null;

  // Handle switching test category tab
  const handleCategorySwitch = (categoryKey) => {
    setSelectedCategory(categoryKey);
    const newSchema = TEST_SCHEMAS[categoryKey];
    setFormValues((prev) => {
      const updated = { ...prev };
      if (!updated.units || !newSchema.allowedUnits.includes(updated.units)) {
        updated.units = newSchema.defaultUnits || '';
      }
      return updated;
    });
    setError('');
  };

  const handleFieldChange = (key, value) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };

      // Auto-calculate Net Wheal Difference for Skin Prick Test
      if (key === 'whealDiameter' || key === 'negativeControl') {
        const wheal = parseFloat(key === 'whealDiameter' ? value : updated.whealDiameter);
        const neg = parseFloat(key === 'negativeControl' ? value : updated.negativeControl || '0');
        if (!isNaN(wheal) && !isNaN(neg)) {
          updated.netDifference = (wheal - neg).toFixed(1);
        }
      }

      return updated;
    });
  };

  // Custom Parameter Handlers
  const addCustomParam = () => {
    setCustomParams((prev) => [...prev, { key: '', value: '', unit: '' }]);
  };

  const updateCustomParam = (index, field, value) => {
    setCustomParams((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  const removeCustomParam = (index) => {
    setCustomParams((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmationToggle = (confirmed) => {
    setIsDoctorConfirmedDiagnosis(confirmed);
    setClinicalDiagnosisStatus(
      confirmed
        ? 'Doctor-Confirmed Diagnosis'
        : 'Recorded Test Result (Not yet confirmed)'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine Primary Allergen / Food name from active schema
    const primaryName =
      formValues.allergenName ||
      formValues.foodTested ||
      formValues.allergenTested ||
      '';

    if (!primaryName.trim()) {
      setError(`Please provide the ${activeSchema.fields[0].label}.`);
      return;
    }

    if (!formValues.testDate) {
      setError('Test date is required.');
      return;
    }

    // Determine primary test result
    let primaryResult =
      formValues.specificIgEValue ||
      formValues.whealDiameter ||
      formValues.totalIgEValue ||
      formValues.clinicalOutcome ||
      formValues.activatedBasophilPercent ||
      formValues.skinReactionFindings ||
      '';

    if (!primaryResult.trim()) {
      setError(`Please provide the primary test measurement or result.`);
      return;
    }

    // If intradermal, verify clinical warning acknowledgment
    if (activeSchema.id === 'intradermal' && !warningAcknowledged) {
      setError(
        'Please acknowledge the clinical warning: Intradermal testing is not recommended for food allergy diagnosis.'
      );
      return;
    }

    setLoading(true);
    setError('');

    // Construct test-specific parameters map
    const testSpecificParameters = {};
    const parameterStatus = {};
    const parameterConfidence = {};

    activeSchema.fields.forEach((field) => {
      const val = formValues[field.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        testSpecificParameters[field.key] = val;
        parameterStatus[field.key] = 'user_verified';
        parameterConfidence[field.key] = 100;
      } else {
        testSpecificParameters[field.key] = null;
        parameterStatus[field.key] = 'not_mentioned';
        parameterConfidence[field.key] = 0;
      }
    });

    const payload = {
      allergenName: primaryName.trim(),
      testType: activeSchema.standardTestTypeName,
      testCategory: activeSchema.id,
      testDate: formValues.testDate,
      testResult: primaryResult.trim(),
      units: formValues.units || activeSchema.defaultUnits || '',
      referenceRange: formValues.referenceInterval || '',
      isDoctorConfirmedDiagnosis,
      clinicalDiagnosisStatus,
      doctorNotes: doctorNotes.trim() || formValues.doctorConclusion || '',
      recordedReactionDetails: recordedReactionDetails.trim() || formValues.observedSymptoms || '',
      clinicOrLabName: clinicOrLabName.trim() || formValues.clinicOrLabName || formValues.laboratoryName || '',
      testSpecificParameters,
      parameterStatus,
      parameterConfidence,
      customParameters: customParams.filter((p) => p.key.trim() && p.value.trim()),
      clinicalWarningAcknowledged: warningAcknowledged,
    };

    try {
      let res;
      if (initialData && initialData._id) {
        res = await api.put(`/medical-tests/${initialData._id}`, payload);
      } else {
        res = await api.post('/medical-tests', payload);
      }

      onSaved(res.data.data, !!initialData);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Failed to save medical test record. Please check inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                {initialData ? 'Update Test-Specific Medical Record' : 'Dynamic Medical Test Questionnaire'}
              </h3>
              <p className="text-xs text-teal-100">
                Tailored diagnostic fields adhering to the Food Allergy Testing Educational Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* User Profile Reuse Info Banner */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <span className="font-bold text-slate-800">{user.name}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span>{user.sex || 'Patient'}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span>Age {user.age} yrs</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold text-[11px] border border-teal-200">
                Profile Verified
              </span>
            </div>
          )}

          {/* Test Modality Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Food Allergy Diagnostic Modality:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_TEST_TYPES_LIST.map((schema) => {
                const isSelected = selectedCategory === schema.id;
                return (
                  <button
                    key={schema.id}
                    type="button"
                    onClick={() => handleCategorySwitch(schema.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold shadow-xs ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold text-xs leading-tight">
                        {schema.shortName}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {schema.category.split(' ')[0]}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="mt-1 text-[10px] font-bold text-teal-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Educational Guidance Box for Selected Modality */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              activeSchema.id === 'intradermal'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-sky-50 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {activeSchema.id === 'intradermal' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              ) : (
                <Info className="w-4 h-4 text-sky-600" />
              )}
              <span>{activeSchema.name} – Clinical Context</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {activeSchema.description}
            </p>
            <p className="font-semibold text-slate-900">
              {activeSchema.clinicalSignificance}
            </p>

            {/* Cautionary Warning Checkbox for Intradermal */}
            {activeSchema.clinicalWarning && (
              <div className="mt-3 pt-3 border-t border-rose-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warningAcknowledged}
                    onChange={(e) => setWarningAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded border-rose-400 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="text-xs text-rose-900 font-semibold leading-tight">
                    I acknowledge that Intradermal testing is NOT recommended for food allergy diagnosis under AAAAI/EAACI clinical guidelines and is recorded here solely for medical record archival.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* DYNAMIC TEST-SPECIFIC FIELDS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Test-Specific Parameters ({activeSchema.shortName})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSchema.fields.map((field) => {
                const val = formValues[field.key] ?? '';

                if (field.type === 'select') {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800 shadow-xs"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {field.helpText && (
                        <p className="text-[11px] text-slate-400">{field.helpText}</p>
                      )}
                    </div>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        rows={2}
                        value={val}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800 shadow-xs resize-none"
                      />
                      {field.helpText && (
                        <p className="text-[11px] text-slate-400">{field.helpText}</p>
                      )}
                    </div>
                  );
                }

                if (field.type === 'date') {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="date"
                        max={TODAY_DATE_STRING}
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800 shadow-xs"
                      />
                      {field.helpText && (
                        <p className="text-[11px] text-slate-400">{field.helpText}</p>
                      )}
                    </div>
                  );
                }

                // Default text / number input
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={val}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-800 shadow-xs"
                    />
                    {field.helpText && (
                      <p className="text-[11px] text-slate-400">{field.helpText}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADDITIONAL CUSTOM PARAMETERS SECTION */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Additional Report Parameters (Optional)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Specify any lab measurements not covered in standard fields
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomParam}
                className="px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Parameter</span>
              </button>
            </div>

            {customParams.length > 0 && (
              <div className="space-y-2">
                {customParams.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Parameter name (e.g. CD203c MFI, Wheal Area)"
                      value={p.key}
                      onChange={(e) => updateCustomParam(idx, 'key', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={p.value}
                      onChange={(e) => updateCustomParam(idx, 'value', e.target.value)}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={p.unit}
                      onChange={(e) => updateCustomParam(idx, 'unit', e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomParam(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLINICAL CONFIRMATION TOGGLE */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                Clinical Diagnosis Distinction (Medical Accuracy Rule)
              </label>
              <p className="text-xs text-amber-900 leading-relaxed">
                Positive IgE antibodies or Skin Prick wheals indicate <strong>sensitization</strong>, which does not independently confirm clinical allergy without medical evaluation or oral challenge.
              </p>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => handleConfirmationToggle(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    !isDoctorConfirmedDiagnosis
                      ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Recorded Test Finding (Not yet doctor-confirmed)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmationToggle(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isDoctorConfirmedDiagnosis
                      ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Doctor-Confirmed Clinical Diagnosis</span>
                </button>
              </div>
            </div>

            {/* Optional Facility and Doctor Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Testing Facility / Laboratory:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quest Diagnostics, Metro Allergy Clinic"
                  value={clinicOrLabName}
                  onChange={(e) => setClinicOrLabName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observed Physical Reaction / Symptoms:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild lip tingling, urticaria, or None"
                  value={recordedReactionDetails}
                  onChange={(e) => setRecordedReactionDetails(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physician's Notes & Advice:
                </label>
                <textarea
                  rows={2}
                  placeholder="Doctor's dietary recommendations or follow-up test plan..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Update Record' : 'Save Test Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
