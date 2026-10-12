import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, TokenResponse, ApiResponse } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  isManager: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) {
      apiClient.get<ApiResponse<User>>('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          // Token invalid
        });
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await apiClient.post<ApiResponse<TokenResponse>>('/auth/login', {
      email,
      password: pass,
    });
    if (res.data.success && res.data.data) {
      const { accessToken, refreshToken, user: loggedUser } = res.data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(accessToken);
      setUser(loggedUser);
    }
  };

  const register = async (fullName: string, email: string, pass: string) => {
    const res = await apiClient.post<ApiResponse<TokenResponse>>('/auth/register', {
      fullName,
      email,
      password: pass,
      role: 'Customer',
    });
    if (res.data.success && res.data.data) {
      const { accessToken, refreshToken, user: loggedUser } = res.data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(accessToken);
      setUser(loggedUser);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Continue cleanup
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const roles = user?.roles || [];
  const isAdmin = roles.includes('Admin');
  const isManager = roles.includes('Manager') || isAdmin;
  const isCashier = roles.includes('Cashier') || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isCashier,
        isManager,
        login,
        register,
        logout,
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
