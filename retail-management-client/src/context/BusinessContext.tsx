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

export const defaultBusinessProfile: BusinessProfile = {
  id: 'mukhtar-bashir-default',
  businessName: 'Mukhtar Bashir Merchant Karyana Store',
  tagline: 'Taza Karyana, Bulk Flours, Nimko & Village General Store',
  address: 'Jurian, Hafizabad, Punjab, Pakistan',
  phone: '+923446583468',
  email: 'mukhtarbashirkaryana@gmail.com',
  currencyCode: 'PKR',
  currencySymbol: 'Rs.',
  timeZone: 'Asia/Karachi',
  defaultTaxRate: 0,
  pricesIncludeTax: true,
  invoicePrefix: 'MBK-',
  receiptHeader: 'Mukhtar Bashir Merchant Karyana Store - Jurian, Hafizabad',
  receiptFooter: 'Shukriya! Mukhtar Bashir Merchant Karyana par tashreef awri ka bohot shukriya. Phone: 03446583468',
  deliveryFee: 0,
  freeDeliveryThreshold: 1000,
  allowPickup: true,
  allowDelivery: true,
  allowNegativeStock: false,
  whatsAppNumber: '03446583468',
  bankTransferInstructions: 'Easypaisa or Raast at 03446583468 and share the screenshot on same number (03446583468)',
  enabledPaymentMethodsJson: '["CashOnDelivery","BankTransfer"]',
  operatingHoursJson: '{"Monday-Sunday":"8:00 AM - 10:00 PM"}',
};

const BusinessContext = createContext<BusinessContextType>({
  profile: defaultBusinessProfile,
  currencySymbol: 'Rs.',
  formatPrice: (amount) => `Rs. ${(amount || 0).toFixed(2)}`,
  refreshProfile: async () => {},
  loading: false,
});

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem('business_profile');
      return saved ? { ...defaultBusinessProfile, ...JSON.parse(saved) } : defaultBusinessProfile;
    } catch {
      return defaultBusinessProfile;
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
