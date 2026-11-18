import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('food_allergy_language')) || 'en';
  });
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('food_allergy_tutorial_completed') === 'true';
  });

  // Change language and persist to localStorage and backend
  const changeLanguage = useCallback(async (newLang) => {
    if (!['en', 'hi', 'ta'].includes(newLang)) return;
    setLanguageState(newLang);
    localStorage.setItem('food_allergy_language', newLang);
    await i18n.changeLanguage(newLang);

    // If authenticated, persist to user profile preferences
    const storedToken = localStorage.getItem('food_allergy_token');
    if (storedToken) {
      try {
        await api.put('/user/preferences', { preferredLanguage: newLang });
        setUser((prev) => (prev ? { ...prev, preferredLanguage: newLang } : prev));
      } catch (err) {
        console.warn('Could not sync preferred language to server:', err.message);
      }
    }
  }, []);

  // Complete tutorial and persist
  const completeTutorial = useCallback(async () => {
    setTutorialCompleted(true);
    localStorage.setItem('food_allergy_tutorial_completed', 'true');
    const storedToken = localStorage.getItem('food_allergy_token');
    if (storedToken) {
      try {
        await api.put('/user/preferences', { hasCompletedTutorial: true });
        setUser((prev) => (prev ? { ...prev, hasCompletedTutorial: true } : prev));
      } catch (err) {
        console.warn('Could not sync tutorial completion to server:', err.message);
      }
    }
  }, []);

  // Restart tutorial
  const restartTutorial = useCallback(async () => {
    setTutorialCompleted(false);
    localStorage.removeItem('food_allergy_tutorial_completed');
    const storedToken = localStorage.getItem('food_allergy_token');
    if (storedToken) {
      try {
        await api.put('/user/preferences', { hasCompletedTutorial: false });
        setUser((prev) => (prev ? { ...prev, hasCompletedTutorial: false } : prev));
      } catch (err) {
        console.warn('Could not sync restart tutorial to server:', err.message);
      }
    }
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('food_allergy_token');
      const storedUser = localStorage.getItem('food_allergy_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          if (parsedUser.preferredLanguage) {
            setLanguageState(parsedUser.preferredLanguage);
            i18n.changeLanguage(parsedUser.preferredLanguage);
            localStorage.setItem('food_allergy_language', parsedUser.preferredLanguage);
          }
          if (parsedUser.hasCompletedTutorial) {
            setTutorialCompleted(true);
            localStorage.setItem('food_allergy_tutorial_completed', 'true');
          }

          // Refresh user profile from backend to ensure data sync
          const res = await api.get('/user/profile');
          if (res.data && res.data.user) {
            const freshUser = res.data.user;
            setUser(freshUser);
            localStorage.setItem('food_allergy_user', JSON.stringify(freshUser));
            if (freshUser.preferredLanguage) {
              setLanguageState(freshUser.preferredLanguage);
              i18n.changeLanguage(freshUser.preferredLanguage);
              localStorage.setItem('food_allergy_language', freshUser.preferredLanguage);
            }
            if (freshUser.hasCompletedTutorial) {
              setTutorialCompleted(true);
              localStorage.setItem('food_allergy_tutorial_completed', 'true');
            }
          }
        } catch (err) {
          console.warn('Could not sync user profile from server:', err.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    const currentLang = localStorage.getItem('food_allergy_language') || 'en';
    const res = await api.post('/auth/register', { ...userData, preferredLanguage: currentLang });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('food_allergy_token', newToken);
    localStorage.setItem('food_allergy_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (newUser.preferredLanguage) {
      changeLanguage(newUser.preferredLanguage);
    }
    return res.data;
  };

  // Login function
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('food_allergy_token', newToken);
    localStorage.setItem('food_allergy_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (newUser.preferredLanguage) {
      changeLanguage(newUser.preferredLanguage);
    }
    if (newUser.hasCompletedTutorial) {
      setTutorialCompleted(true);
      localStorage.setItem('food_allergy_tutorial_completed', 'true');
    }
    return res.data;
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Proceed with client logout even if server endpoint fails
      console.warn('Logout server notification failed:', err.message);
    } finally {
      localStorage.removeItem('food_allergy_token');
      localStorage.removeItem('food_allergy_user');
      setToken(null);
      setUser(null);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    const res = await api.put('/user/profile', profileData);
    const updatedUser = res.data.user;
    localStorage.setItem('food_allergy_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        language,
        changeLanguage,
        hasCompletedTutorial: tutorialCompleted,
        completeTutorial,
        restartTutorial,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
