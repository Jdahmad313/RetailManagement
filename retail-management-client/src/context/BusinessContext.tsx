import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BusinessProfile, ApiResponse } from '../types';

interface BusinessContextType {
  profile: BusinessProfile | null;
  currencySymbol: string;
  formatPrice: (amount: number | null | undefined) => string;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  profile: null,
  currencySymbol: 'Rs.',
  formatPrice: (amount) => `Rs. ${(amount || 0).toFixed(2)}`,
  refreshProfile: async () => {},
  loading: false,
});

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(() => {
    try {
      const saved = localStorage.getItem('business_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings');
      if (res.data.success && res.data.data) {
        setProfile(res.data.data);
        localStorage.setItem('business_profile', JSON.stringify(res.data.data));
      }
    } catch (err) {
      // Fallback defaults gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const currencySymbol = profile?.currencySymbol || 'Rs.';

  const formatPrice = (amount: number | null | undefined): string => {
    const val = amount == null || isNaN(amount) ? 0 : amount;
    return `${currencySymbol} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <BusinessContext.Provider value={{ profile, currencySymbol, formatPrice, refreshProfile: fetchProfile, loading }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
