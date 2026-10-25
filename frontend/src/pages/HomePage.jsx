import React from 'react';
import {
  ShieldCheck,
  Activity,
  FileCheck,
  Database,
  Lock,
  ArrowRight,
  ClipboardList,
  Sparkles,
  HeartPulse,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage({ setActivePage }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:py-20 bg-gradient-to-b from-teal-50/60 via-sky-50/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Doctor Prescriptions & Medical Lab Reports Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Food Allergy{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Detection System
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              A comprehensive clinical health portal designed for patients to securely log personal details, 
              medical test reports, and doctor prescriptions. Backed by encrypted cloud storage in MongoDB Atlas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-5 h-5" />
                  <span>Go to My Health Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setActivePage('register')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Register New Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivePage('login')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
                  >
                    Patient Login
                  </button>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-4 h-4 text-teal-600" />
                MongoDB Atlas Cloud Database
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-cyan-600" />
                Bcrypt Hashed & JWT Secured
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Strict User Data Isolation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Steps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How The System Works
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Simple 4-step workflow designed for patients, clinical researchers, and college project evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Account Creation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Register with your full name, DOB, address, and sex. Your age is automatically calculated from your birth date.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Prescription Details</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log doctor prescriptions, allergen names, emergency auto-injectors (e.g. EpiPen), and documented reactions.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Medical Lab Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input Skin Prick Tests (mm wheal) and Blood IgE results (kUA/L) directly from clinical lab reports.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mb-4">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Atlas Cloud Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All records are validated and securely saved in MongoDB Atlas. Access, update, or delete your data anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Automatic Age Calculation</h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Calculates exact chronological age dynamically from your Date of Birth on both client and server sides.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Clinical Distinction Rule</h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Strictly avoids automated diagnostic assumptions. Distinguishes raw lab sensitization tests from doctor-confirmed clinical diagnoses.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Full Patient CRUD Control</h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Easily add, view, update, and delete allergy and medical test records. Zero unauthorized access across patient accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
