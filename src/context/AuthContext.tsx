/* eslint-disable */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../utils';

interface User {
  id: string;
  email: string | null;
  nickname: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  requireAuthAction: (callback: () => void) => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const getAccessToken = () => localStorage.getItem('accessToken');

  const requireAuthAction = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        getAccessToken,
        requireAuthAction,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Helper for authenticated fetch
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const payload = refreshData.data || refreshData;
        const { accessToken, refreshToken: newRefresh } = payload;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        headers.set('Authorization', `Bearer ${accessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.reload();
      }
    } else {
      window.dispatchEvent(new Event('auth:required'));
    }
  }

  // If response is still 401 after everything, dispatch the event
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:required'));
  }

  return response;
};
