import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Activity, Database, Globe, Home } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, language, changeLanguage } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (setActivePage) setActivePage('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-2xl border-b border-white/60 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  {t('common.appName')}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50/80 text-purple-700 border border-purple-200/60 shadow-2xs">
                  <Database className="w-3 h-3 text-purple-600" />
                  MongoDB Atlas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {t('common.appTagline')}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Multilingual Selector: EN | हिंदी | தமிழ் */}
            <div className="flex items-center rounded-xl bg-white/80 p-1 border border-slate-200/80 text-xs font-semibold backdrop-blur shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1 hidden sm:inline" />
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="English"
              >
                EN
              </button>
              <span className="text-slate-300 text-[10px]">•</span>
              <button
                type="button"
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिन्दी (Hindi)"
              >
                हिंदी
              </button>
              <span className="text-slate-300 text-[10px]">•</span>
              <button
                type="button"
                onClick={() => changeLanguage('ta')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'ta'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="தமிழ் (Tamil)"
              >
                தமிழ்
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex items-center gap-2 sm:gap-2.5">
              {/* Home Link */}
              <button
                onClick={() => setActivePage('home')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'home'
                    ? 'bg-purple-50 text-purple-700 shadow-2xs border border-purple-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Home className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Home</span>
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activePage === 'dashboard'
                        ? 'bg-purple-50 text-purple-700 shadow-2xs border border-purple-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>{t('nav.dashboard')}</span>
                  </button>

                  {/* User Info Capsule */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {user?.name || 'Patient'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t('common.age')}: {user?.age ?? 'N/A'} • {user?.sex || ''}
                      </p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePage('login')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      activePage === 'login'
                        ? 'bg-slate-100 text-purple-700'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => setActivePage('register')}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold btn-liquid-purple shadow-xs"
                  >
                    {t('nav.register')}
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
