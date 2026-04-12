import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if user is logged in
  const checkAuth = async () => {
    const hasTokenCookie = !!Cookies.get('token');
    const isAuthLocal = localStorage.getItem('isAuthenticated') === 'true';

    if (hasTokenCookie || isAuthLocal) {
      try {
        const response = await axios.get('/api/user/getData');
        const userData = response.data.user || response.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      } catch (error) {
        // Clear if it's an auth failure
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (passedUserData = null) => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);

    // Efficiency: Use the data if we just got it from login/signup
    if (passedUserData) {
      const userData = passedUserData.user || passedUserData;
      setUser(userData);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/user/getData');
      const userData = response.data.user || response.data;
      setUser(userData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshUser: checkAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
