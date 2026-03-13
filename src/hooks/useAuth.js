import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const data = await authService.getUserData(currentUser.uid);
          setUserData(data);
        } else {
          setUserData(null);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = useCallback(async (email, password, userData) => {
    setLoading(true);
    try {
      const user = await authService.signup(email, password, userData);
      return user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      return user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setUserData(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    userData,
    loading,
    error,
    signup,
    login,
    logout,
  };
};
