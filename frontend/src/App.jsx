import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    // Check initial pathname or query
    const path = window.location.pathname;
    if (path === '/login') setActivePage('login');
    else if (path === '/register') setActivePage('register');
    else if (path === '/dashboard') setActivePage('dashboard');
    else setActivePage('home');
  }, []);

  // Update browser history title and path
  const handlePageChange = (newPage) => {
    setActivePage(newPage);
    const newPath = newPage === 'home' ? '/' : `/${newPage}`;
    window.history.pushState(null, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login') setActivePage('login');
      else if (path === '/register') setActivePage('register');
      else if (path === '/dashboard') setActivePage('dashboard');
      else setActivePage('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If user becomes authenticated and is on login/register, transition to dashboard
  useEffect(() => {
    if (isAuthenticated && (activePage === 'login' || activePage === 'register')) {
      setActivePage('dashboard');
      window.history.pushState(null, '', '/dashboard');
    }
  }, [isAuthenticated, activePage]);

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
        {activePage === 'dashboard' && (
          isAuthenticated ? (
            <DashboardPage />
          ) : (
            <LoginPage setActivePage={handlePageChange} />
          )
        )}
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
