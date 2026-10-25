import React from 'react';
import { ShieldAlert, Database, Heart, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medical Advisory Banner */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Important Clinical & Safety Disclaimer:</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              This application is designed to securely store and organize personal medical test records and prescription data from certified physicians. 
              The system strictly distinguishes between recorded diagnostic test results and confirmed clinical diagnoses, and does not provide automated self-diagnosis. Always consult a qualified board-certified allergist or immunologist for formal medical decisions.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Food Allergy Detection System</span>
            <span>•</span>
            <span>Secured with bcrypt & JWT</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
              <Database className="w-3.5 h-3.5" /> MongoDB Atlas Cloud
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Patient Data Encrypted & Isolated
            </span>
            <span>•</span>
            <span>Final-Year Engineering Demonstration</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
