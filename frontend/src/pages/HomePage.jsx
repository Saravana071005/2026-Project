import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  FileCheck,
  Database,
  Lock,
  ArrowRight,
  HeartPulse,
  UserCheck,
  ShieldAlert,
  UploadCloud,
  Utensils,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import HealthInsightsView from '../components/HealthInsightsView';
import ProfileEditModal from '../components/ProfileEditModal';
import AllergyModal from '../components/AllergyModal';
import FoodEntryModal from '../components/FoodEntryModal';
import SymptomEntryModal from '../components/SymptomEntryModal';
import ReportUploadModal from '../components/ReportUploadModal';
import ReportReviewModal from '../components/ReportReviewModal';

export default function HomePage({ setActivePage }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, refreshProfile } = useAuth();

  // Summary statistics for logged-in profile dashboard
  const [stats, setStats] = useState({
    allergiesCount: 0,
    confirmedAllergies: [],
    testsCount: 0,
    latestTest: null,
    todayMealsCount: 0,
    recentSymptomsCount: 0,
    latestReport: null,
    loading: false,
  });

  // Modal controls
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReportForReview, setSelectedReportForReview] = useState(null);
  const [symptomModalPrefill, setSymptomModalPrefill] = useState(null);

  const loadUserStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, loading: true }));
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [allergiesRes, testsRes, foodRes, symptomsRes, reportsRes] = await Promise.allSettled([
        api.get('/allergies'),
        api.get('/medical-tests'),
        api.get('/food-diary', { params: { date: todayStr } }),
        api.get('/symptoms'),
        api.get('/medical-reports'),
      ]);

      const allergies = allergiesRes.status === 'fulfilled' ? allergiesRes.value.data?.data || [] : [];
      const tests = testsRes.status === 'fulfilled' ? testsRes.value.data?.data || [] : [];
      const foods = foodRes.status === 'fulfilled' ? foodRes.value.data?.data || [] : [];
      const symptoms = symptomsRes.status === 'fulfilled' ? symptomsRes.value.data?.data || [] : [];
      const reports = reportsRes.status === 'fulfilled' ? reportsRes.value.data?.data || [] : [];

      const confirmed = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');

      setStats({
        allergiesCount: allergies.length,
        confirmedAllergies: confirmed,
        testsCount: tests.length,
        latestTest: tests.length > 0 ? tests[0] : null,
        todayMealsCount: foods.length,
        recentSymptomsCount: symptoms.length,
        latestReport: reports.length > 0 ? reports[0] : null,
        rawAllergies: allergies,
        rawTests: tests,
        rawFoods: foods,
        rawSymptoms: symptoms,
        loading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch summary data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated, loadUserStats]);

  // Navigate to Dashboard tab
  const navigateToDashboardTab = (tabName) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('food_allergy_active_tab', tabName);
    }
    if (setActivePage) {
      setActivePage('dashboard');
    }
  };

  // Calculate profile completion score
  const completionScore = (() => {
    if (!user) return 0;
    let score = 30; // Account created
    if (user.dob && user.age) score += 20;
    if (user.address && user.address.length > 5) score += 15;
    if (stats.allergiesCount > 0) score += 15;
    if (stats.testsCount > 0 || stats.latestReport) score += 10;
    if (stats.todayMealsCount > 0 || stats.recentSymptomsCount > 0) score += 10;
    return Math.min(score, 100);
  })();

  // ---------------------------------------------------------------------------
  // AUTHENTICATED PATIENT WORKSPACE VIEW (Minimal White & Deep Navy Blue)
  // ---------------------------------------------------------------------------
  if (isAuthenticated) {
    return (
      <div className="space-y-8 py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section & Patient Overview */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* User Demographic Vitals */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center shadow-xs" title="Verified Active Account">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'Patient'}!
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                    Patient Portal
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your health journey starts here. Real-time food allergy detection, daily diet diary & medical OCR reports.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span><strong>Age:</strong> {user?.age ?? 'N/A'} yrs</span>
                  <span>•</span>
                  <span><strong>Sex:</strong> {user?.sex || 'Unspecified'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[200px]">{user?.address || 'Address on file'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion Card & Quick Edit */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
              <div className="space-y-1.5 min-w-[180px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Profile Completion</span>
                  <span className="font-extrabold text-teal-700">{completionScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${completionScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {completionScore === 100
                    ? 'All demographic & allergy records verified'
                    : 'Complete medical tests & food logs for 100%'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
            {/* Metric 1: Confirmed Allergies */}
            <div
              onClick={() => navigateToDashboardTab('allergies')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Confirmed Allergies</span>
                <ShieldAlert className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {stats.confirmedAllergies.length}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {stats.confirmedAllergies.length > 0
                  ? stats.confirmedAllergies.map((a) => a.allergenName).join(', ')
                  : 'No confirmed allergies'}
              </p>
            </div>

            {/* Metric 2: Medical Tests */}
            <div
              onClick={() => navigateToDashboardTab('tests')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Diagnostic Tests</span>
                <FileCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {stats.testsCount}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {stats.latestTest
                  ? `${stats.latestTest.allergenName} (${stats.latestTest.testType})`
                  : 'No lab reports recorded'}
              </p>
            </div>

            {/* Metric 3: Today's Meals */}
            <div
              onClick={() => navigateToDashboardTab('diary')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Today's Meals</span>
                <Utensils className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {stats.todayMealsCount}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {stats.todayMealsCount > 0 ? 'Actively logging meals' : 'No meals logged today yet'}
              </p>
            </div>

            {/* Metric 4: Recent Symptoms */}
            <div
              onClick={() => navigateToDashboardTab('symptoms')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Reported Reactions</span>
                <HeartPulse className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {stats.recentSymptomsCount}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {stats.recentSymptomsCount > 0 ? 'Symptom tracker active' : 'Zero reactions logged'}
              </p>
            </div>
          </div>
        </section>

        {/* 8 Core Features Grid - Reorganized Homepage */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Health Center Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Quick access to all 8 core clinical features and patient management tools
              </p>
            </div>
            <button
              onClick={() => setActivePage('dashboard')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              <span>Open Full Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: User Profile */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  Profile
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  1. User Profile
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Update demographics, date of birth, emergency contact, and language preference.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Edit Profile</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Food Allergy Records */}
            <div
              onClick={() => navigateToDashboardTab('allergies')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  {stats.allergiesCount} Records
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  2. Food Allergy Records
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Document confirmed and suspected food allergens, severity levels, and doctor notes.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>View Allergies</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Medical Test Reports */}
            <div
              onClick={() => navigateToDashboardTab('tests')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  Diagnostic
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  3. Medical Test Reports
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review Skin Prick Tests (SPT), Specific IgE antibody levels, and lab parameters.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Inspect Tests</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: OCR Report Upload */}
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  OCR Scanner
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  4. OCR Report Upload
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload PDF or laboratory image reports for deterministic OCR extraction and verification.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Upload & Extract</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Daily Food Diary */}
            <div
              onClick={() => navigateToDashboardTab('diary')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  {stats.todayMealsCount} Today
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  5. Daily Food Diary
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log daily meals, recipes, and ingredients with real-time pre-check allergen warnings.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Log Meals</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: Symptom Tracker */}
            <div
              onClick={() => navigateToDashboardTab('symptoms')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  Reactions
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  6. Symptom Tracker
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Record hives, oral tingling, or digestive symptoms linked to specific meals.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Track Symptoms</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 7: My Health Insights */}
            <div
              onClick={() => navigateToDashboardTab('analysis')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  Insights
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  7. My Health Insights
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deterministic allergen cross-matching, missing information audits & statistical recurrence.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>View Insights</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 8: Medical History */}
            <div
              onClick={() => navigateToDashboardTab('history')}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 cursor-pointer group flex flex-col justify-between h-48 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                  Timeline
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  8. Medical History
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover repeated food-symptom pairs and review chronological medical reaction history.
                </p>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                <span>Explore Patterns</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* My Health Insights Section on Homepage */}
        <section id="homepage-health-insights" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <HealthInsightsView
            user={user}
            allergies={stats.rawAllergies || []}
            medicalTests={stats.rawTests || []}
            foodEntries={stats.rawFoods || []}
            symptoms={stats.rawSymptoms || []}
            onRefresh={loadUserStats}
            onNavigateTab={navigateToDashboardTab}
          />
        </section>

        {/* Modals Mounted for Direct Action */}
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdated={() => {
            if (refreshProfile) refreshProfile();
            loadUserStats();
          }}
        />

        <AllergyModal
          isOpen={isAllergyModalOpen}
          onClose={() => setIsAllergyModalOpen(false)}
          onSaved={() => loadUserStats()}
        />

        <FoodEntryModal
          isOpen={isFoodModalOpen}
          onClose={() => setIsFoodModalOpen(false)}
          onSaved={() => loadUserStats()}
        />

        <SymptomEntryModal
          isOpen={isSymptomModalOpen}
          onClose={() => {
            setIsSymptomModalOpen(false);
            setSymptomModalPrefill(null);
          }}
          initialData={symptomModalPrefill}
          onSaved={() => loadUserStats()}
        />

        <ReportUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={(report) => {
            setSelectedReportForReview(report);
            setIsReviewModalOpen(true);
            loadUserStats();
          }}
        />

        {selectedReportForReview && (
          <ReportReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedReportForReview(null);
            }}
            report={selectedReportForReview}
            onSavedTests={() => loadUserStats()}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PUBLIC / VISITOR LANDING VIEW (Pleasant Teal-Green & Clean White)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-white pt-12 pb-16 md:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('home.heroPill')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t('common.appName')}
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {t('home.heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setActivePage('register')}
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('home.registerNewAccount')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePage('login')}
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold bg-white text-teal-800 border border-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('home.patientLogin')}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-4 h-4 text-teal-600" />
                MongoDB Atlas Cloud
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-teal-600" />
                Bcrypt Hashed & JWT Secured
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Intelligent OCR & Clinical ML Engine
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Steps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('home.howItWorks')}
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center mb-4 text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('home.step1Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('home.step1Desc')}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center mb-4 text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('home.step2Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('home.step2Desc')}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center mb-4 text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('home.step3Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('home.step3Desc')}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center mb-4 text-sm">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('home.step4Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('home.step4Desc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
