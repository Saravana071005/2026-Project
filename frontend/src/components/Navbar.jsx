import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, LogOut, Activity, Database, FileText } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (setActivePage) setActivePage('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Food Allergy Detection System
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  <Database className="w-3 h-3 text-teal-600" />
                  MongoDB Atlas
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Patient Health Records & Clinical Allergy Portal
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setActivePage('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePage === 'dashboard'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  Dashboard
                </button>

                {/* User Info Capsule */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 leading-tight">
                      {user?.name || 'Patient'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Age: {user?.age ?? 'N/A'} • {user?.sex || ''}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out of your account"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('login')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePage === 'login'
                      ? 'bg-slate-100 text-teal-700 font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActivePage('register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm hover:from-teal-700 hover:to-cyan-700 transition-all hover:shadow"
                >
                  Register Account
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
