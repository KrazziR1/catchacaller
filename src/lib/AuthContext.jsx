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
    // Check if we have a persistent user session from localStorage (survives browser close)
    const cachedUser = localStorage.getItem('base44_user_cached');
    const cachedTimestamp = localStorage.getItem('base44_user_cache_time');
    const hasStoredToken = localStorage.getItem('base44_access_token') || localStorage.getItem('token');

    // If cached user is recent (within 24 hours) and token exists, use cached user
    if (cachedUser && hasStoredToken && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp);
      if (cacheAge < 24 * 3600 * 1000) { // 24 hour cache
        try {
          const user = JSON.parse(cachedUser);
          setUser(user);
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          // Verify token is still valid in background (non-blocking)
          checkUserAuth().catch(() => {
            // If background check fails, clear cache and require re-login
            localStorage.removeItem('base44_user_cached');
            localStorage.removeItem('base44_user_cache_time');
            setUser(null);
            setIsAuthenticated(false);
          });
          return;
        } catch (e) {
          localStorage.removeItem('base44_user_cached');
        }
      }
    }

    // No valid cache, do full auth check
    checkAppState();

    // Safety timeout: if auth check takes >8s, force completion
    const safetyTimer = setTimeout(() => {
      if (!authChecked) {
        console.warn('Auth check timeout - forcing completion');
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        setAuthChecked(true);
      }
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, [authChecked]);

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
    setIsLoadingAuth(true);
    try {
      const currentUser = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        )
      ]);
      setUser(currentUser);
      setIsAuthenticated(true);
      localStorage.setItem('base44_user_cached', JSON.stringify(currentUser));
      localStorage.setItem('base44_user_cache_time', Date.now().toString());
    } catch (error) {
      console.warn('User auth check failed:', error?.message);
      localStorage.removeItem('base44_user_cached');
      localStorage.removeItem('base44_user_cache_time');
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('base44_user_cached');
    localStorage.removeItem('base44_user_cache_time');
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout("/");
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = (nextUrl = "/dashboard") => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(nextUrl);
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