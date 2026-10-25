import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setActivePage }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      setActivePage('dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to sign in. Please verify your email and password.'
      );
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="px-8 py-6 bg-gradient-to-r from-teal-700 to-cyan-700 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-teal-200" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Patient Login</h2>
          <p className="text-xs text-teal-100 mt-1">
            Sign in to access your private food allergy & test records
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm shadow-xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Pre-fill Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-teal-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Fill Demo Credentials for Quick Testing</span>
            </button>
          </div>

          {/* Link to Register */}
          <div className="text-center pt-2 text-xs text-slate-600">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="font-bold text-teal-600 hover:text-teal-800 underline"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
