import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Cleanly map browser pathname to an application view.
 * Handles trailing slashes, root URL, and unknown routes.
 */
function getPageFromPath(pathname) {
  if (!pathname) return 'home';
  // Strip trailing slashes and normalize
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '') return 'home';
  if (cleanPath === '/login') return 'login';
  if (cleanPath === '/register') return 'register';
  if (cleanPath === '/dashboard') return 'dashboard';
  return 'not_found';
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Initialize activePage synchronously from window.location.pathname to avoid render flickers
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      return getPageFromPath(window.location.pathname);
    }
    return 'home';
  });

  // Navigate function: updates active page and manages HTML5 History API
  const handlePageChange = useCallback(
    (newPage, options = {}) => {
      const { replace = false } = options;

      // Prevent redundant history entries if already on the requested page
      if (newPage === activePage && !replace) {
        return;
      }

      setActivePage(newPage);

      let targetPath = '/';
      if (newPage === 'login') targetPath = '/login';
      else if (newPage === 'register') targetPath = '/register';
      else if (newPage === 'dashboard') targetPath = '/dashboard';
      else if (newPage === 'not_found') targetPath = window.location.pathname;

      if (replace || window.location.pathname === targetPath) {
        window.history.replaceState({ page: newPage }, '', targetPath);
      } else {
        window.history.pushState({ page: newPage }, '', targetPath);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activePage]
  );

  // Listen to browser popstate (Back / Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setActivePage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle authenticated user on login/register pages: redirect to dashboard with replaceState
  useEffect(() => {
    if (!loading && isAuthenticated && (activePage === 'login' || activePage === 'register')) {
      handlePageChange('dashboard', { replace: true });
    }
  }, [isAuthenticated, activePage, loading, handlePageChange]);

  // Handle unauthenticated user accessing protected dashboard: redirect to login with replaceState
  useEffect(() => {
    if (!loading && !isAuthenticated && activePage === 'dashboard') {
      handlePageChange('login', { replace: true });
    }
  }, [isAuthenticated, activePage, loading, handlePageChange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing Food Allergy Detection System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar activePage={activePage} setActivePage={handlePageChange} />

      <main className="flex-1">
        {activePage === 'home' && <HomePage setActivePage={handlePageChange} />}
        {activePage === 'login' && <LoginPage setActivePage={handlePageChange} />}
        {activePage === 'register' && <RegisterPage setActivePage={handlePageChange} />}
        {activePage === 'dashboard' && isAuthenticated && <DashboardPage />}
        {activePage === 'not_found' && <NotFoundPage setActivePage={handlePageChange} />}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
