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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  {t('common.appName')}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  <Database className="w-3 h-3 text-slate-700" />
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
            <div className="flex items-center rounded-lg bg-slate-50 p-1 border border-slate-200 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1 hidden sm:inline" />
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded transition-all ${
                  language === 'en'
                    ? 'bg-slate-900 text-white font-bold'
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
                className={`px-2 py-1 rounded transition-all ${
                  language === 'hi'
                    ? 'bg-slate-900 text-white font-bold'
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
                className={`px-2 py-1 rounded transition-all ${
                  language === 'ta'
                    ? 'bg-slate-900 text-white font-bold'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'home'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      activePage === 'dashboard'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>{t('nav.dashboard')}</span>
                  </button>

                  {/* User Info Capsule */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      activePage === 'login'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => setActivePage('register')}
                    className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
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
