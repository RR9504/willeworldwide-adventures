import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ww-admin-auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const login = (password: string): boolean => {
    const correct = import.meta.env.VITE_ADMIN_PASSWORD;
    if (password === correct) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
