import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('food_allergy_token');
      const storedUser = localStorage.getItem('food_allergy_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user profile from backend to ensure data sync
          const res = await api.get('/user/profile');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('food_allergy_user', JSON.stringify(res.data.user));
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
    const res = await api.post('/auth/register', userData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('food_allergy_token', newToken);
    localStorage.setItem('food_allergy_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
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
