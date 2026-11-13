import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Info,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
} from 'lucide-react';
import api from '../services/api';

const TEST_TYPES = [
  'Specific IgE Blood Test',
  'Skin Prick Test (SPT)',
  'Oral Food Challenge (OFC)',
  'Patch Test',
  'Total IgE Test',
  'Component-Resolved Diagnostics (CRD)',
  'Doctor Clinical Evaluation / Prescription',
  'Other',
];

const TODAY_DATE_STRING = new Date().toISOString().split('T')[0];

export default function ReportReviewModal({
  isOpen,
  onClose,
  report,
  onConfirmedSaved,
}) {
  // Extracted Data Form State
  const [clinicOrLabName, setClinicOrLabName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [testDate, setTestDate] = useState(TODAY_DATE_STRING);
  const [clinicalDiagnosisStatus, setClinicalDiagnosisStatus] = useState(
    'Recorded Test Result (Not yet confirmed)'
  );

  // General Vitals / Lab measurements
  const [bloodPressure, setBloodPressure] = useState(null);
  const [bloodSugar, setBloodSugar] = useState(null);
  const [cholesterol, setCholesterol] = useState(null);
  const [totalIgE, setTotalIgE] = useState(null);

  // Extracted Allergy Tests
  const [tests, setTests] = useState([]);

  // Raw OCR text preview accordion
  const [showRawText, setShowRawText] = useState(false);

  // Document Viewer State
  const [fileBlobUrl, setFileBlobUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loadingFile, setLoadingFile] = useState(true);

  // Submission State
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [error, setError] = useState('');

  // Initialize fields on mount / report change
  useEffect(() => {
    if (report && report.structuredExtractedData) {
      const structured = report.structuredExtractedData;
      setClinicOrLabName(structured.clinicOrLabName || '');
      setDoctorName(structured.doctorName || '');
      setTestDate(
        structured.testDate
          ? new Date(structured.testDate).toISOString().split('T')[0]
          : TODAY_DATE_STRING
      );
      setClinicalDiagnosisStatus(
        structured.clinicalDiagnosisStatus || 'Recorded Test Result (Not yet confirmed)'
      );

      const vitals = structured.generalMeasurements || {};
      setBloodPressure(vitals.bloodPressure || null);
      setBloodSugar(vitals.bloodSugar || null);
      setCholesterol(vitals.cholesterol || null);
      setTotalIgE(vitals.totalIgE || null);

      const initialTests = (structured.allergyTests || []).map((t, idx) => ({
        id: t._id || `test_${idx}_${Date.now()}`,
        allergenName: t.allergenName || '',
        allergenCategory: t.allergenCategory || 'Other Food',
        testType: t.testType || 'Specific IgE Blood Test',
        testResult: t.testResult || '',
        units: t.units || 'kUA/L',
        referenceRange: t.referenceRange || '',
        confidence: t.confidence || 'needs_review',
        confidenceScore: t.confidenceScore || 50,
        notes: t.notes || '',
        selected: t.selected !== false,
      }));
      setTests(initialTests);
    }
    setError('');
  }, [report]);

  // Fetch document file securely via authenticated stream
  useEffect(() => {
    let active = true;
    let objectUrl = null;

    const fetchFile = async () => {
      if (!report || !report._id) return;
      setLoadingFile(true);
      try {
        const res = await api.get(`/medical-reports/${report._id}/file`, {
          responseType: 'blob',
        });
        if (active) {
          objectUrl = URL.createObjectURL(res.data);
          setFileBlobUrl(objectUrl);
        }
      } catch (err) {
        console.warn('Could not load report file blob:', err.message);
      } finally {
        if (active) setLoadingFile(false);
      }
    };

    fetchFile();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [report]);

  // Test field modifiers
  const updateTest = (index, field, value) => {
    setTests((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, [field]: value } : t))
    );
  };

  const removeTest = (index) => {
    setTests((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addManualTest = () => {
    setTests((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        allergenName: '',
        allergenCategory: 'Peanuts',
        testType: 'Specific IgE Blood Test',
        testResult: '',
        units: 'kUA/L',
        referenceRange: '',
        confidence: 'high',
        confidenceScore: 100,
        notes: 'Manually entered test result',
        selected: true,
      },
    ]);
  };

  // Reprocess Document OCR
  const handleReprocess = async () => {
    setReprocessing(true);
    setError('');
    try {
      const res = await api.post(`/medical-reports/${report._id}/process`);
      const newStructured = res.data.data.structuredExtractedData || {};
      setClinicOrLabName(newStructured.clinicOrLabName || '');
      setDoctorName(newStructured.doctorName || '');
      setTests(
        (newStructured.allergyTests || []).map((t, idx) => ({
          id: t._id || `re_${idx}_${Date.now()}`,
          allergenName: t.allergenName,
          allergenCategory: t.allergenCategory || 'Other Food',
          testType: t.testType || 'Specific IgE Blood Test',
          testResult: t.testResult,
          units: t.units || 'kUA/L',
          referenceRange: t.referenceRange || '',
          confidence: t.confidence || 'needs_review',
          confidenceScore: t.confidenceScore || 50,
          notes: t.notes || '',
          selected: true,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reprocess document.');
    } finally {
      setReprocessing(false);
    }
  };

  // Confirm and Save Verified Data
  const handleConfirmAndSave = async () => {
    const selectedTests = tests.filter((t) => t.selected);
    if (selectedTests.length === 0) {
      setError('Please select at least one verified test item to save.');
      return;
    }

    // Validate that required fields are present
    for (const item of selectedTests) {
      if (!item.allergenName.trim()) {
        setError('All selected tests must have an allergen or test name.');
        return;
      }
      if (!item.testResult.trim() || item.testResult === 'needs_review') {
        setError(
          `Please enter a valid numerical or qualitative result for test "${item.allergenName}".`
        );
        return;
      }
    }

    setSaving(true);
    setError('');

    const payload = {
      clinicOrLabName: clinicOrLabName.trim(),
      doctorName: doctorName.trim(),
      testDate,
      clinicalDiagnosisStatus,
      tests: selectedTests.map((t) => ({
        allergenName: t.allergenName.trim(),
        allergenCategory: t.allergenCategory,
        testType: t.testType,
        testResult: t.testResult.trim(),
        units: t.units.trim(),
        referenceRange: t.referenceRange.trim(),
        isDoctorConfirmedDiagnosis: clinicalDiagnosisStatus === 'Doctor-Confirmed Diagnosis',
        clinicalDiagnosisStatus,
        notes: t.notes.trim(),
      })),
      generalMeasurements: {
        bloodPressure,
        bloodSugar,
        cholesterol,
        totalIgE,
      },
    };

    try {
      const res = await api.post(`/medical-reports/${report._id}/confirm`, payload);
      onConfirmedSaved(res.data.data, res.data.report);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to save verified medical records. Please check the inputs.'
      );
    } finally {
      setSaving(false);
    }
  };

  const isPdf = report?.fileType === 'application/pdf';

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                  Verify Extracted Medical Report Data
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-100 text-[11px] font-semibold">
                  OCR Engine: {report.ocrEngine || 'Hybrid'}
                </span>
              </div>
              <p className="text-xs text-teal-100">
                Document: <span className="font-mono">{report.originalFileName}</span> &bull; Verify and correct fields before saving to health portal
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

        {/* Clinical Guardrail Alert Notice */}
        <div className="bg-sky-50 px-6 py-2.5 border-b border-sky-100 flex items-start gap-2.5 text-xs text-sky-950 shrink-0">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p>
            <strong>Mandatory Verification Guardrail:</strong> OCR extractions are suggestions to assist you. Sensitization results (IgE titers / wheals) are recorded as laboratory observations and do not constitute an automated medical diagnosis. Please inspect against your original document.
          </p>
        </div>

        {/* Main Split Body: Document Preview (Left) vs Structured Form (Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* LEFT: Original Document Viewer (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-100/70 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                Original Document Preview
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 20, 60))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-slate-600 px-1.5">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 20, 200))}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Render Window */}
            <div className="flex-1 min-h-[300px] lg:min-h-[480px] bg-white rounded-2xl border border-slate-300 shadow-inner overflow-auto flex items-center justify-center p-2 relative">
              {loadingFile ? (
                <div className="text-center space-y-2 text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                  <p>Loading document from encrypted server storage...</p>
                </div>
              ) : fileBlobUrl ? (
                isPdf ? (
                  <iframe
                    src={`${fileBlobUrl}#view=FitH`}
                    title="PDF Document"
                    className="w-full h-full min-h-[460px] rounded-xl border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <img
                      src={fileBlobUrl}
                      alt="Uploaded Medical Document"
                      style={{ width: `${zoomLevel}%` }}
                      className="max-w-none transition-all duration-150 rounded shadow-xs"
                    />
                  </div>
                )
              ) : (
                <div className="text-center p-6 text-xs text-slate-400">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <span>Document preview unavailable.</span>
                </div>
              )}
            </div>

            {/* Reprocess Document Trigger */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                OCR Status: <strong className="text-teal-700 capitalize">{report.processingStatus}</strong>
              </span>
              <button
                type="button"
                onClick={handleReprocess}
                disabled={reprocessing}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 p-1 hover:bg-white rounded transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
                <span>{reprocessing ? 'Reprocessing...' : 'Reprocess OCR'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Structured Verification Form (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-5 overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: REPORT SOURCE & CLINICAL STATUS */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Testing Facility & Ordering Provider
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Extracted Header
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Clinic / Lab Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Laboratory / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={clinicOrLabName}
                    onChange={(e) => setClinicOrLabName(e.target.value)}
                    placeholder="e.g. Quest Diagnostics, Metro Allergy"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                {/* Test Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Date of Test
                  </label>
                  <input
                    type="date"
                    max={TODAY_DATE_STRING}
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                {/* Ordering Doctor */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ordering / Reviewing Physician
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Marcus Bennett, MD"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {/* Clinical Confirmation Distinction Toggle */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Confirmation Status (Preserves Distinction)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setClinicalDiagnosisStatus('Recorded Test Result (Not yet confirmed)')
                    }
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                      clinicalDiagnosisStatus !== 'Doctor-Confirmed Diagnosis'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Lab Test / Observation Only</span>
                      {clinicalDiagnosisStatus !== 'Doctor-Confirmed Diagnosis' && (
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Sensitization recorded; not yet formally confirmed by physician.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClinicalDiagnosisStatus('Doctor-Confirmed Diagnosis')}
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                      clinicalDiagnosisStatus === 'Doctor-Confirmed Diagnosis'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Doctor-Confirmed Diagnosis</span>
                      {clinicalDiagnosisStatus === 'Doctor-Confirmed Diagnosis' && (
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Physician has officially reviewed report and validated diagnosis.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: MISSING DATA & GENERAL MEASUREMENTS CARD */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  General Measurements & Missing Data Audit
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Absent values preserved as null (never invented)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Blood Pressure */}
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    Blood Pressure
                  </span>
                  <input
                    type="text"
                    value={bloodPressure || ''}
                    onChange={(e) => setBloodPressure(e.target.value || null)}
                    placeholder="null"
                    className="w-full mt-1 font-bold text-slate-800 text-xs border-b border-transparent focus:border-teal-500 focus:outline-none"
                  />
                  {!bloodPressure && (
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                      null (absent)
                    </span>
                  )}
                </div>

                {/* Blood Sugar */}
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    Blood Sugar
                  </span>
                  <input
                    type="text"
                    value={bloodSugar || ''}
                    onChange={(e) => setBloodSugar(e.target.value || null)}
                    placeholder="null"
                    className="w-full mt-1 font-bold text-slate-800 text-xs border-b border-transparent focus:border-teal-500 focus:outline-none"
                  />
                  {!bloodSugar && (
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                      null (absent)
                    </span>
                  )}
                </div>

                {/* Cholesterol */}
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    Cholesterol
                  </span>
                  <input
                    type="text"
                    value={cholesterol || ''}
                    onChange={(e) => setCholesterol(e.target.value || null)}
                    placeholder="null"
                    className="w-full mt-1 font-bold text-slate-800 text-xs border-b border-transparent focus:border-teal-500 focus:outline-none"
                  />
                  {!cholesterol && (
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                      null (absent)
                    </span>
                  )}
                </div>

                {/* Total IgE */}
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    Total IgE
                  </span>
                  <input
                    type="text"
                    value={totalIgE || ''}
                    onChange={(e) => setTotalIgE(e.target.value || null)}
                    placeholder="null"
                    className="w-full mt-1 font-bold text-slate-800 text-xs border-b border-transparent focus:border-teal-500 focus:outline-none"
                  />
                  {!totalIgE && (
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                      null (absent)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: EXTRACTED ALLERGY DIAGNOSTIC TESTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extracted Food Allergy Diagnostic Tests ({tests.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Review allergen names, numerical decimals, units, and separated reference ranges
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addManualTest}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors flex items-center gap-1 border border-teal-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Test</span>
                </button>
              </div>

              {tests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p>No specific food allergy test lines detected in document.</p>
                  <button
                    type="button"
                    onClick={addManualTest}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs"
                  >
                    Add Test Record Manually
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((item, idx) => {
                    const isNeedsReview =
                      item.confidence === 'needs_review' ||
                      item.confidence === 'low' ||
                      !item.testResult ||
                      item.testResult === 'needs_review';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isNeedsReview
                            ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Top: Selection, Title, Confidence Badge & Delete */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => updateTest(idx, 'selected', e.target.checked)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs font-bold text-slate-800">
                              Item #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Confidence Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                item.confidence === 'high'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.confidence === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.confidence === 'high' && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              )}
                              {item.confidence === 'medium' && (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              )}
                              {isNeedsReview && <AlertCircle className="w-3 h-3 text-rose-600" />}
                              <span>
                                {item.confidence === 'high'
                                  ? 'High Confidence'
                                  : item.confidence === 'medium'
                                  ? 'Medium Confidence'
                                  : 'Needs Review'}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeTest(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Test Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                          {/* Allergen Name */}
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Tested Allergen / Food Item <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={item.allergenName}
                              onChange={(e) => updateTest(idx, 'allergenName', e.target.value)}
                              placeholder="e.g. Peanut (f13), Shrimp, Cow's Milk"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Test Modality */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Test Modality
                            </label>
                            <select
                              value={item.testType}
                              onChange={(e) => updateTest(idx, 'testType', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                            >
                              {TEST_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Numerical Result (Decimals preserved) */}
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Result Value <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={item.testResult}
                              onChange={(e) => updateTest(idx, 'testResult', e.target.value)}
                              placeholder="e.g. 24.6, 7.5, <0.35"
                              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold ${
                                isNeedsReview
                                  ? 'border-rose-400 bg-white text-rose-900 focus:ring-rose-500'
                                  : 'border-slate-300 text-slate-900 focus:ring-teal-500'
                              }`}
                            />
                          </div>

                          {/* Units */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Result Units
                            </label>
                            <input
                              type="text"
                              value={item.units}
                              onChange={(e) => updateTest(idx, 'units', e.target.value)}
                              placeholder="e.g. kUA/L, mm wheal"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Reference Range (Separated from result) */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Reference Interval (Separated)
                            </label>
                            <input
                              type="text"
                              value={item.referenceRange}
                              onChange={(e) => updateTest(idx, 'referenceRange', e.target.value)}
                              placeholder="e.g. < 0.35 kUA/L, 0.0 mm"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Notes */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Extraction Notes
                            </label>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateTest(idx, 'notes', e.target.value)}
                              placeholder="Clinical observations or flags"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RAW OCR TEXT INSPECTOR ACCORDION */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  View Raw OCR Text Stream ({report.ocrExtractedText?.length || 0} characters)
                </span>
                {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRawText && (
                <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {report.ocrExtractedText || 'No raw text stored.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>
              Selected tests will be saved permanently to your official health record in MongoDB Atlas.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel / Close
            </button>
            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Verified Records...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Verified Records to Health Portal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
