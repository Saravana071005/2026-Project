import React from 'react';
import { FileQuestion, Home, Activity, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage({ setActivePage }) {
  const { isAuthenticated } = useAuth();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Visual Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-10 h-10" />
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            HTTP 404 &bull; Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Resource Unavailable
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            The requested frontend route <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-[11px]">{currentPath || 'specified'}</code> does not exist in the Food Allergy Detection System.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActivePage('home')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePage('login')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Patient Login</span>
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          Food Allergy Detection System &bull; Secure Clinical Records Portal
        </div>
      </div>
    </div>
  );
}
