import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    // Check if we already have an active session from another tab
    const hasSessionToken = sessionStorage.getItem('base44_auth_checked') === 'true';
    const hasStoredToken = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
    
    if (hasSessionToken && hasStoredToken) {
      // Token exists from another tab, skip full check and go straight to user auth
      checkUserAuth();
    } else {
      // Full app state check
      checkAppState();
    }
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Load app public settings
      setAppPublicSettings({ id: appParams.appId });
      setIsLoadingPublicSettings(false);

      // Check user auth
      await checkUserAuth();
    } catch (error) {
      console.error('App state error:', error);
      setIsLoadingPublicSettings(false);
      setAuthError({ type: 'auth_required' });
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      // Persist auth state to localStorage for session persistence across tabs
      if (currentUser) {
        sessionStorage.setItem('base44_auth_checked', 'true');
      }
    } catch (error) {
      // Only redirect to login if not a callback/token issue
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('HTTPException')) {
        console.warn('Auth token invalid, clearing and redirecting to login');
        localStorage.removeItem('base44_access_token');
        sessionStorage.removeItem('base44_auth_checked');
      } else {
        console.warn('User auth check failed:', error?.message);
      }
      setIsLoadingAuth(false);
      setAuthError({ type: 'auth_required' });
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
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