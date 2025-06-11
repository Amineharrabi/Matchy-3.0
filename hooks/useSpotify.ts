import { useEffect, useState, useCallback, useRef } from 'react';
import { SpotifyAuth } from '../services/spotifyAuth';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyUser } from '../types/spotify';

export function useSpotify() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const authInstance = useRef(SpotifyAuth.getInstance());
  const initializationAttempted = useRef(false);

  // Remove useCallback and make it a regular function
  // or move the logic directly into useEffect
  useEffect(() => {
    const initializeAuth = async () => {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        await authInstance.current.init();
        const token = await authInstance.current.getAccessToken();
        const isAuthenticated = token !== null;
        setIsLoggedIn(isAuthenticated);

        if (isAuthenticated) {
          const userData = await spotifyApi.getCurrentUser();
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - only run once

  const login = useCallback(async () => {
    try {
      const success = await authInstance.current.login();
      if (success) {
        const userData = await spotifyApi.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsLoggedIn(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // First set the states to null/false
      setUser(null);
      setIsLoggedIn(false);
      // Then clear the auth data
      await authInstance.current.logout();
      // Reset initialization flag
      initializationAttempted.current = false;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, []);

  return {
    isLoggedIn,
    isLoading,
    user,
    login,
    logout
  };
}