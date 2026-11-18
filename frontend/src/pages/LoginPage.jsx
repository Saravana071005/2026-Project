import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setActivePage }) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect session expired notification from URL search params
  const [sessionExpiredNotice] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sessionExpired') === 'true';
    }
    return false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('auth.email') + ' & ' + t('auth.password') + ' ' + t('common.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      setActivePage('dashboard');
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError(
          'Cannot connect to backend server. Please verify your network connection or ensure the backend service on Render is active.'
        );
      } else {
        setError('Failed to sign in. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to fill in demo credentials for quick inspection / examiner grading
  const handleUseDemo = () => {
    setEmail('demo.patient@health.org');
    setPassword('DemoPatient2026!');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all">
        {/* Header Banner */}
        <div className="px-8 py-7 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <ShieldCheck className="w-8 h-8 text-teal-100" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t('auth.loginTitle')}</h2>
          <p className="text-xs text-teal-100 mt-1 max-w-xs mx-auto">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <div className="mx-6 mt-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('auth.sessionExpired')}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.email')}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs transition-all bg-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password')}
                className="w-full pl-9 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-2xs transition-all bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>{t('auth.authenticating')}</span>
            ) : (
              <>
                <span>{t('auth.signIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Pre-fill Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-teal-200/80"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('auth.demoFill')}</span>
            </button>
          </div>

          {/* Link to Register */}
          <div className="text-center pt-2 text-xs text-slate-600">
            {t('auth.dontHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="font-bold text-teal-600 hover:text-teal-800 underline ml-1 cursor-pointer"
            >
              {t('auth.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
