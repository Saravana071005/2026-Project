import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileCheck,
  User,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Activity,
  Calendar,
  AlertTriangle,
  Stethoscope,
  MapPin,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/ageCalculator';
import AllergyModal from '../components/AllergyModal';
import MedicalTestModal from '../components/MedicalTestModal';
import ProfileEditModal from '../components/ProfileEditModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('allergies'); // 'allergies' | 'tests' | 'profile'

  // Data States
  const [allergies, setAllergies] = useState([]);
  const [medicalTests, setMedicalTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals state
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: null, // 'allergy' | 'test'
    id: null,
    title: '',
    loading: false,
  });

  // Fetch data from MongoDB Atlas backend
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allergiesRes, testsRes] = await Promise.all([
        api.get('/allergies'),
        api.get('/medical-tests'),
      ]);
      setAllergies(allergiesRes.data.data || []);
      setMedicalTests(testsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load records:', err);
      setError('Could not load records from MongoDB Atlas. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Allergy callbacks
  const handleAllergySaved = (savedAllergy, isEdit) => {
    if (isEdit) {
      setAllergies((prev) =>
        prev.map((a) => (a._id === savedAllergy._id ? savedAllergy : a))
      );
      showToast('Food allergy record updated successfully.');
    } else {
      setAllergies((prev) => [savedAllergy, ...prev]);
      showToast('New food allergy record saved to MongoDB Atlas.');
    }
  };

  // Medical test callbacks
  const handleTestSaved = (savedTest, isEdit) => {
    if (isEdit) {
      setMedicalTests((prev) =>
        prev.map((t) => (t._id === savedTest._id ? savedTest : t))
      );
      showToast('Medical test record updated successfully.');
    } else {
      setMedicalTests((prev) => [savedTest, ...prev]);
      showToast('Medical test report saved to MongoDB Atlas.');
    }
  };

  // Profile update callback
  const handleProfileUpdated = () => {
    showToast('Personal profile updated successfully.');
  };

  // Delete Handlers
  const openDeleteModal = (type, item) => {
    setDeleteModalState({
      isOpen: true,
      type,
      id: item._id,
      title: type === 'allergy' ? `Delete Allergy: ${item.allergenName}` : `Delete Test: ${item.allergenName} (${item.testType})`,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteModalState;
    setDeleteModalState((prev) => ({ ...prev, loading: true }));

    try {
      if (type === 'allergy') {
        await api.delete(`/allergies/${id}`);
        setAllergies((prev) => prev.filter((a) => a._id !== id));
        showToast('Food allergy record deleted from MongoDB Atlas.');
      } else if (type === 'test') {
        await api.delete(`/medical-tests/${id}`);
        setMedicalTests((prev) => prev.filter((t) => t._id !== id));
        showToast('Medical test record deleted from MongoDB Atlas.');
      }
      setDeleteModalState({ isOpen: false, type: null, id: null, title: '', loading: false });
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Failed to delete record.');
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Computed metrics
  const confirmedDiagnosesCount =
    allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis').length +
    medicalTests.filter((t) => t.isDoctorConfirmedDiagnosis).length;

  const severeRiskCount = allergies.filter((a) => a.severity.includes('Severe')).length;

  // Filtered Allergies
  const filteredAllergies = allergies.filter((a) => {
    const matchesSearch =
      a.allergenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.allergenCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.doctorName && a.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Filtered Medical Tests
  const filteredTests = medicalTests.filter((t) => {
    return (
      t.allergenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clinicOrLabName && t.clinicOrLabName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-sm font-medium shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: User Demographics & Actions */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-extrabold text-2xl text-teal-100 shadow-inner shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user?.name || 'Patient'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 border border-teal-300/30 text-teal-100 text-xs font-semibold">
                  Verified Patient Record
                </span>
              </div>

              {/* Quick Demographics Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-teal-100">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  DOB: {formatDate(user?.dob)} (<strong>Age: {user?.age ?? 'N/A'} yrs</strong>)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Sex: {user?.sex || 'N/A'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user?.address || 'Address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => {
                setEditingAllergy(null);
                setIsAllergyModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Add Food Allergy</span>
            </button>
            <button
              onClick={() => {
                setEditingTest(null);
                setIsTestModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span>Add Medical Test</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Allergies */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Food Allergies
            </p>
            <h3 className="text-2xl font-black text-slate-900">{allergies.length}</h3>
            <p className="text-[11px] text-teal-600 font-medium">Recorded in MongoDB</p>
          </div>
        </div>

        {/* Medical Tests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Medical Tests
            </p>
            <h3 className="text-2xl font-black text-slate-900">{medicalTests.length}</h3>
            <p className="text-[11px] text-cyan-600 font-medium">Lab & SPT Reports</p>
          </div>
        </div>

        {/* Confirmed Diagnoses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Doctor-Confirmed
            </p>
            <h3 className="text-2xl font-black text-slate-900">{confirmedDiagnosesCount}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">Physician Verified</p>
          </div>
        </div>

        {/* Severe Risks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Severe / Anaphylaxis
            </p>
            <h3 className="text-2xl font-black text-slate-900">{severeRiskCount}</h3>
            <p className="text-[11px] text-rose-600 font-medium">EpiPen Action Level</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('allergies')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'allergies'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Recorded Food Allergies ({allergies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'tests'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Medical Test Records ({medicalTests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Profile Panel</span>
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            title="Reload from MongoDB Atlas"
            className="self-end sm:self-auto p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Search & Filters (Shown on allergies and tests tabs) */}
        {activeTab !== 'profile' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search allergen, test type, lab or doctor..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {activeTab === 'allergies' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Severity:
                </span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe / Anaphylactic Risk">Severe / Anaphylactic</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Querying records from MongoDB Atlas...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: RECORDED FOOD ALLERGIES */}
          {activeTab === 'allergies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Patient Food Allergy Records
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documented food allergens, observed symptoms, and prescribed emergency plans
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAllergy(null);
                    setIsAllergyModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold hover:from-teal-700 hover:to-cyan-700 shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Allergy Details</span>
                </button>
              </div>

              {filteredAllergies.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      No Food Allergy Records Found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {searchTerm
                        ? 'No allergy matches your current search term. Try adjusting filters.'
                        : 'You haven\'t logged any food allergy entries yet. Add one from your doctor\'s prescription or history.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAllergy(null);
                      setIsAllergyModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log First Food Allergy</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredAllergies.map((allergy) => {
                    const isSevere = allergy.severity.includes('Severe');
                    return (
                      <div
                        key={allergy._id}
                        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative group"
                      >
                        {/* Top: Allergen & Badges */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                  {allergy.allergenName}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {allergy.allergenCategory}
                                </span>
                              </div>
                              <p className="text-xs text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {allergy.diagnosisType}
                              </p>
                            </div>

                            {/* Severity Pill */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                                isSevere
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : allergy.severity === 'Moderate'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {allergy.severity}
                            </span>
                          </div>

                          {/* Known Reactions */}
                          {allergy.knownReactions && allergy.knownReactions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Symptoms / Reactions:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {allergy.knownReactions.map((reaction, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                                  >
                                    {reaction}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reaction Notes */}
                          {allergy.reactionDescription && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                              <span className="font-semibold text-slate-800">Clinical Notes: </span>
                              {allergy.reactionDescription}
                            </div>
                          )}

                          {/* Emergency Medication & Doctor */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {allergy.emergencyMedication && (
                              <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-100 text-teal-900">
                                <span className="font-bold text-[11px] block uppercase text-teal-800">
                                  Emergency Rx:
                                </span>
                                {allergy.emergencyMedication}
                              </div>
                            )}

                            {allergy.doctorName && (
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                                <span className="font-bold text-[11px] block uppercase text-slate-500">
                                  Prescribing MD:
                                </span>
                                {allergy.doctorName}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Timestamps & Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400">
                            Saved: {formatDate(allergy.createdAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingAllergy(allergy);
                                setIsAllergyModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal('allergy', allergy)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDICAL TEST RECORDS */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Medical Test Reports & Lab Prescriptions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Skin Prick Tests (SPT), Specific IgE Blood Tests, Oral Food Challenges (OFC)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTest(null);
                    setIsTestModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-bold hover:from-cyan-700 hover:to-teal-700 shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medical Test</span>
                </button>
              </div>

              {/* Clinical distinction guidance box */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sky-950">Diagnostic Clinical Guardrail Active:</p>
                  <p className="mt-0.5 text-sky-800">
                    Sensitization detected in laboratory reports is preserved as recorded findings without automated algorithmic diagnosis.
                    Confirmed diagnoses are tagged explicitly when validated by a physician.
                  </p>
                </div>
              </div>

              {filteredTests.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      No Medical Test Records Found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {searchTerm
                        ? 'No lab tests match your search term.'
                        : 'Log your Skin Prick Test, Blood IgE, or Challenge test reports from your doctor or clinic.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTest(null);
                      setIsTestModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log First Medical Test</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredTests.map((test) => (
                    <div
                      key={test._id}
                      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Header: Allergen & Test Type */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                              {test.allergenName}
                            </h4>
                            <p className="text-xs font-bold text-cyan-700 mt-0.5">
                              {test.testType}
                            </p>
                          </div>

                          {/* Clinical Confirmation Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                              test.isDoctorConfirmedDiagnosis
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {test.isDoctorConfirmedDiagnosis
                              ? 'Doctor Confirmed'
                              : 'Test Report Only'}
                          </span>
                        </div>

                        {/* Test Result Highlight Card */}
                        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Reported Test Result:
                            </span>
                            <span className="text-lg font-black text-slate-900">
                              {test.testResult}
                            </span>
                            {test.units && (
                              <span className="text-xs text-slate-600 ml-1.5 font-medium">
                                {test.units}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Test Date:
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {formatDate(test.testDate)}
                            </span>
                          </div>
                        </div>

                        {/* Clinic / Lab */}
                        {test.clinicOrLabName && (
                          <p className="mt-2 text-xs text-slate-500">
                            <strong className="text-slate-700">Testing Facility: </strong>
                            {test.clinicOrLabName}
                          </p>
                        )}

                        {/* Doctor's Notes */}
                        {test.doctorNotes && (
                          <div className="mt-3 p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-teal-950">
                            <span className="font-bold text-teal-800 block mb-0.5">
                              Physician Notes & Interpretation:
                            </span>
                            {test.doctorNotes}
                          </div>
                        )}

                        {/* Documented Reactions */}
                        {test.recordedReactionDetails && (
                          <div className="mt-2 text-xs text-slate-600">
                            <strong className="text-slate-700">Observed Reactions: </strong>
                            {test.recordedReactionDetails}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Saved: {formatDate(test.createdAt)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTest(test);
                              setIsTestModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal('test', test)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Personal Profile & Demographics
                      </h3>
                      <p className="text-xs text-slate-500">
                        Synchronized with MongoDB Atlas User Document
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Full Name
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {user?.name || 'N/A'}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Email Address
                    </span>
                    <span className="text-base font-semibold text-slate-900">
                      {user?.email || 'N/A'}
                    </span>
                  </div>

                  {/* Date of Birth */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Date of Birth
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {formatDate(user?.dob)}
                    </span>
                  </div>

                  {/* Calculated Age */}
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                        Calculated Age
                      </span>
                      <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> Auto Computed
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-teal-950">
                      {user?.age !== undefined ? `${user.age} Years Old` : 'N/A'}
                    </span>
                  </div>

                  {/* Sex */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Sex / Biological Gender
                    </span>
                    <span className="text-base font-semibold text-slate-900">
                      {user?.sex || 'N/A'}
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Account Registered
                    </span>
                    <span className="text-base font-semibold text-slate-900">
                      {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Residential Address
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {user?.address || 'No address provided'}
                  </p>
                </div>

                {/* Food Allergy Summary */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    General Food Allergy History Summary
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {user?.foodAllergySummary ||
                      'No general allergy summary entered yet. Click Edit Profile to add your clinical notes.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        onSaved={handleAllergySaved}
        initialData={editingAllergy}
      />

      <MedicalTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSaved={handleTestSaved}
        initialData={editingTest}
      />

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdated={handleProfileUpdated}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({ isOpen: false, type: null, id: null, title: '', loading: false })
        }
        onConfirm={handleConfirmDelete}
        title={deleteModalState.title}
        loading={deleteModalState.loading}
      />
    </div>
  );
}
