import React, { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle, Store } from 'lucide-react';
import { BusinessProfile, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const SettingsAdminPage: React.FC = () => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(8.5);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(5.0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(75.0);
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowDelivery, setAllowDelivery] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  useEffect(() => {
    apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings')
      .then((res) => {
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          setProfile(p);
          setBusinessName(p.businessName);
          setTagline(p.tagline || '');
          setAddress(p.address);
          setPhone(p.phone);
          setEmail(p.email);
          setCurrencyCode(p.currencyCode);
          setCurrencySymbol(p.currencySymbol);
          setDefaultTaxRate(p.defaultTaxRate);
          setInvoicePrefix(p.invoicePrefix);
          setReceiptHeader(p.receiptHeader || '');
          setReceiptFooter(p.receiptFooter || '');
          setDeliveryFee(p.deliveryFee);
          setFreeDeliveryThreshold(p.freeDeliveryThreshold);
          setAllowPickup(p.allowPickup);
          setAllowDelivery(p.allowDelivery);
          setAllowNegativeStock(p.allowNegativeStock);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      businessName: businessName.trim(),
      tagline: tagline.trim() || null,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      currencyCode: currencyCode.trim(),
      currencySymbol: currencySymbol.trim(),
      timeZone: 'UTC',
      defaultTaxRate,
      pricesIncludeTax: false,
      invoicePrefix: invoicePrefix.trim(),
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
      deliveryFee,
      freeDeliveryThreshold,
      allowPickup,
      allowDelivery,
      allowNegativeStock,
      operatingHoursJson: profile?.operatingHoursJson || '{}',
    };

    try {
      const res = await apiClient.put<ApiResponse<BusinessProfile>>('/businesssettings', payload);
      if (res.data.success) {
        setSuccessMsg('Business settings successfully updated and persisted to database!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading business configurations...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 840 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Business Settings & Retail Identity</h1>
        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Configure store branding, currency, tax rules, receipts, and order fulfillment policies</p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.875rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.875rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Store Profile */}
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={18} color="#2563eb" /> Store Identity
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tagline / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Physical Store Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax */}
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem' }}>Currency & Sales Tax</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Currency Code</label>
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                placeholder="USD"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Default Sales Tax (%)</label>
              <input
                type="number"
                step="0.01"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
          </div>
        </div>

        {/* Fulfillment & Inventory Rules */}
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem' }}>Fulfillment & Inventory Policies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Standard Delivery Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Free Delivery Threshold ($)</label>
              <input
                type="number"
                step="0.01"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <input type="checkbox" checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} />
              Enable Home Delivery
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <input type="checkbox" checked={allowPickup} onChange={(e) => setAllowPickup(e.target.checked)} />
              Enable Storefront Pickup
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <input type="checkbox" checked={allowNegativeStock} onChange={(e) => setAllowNegativeStock(e.target.checked)} />
              Allow Negative Stock (Overselling)
            </label>
          </div>
        </div>

        {/* Invoice & Receipt Customization */}
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem' }}>Invoice & Thermal Receipt Formatting</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Invoice Numbering Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV-"
              style={{ width: 140, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Receipt Header Message</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="Welcome to our store!"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Receipt Footer (Return Policy & Legal)</label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Returns accepted within 14 days with original receipt..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '0.875rem', justifyContent: 'center', fontSize: '1rem' }}
        >
          <Save size={18} /> {saving ? 'Persisting to Database...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
};
