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
  login: (email: string, pass: string) => Promise<User>;
  initiateRegisterOtp: (fullName: string, email: string, pass: string, phone?: string) => Promise<string>;
  verifyRegisterOtp: (target: string, otpCode: string) => Promise<User>;
  resendRegisterOtp: (target: string) => Promise<boolean>;
  updateProfile: (fullName: string, phoneNumber?: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
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
          // Token invalid or expired
          logout();
        });
    }
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    // Clear any previous stale sessions before logging in
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

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
      return loggedUser;
    }
    throw new Error(res.data.message || 'Login failed.');
  };

  const initiateRegisterOtp = async (fullName: string, email: string, pass: string, phone?: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<{ target: string }>>('/auth/register-initiate', {
      fullName,
      email,
      password: pass,
      phoneNumber: phone || null,
    });
    if (res.data.success && res.data.data) {
      return res.data.data.target;
    }
    throw new Error(res.data.message || 'Failed to initiate OTP verification.');
  };

  const verifyRegisterOtp = async (target: string, otpCode: string): Promise<User> => {
    const res = await apiClient.post<ApiResponse<TokenResponse>>('/auth/verify-otp', {
      target,
      otpCode,
    });
    if (res.data.success && res.data.data) {
      const { accessToken, refreshToken, user: loggedUser } = res.data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    }
    throw new Error(res.data.message || 'Invalid or expired OTP code.');
  };

  const resendRegisterOtp = async (target: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>('/auth/resend-otp', { target });
    return res.data.success;
  };

  const updateProfile = async (fullName: string, phoneNumber?: string): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>('/auth/profile', {
      fullName,
      phoneNumber: phoneNumber || null,
    });
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      return res.data.data;
    }
    throw new Error(res.data.message || 'Failed to update profile.');
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (res.data.success) {
      return true;
    }
    throw new Error(res.data.message || 'Failed to change password.');
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
        isAuthenticated: !!user && !!token,
        isAdmin,
        isCashier,
        isManager,
        login,
        initiateRegisterOtp,
        verifyRegisterOtp,
        resendRegisterOtp,
        updateProfile,
        changePassword,
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
