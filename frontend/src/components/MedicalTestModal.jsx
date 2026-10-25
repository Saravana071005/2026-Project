import React, { useState, useEffect } from 'react';
import { X, AlertCircle, FileCheck, Info, Check } from 'lucide-react';
import api from '../services/api';

const TEST_TYPES = [
  'Skin Prick Test (SPT)',
  'Specific IgE Blood Test',
  'Oral Food Challenge (OFC)',
  'Patch Test',
  'Total IgE Test',
  'Component-Resolved Diagnostics (CRD)',
  'Doctor Clinical Evaluation / Prescription',
  'Other',
];

const COMMON_UNITS = [
  'kUA/L (Specific IgE)',
  'mm wheal diameter (Skin Prick)',
  'IU/mL (Total IgE)',
  'Index / Ratio',
  'Positive / Negative qualitative',
  'grams consumed (Food Challenge)',
  'Other / None',
];

export default function MedicalTestModal({ isOpen, onClose, onSaved, initialData }) {
  const [allergenName, setAllergenName] = useState('');
  const [testType, setTestType] = useState('Skin Prick Test (SPT)');
  const [testDate, setTestDate] = useState('');
  const [testResult, setTestResult] = useState('');
  const [units, setUnits] = useState('mm wheal diameter (Skin Prick)');
  const [isDoctorConfirmedDiagnosis, setIsDoctorConfirmedDiagnosis] = useState(false);
  const [clinicalDiagnosisStatus, setClinicalDiagnosisStatus] = useState(
    'Recorded Test Result (Not yet confirmed)'
  );
  const [doctorNotes, setDoctorNotes] = useState('');
  const [recordedReactionDetails, setRecordedReactionDetails] = useState('');
  const [clinicOrLabName, setClinicOrLabName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setAllergenName(initialData.allergenName || '');
      setTestType(initialData.testType || 'Skin Prick Test (SPT)');
      setTestDate(
        initialData.testDate ? new Date(initialData.testDate).toISOString().split('T')[0] : ''
      );
      setTestResult(initialData.testResult || '');
      setUnits(initialData.units || '');
      setIsDoctorConfirmedDiagnosis(!!initialData.isDoctorConfirmedDiagnosis);
      setClinicalDiagnosisStatus(
        initialData.clinicalDiagnosisStatus || 'Recorded Test Result (Not yet confirmed)'
      );
      setDoctorNotes(initialData.doctorNotes || '');
      setRecordedReactionDetails(initialData.recordedReactionDetails || '');
      setClinicOrLabName(initialData.clinicOrLabName || '');
    } else {
      setAllergenName('');
      setTestType('Skin Prick Test (SPT)');
      setTestDate(new Date().toISOString().split('T')[0]);
      setTestResult('');
      setUnits('mm wheal diameter (Skin Prick)');
      setIsDoctorConfirmedDiagnosis(false);
      setClinicalDiagnosisStatus('Recorded Test Result (Not yet confirmed)');
      setDoctorNotes('');
      setRecordedReactionDetails('');
      setClinicOrLabName('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTestTypeChange = (newType) => {
    setTestType(newType);
    if (newType.includes('Skin Prick')) {
      setUnits('mm wheal diameter (Skin Prick)');
    } else if (newType.includes('Blood') || newType.includes('IgE')) {
      setUnits('kUA/L (Specific IgE)');
    } else if (newType.includes('Challenge')) {
      setUnits('grams consumed (Food Challenge)');
    }
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
    if (!allergenName.trim()) {
      setError('Food allergen name is required.');
      return;
    }
    if (!testDate) {
      setError('Test date is required.');
      return;
    }
    if (!testResult.trim()) {
      setError('Test result as written on the medical report is required.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      allergenName: allergenName.trim(),
      testType,
      testDate,
      testResult: testResult.trim(),
      units: units.trim(),
      isDoctorConfirmedDiagnosis,
      clinicalDiagnosisStatus,
      doctorNotes: doctorNotes.trim(),
      recordedReactionDetails: recordedReactionDetails.trim(),
      clinicOrLabName: clinicOrLabName.trim(),
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-700 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-cyan-200" />
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Update Medical Test Report' : 'Log Doctor Prescription / Lab Test'}
              </h3>
              <p className="text-xs text-cyan-100">
                Preserve clinical lab findings accurately without automated assumptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cyan-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Disclaimer Notice */}
        <div className="bg-sky-50 px-6 py-3 border-b border-sky-100 flex items-start gap-2.5 text-xs text-sky-900">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p>
            <strong>Prescription & Report Rule:</strong> Medical test results (such as IgE levels or wheal mm) are recorded exactly as written in your medical paperwork. A positive test indicates sensitization and must be distinguished from a doctor's confirmed allergy diagnosis.
          </p>
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
            {/* Allergen Tested */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tested Allergen / Food Item <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={allergenName}
                onChange={(e) => setAllergenName(e.target.value)}
                placeholder="e.g. Peanut (f13), Cow's Milk, Egg White"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Test Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Medical Test Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={testType}
                onChange={(e) => handleTestTypeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs bg-white"
              >
                {TEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Test / Prescription <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Laboratory or Clinic */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Testing Clinic or Laboratory
              </label>
              <input
                type="text"
                value={clinicOrLabName}
                onChange={(e) => setClinicOrLabName(e.target.value)}
                placeholder="e.g. LabCorp, Quest, St. Jude Allergy Clinic"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Test Result */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Test Result as Written on Report <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
                placeholder="e.g. 14.8, 6mm wheal, Positive, Class 3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
              />
            </div>

            {/* Units */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Result Units / Scale
              </label>
              <input
                type="text"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. kUA/L, mm, Index, Grade"
                list="units-datalist"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
              />
              <datalist id="units-datalist">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Clinical Confirmation Distinction Switch */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Clinical Confirmation Status
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleConfirmationToggle(false)}
                className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                  !isDoctorConfirmedDiagnosis
                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Lab Test / Observation Only</span>
                  {!isDoctorConfirmedDiagnosis && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Result recorded as test report; pending or not yet confirmed as active allergy.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmationToggle(true)}
                className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                  isDoctorConfirmedDiagnosis
                    ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Doctor-Confirmed Diagnosis</span>
                  {isDoctorConfirmedDiagnosis && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Physician has officially reviewed findings and made a clinical allergy diagnosis.
                </p>
              </button>
            </div>
          </div>

          {/* Doctor's Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Doctor's Notes, Clinical Interpretation & Prescription Orders
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Doctor recommends total strict peanut avoidance. Prescribed Epipen and scheduled retest in 12 months..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs resize-none"
            />
          </div>

          {/* Reaction Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Documented Reaction Details During / Prior to Test
            </label>
            <input
              type="text"
              value={recordedReactionDetails}
              onChange={(e) => setRecordedReactionDetails(e.target.value)}
              placeholder="e.g. Wheal and flare appeared in 15 minutes, no systemic symptoms observed"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-sm shadow-xs"
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md hover:from-cyan-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Report...' : initialData ? 'Update Test Report' : 'Save Test Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
