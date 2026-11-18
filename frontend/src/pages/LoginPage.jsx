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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        {/* Header Banner */}
        <div className="px-8 py-7 bg-slate-900 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t('auth.loginTitle')}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <div className="mx-6 mt-6 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-600 shrink-0" />
            <span>{t('auth.sessionExpired')}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
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
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 text-sm bg-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 text-sm bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
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
            className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span>{t('auth.demoFill')}</span>
            </button>
          </div>

          {/* Link to Register */}
          <div className="text-center pt-2 text-xs text-slate-600">
            {t('auth.dontHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="font-bold text-slate-900 hover:underline ml-1 cursor-pointer"
            >
              {t('auth.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
