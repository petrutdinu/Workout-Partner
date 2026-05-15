import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initKeycloak, getUserInfo, login, logout, isAuthenticated } from '../keycloak';
import { userApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = await initKeycloak();
        if (authenticated) {
          const userInfo = getUserInfo();
          setUser(userInfo);
          try {
            await userApi.syncUser();
          } catch (error) {
            console.error('Failed to sync user:', error);
          }
        }
        setInitialized(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = useCallback(() => login(), []);
  const handleLogout = useCallback(() => { logout(); setUser(null); }, []);

  const value = {
    user,
    loading,
    initialized,
    isAuthenticated: isAuthenticated(),
    isAdmin: user?.isAdmin || false,
    isTrainer: user?.isTrainer || false,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
