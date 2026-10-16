import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, Store, AlertCircle, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Order, ApiResponse } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { items, subTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState<number>(0); // 0 = Delivery, 1 = Pickup
  const [paymentMethod, setPaymentMethod] = useState<number>(1); // 1 = Card, 2 = Bank, 3 = CashOnDelivery

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.fullName) setCustomerName(user.fullName);
      if (user.email) setCustomerEmail(user.email);
      if (user.phoneNumber) setCustomerPhone(user.phoneNumber);
    }
  }, [user]);

  useEffect(() => {
    apiClient.get<ApiResponse<any>>('/businesssettings')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setProfile(res.data.data);
          try {
            const enabled = JSON.parse(res.data.data.enabledPaymentMethodsJson || '[]');
            if (enabled.includes('Card')) setPaymentMethod(1);
            else if (enabled.includes('CashOnDelivery')) setPaymentMethod(3);
            else if (enabled.includes('BankTransfer')) setPaymentMethod(2);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Lock size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Sign In to Complete Order
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            You need to be signed in to your customer account to place orders. This ensures secure order dispatch, tracking, and invoices.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login?redirect=/checkout" className="btn btn-primary" style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '0.9375rem' }}>
              Sign In to Proceed →
            </Link>
            <Link to="/register?redirect=/checkout" className="btn btn-secondary" style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '0.9375rem' }}>
              Create New Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    if (fulfillmentType === 0 && (!street.trim() || !city.trim() || !postalCode.trim())) {
      setError('Please fill in complete delivery address details.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        fulfillmentType,
        shippingAddress:
          fulfillmentType === 0
            ? {
                recipientName: customerName,
                street,
                city,
                state,
                postalCode,
                country: 'USA',
              }
            : null,
        paymentMethod,
        notes,
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id,
          quantity: i.quantity,
        })),
      };

      const res = await apiClient.post<ApiResponse<Order>>('/orders', payload);

      if (res.data.success && res.data.data) {
        clearCart();
        navigate(`/order-confirmation/${res.data.data.orderNumber}`);
      } else {
        setError(res.data.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'An error occurred while communicating with the checkout API. Please verify item stock.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = profile?.currencySymbol || 'Rs.';
  const freeThreshold = profile?.freeDeliveryThreshold ?? 3000;
  const standardDelivery = profile?.deliveryFee ?? 200;
  const taxRate = profile?.defaultTaxRate ?? 5;

  const deliveryFee = fulfillmentType === 0 ? (subTotal >= freeThreshold ? 0 : standardDelivery) : 0;
  const estimatedTax = subTotal * (taxRate / 100);
  const grandTotal = subTotal + estimatedTax + deliveryFee;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>Secure Checkout</h1>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="checkout-form-grid" style={{ gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer Information */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>1. Customer Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          {/* Fulfillment Method */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>2. Fulfillment Method</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                onClick={() => setFulfillmentType(0)}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${fulfillmentType === 0 ? '#2563eb' : '#e2e8f0'}`,
                  backgroundColor: fulfillmentType === 0 ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Truck size={20} color={fulfillmentType === 0 ? '#2563eb' : '#64748b'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Doorstep Delivery</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Delivered to your address</div>
                </div>
              </div>

              <div
                onClick={() => setFulfillmentType(1)}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${fulfillmentType === 1 ? '#2563eb' : '#e2e8f0'}`,
                  backgroundColor: fulfillmentType === 1 ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Store size={20} color={fulfillmentType === 1 ? '#2563eb' : '#64748b'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Storefront Pickup</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ready in 2 hours at store</div>
                </div>
              </div>
            </div>

            {fulfillmentType === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main St, Apt 4B"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Zip Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>3. Payment Option</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {(!profile || profile?.enabledPaymentMethodsJson?.includes('Card')) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 1}
                    onChange={() => setPaymentMethod(1)}
                  />
                  <CreditCard size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Credit / Debit Card (Integrated Gateway)</span>
                </label>
              )}

              {(!profile || profile?.enabledPaymentMethodsJson?.includes('CashOnDelivery')) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 3}
                    onChange={() => setPaymentMethod(3)}
                  />
                  <Truck size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cash on Delivery (COD)</span>
                </label>
              )}

              {(!profile || profile?.enabledPaymentMethodsJson?.includes('BankTransfer')) && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 2}
                      onChange={() => setPaymentMethod(2)}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Direct Bank Transfer / Wire</span>
                  </label>
                  {paymentMethod === 2 && profile?.bankTransferInstructions && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem', border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#1e40af' }}>
                      <strong>Bank Instructions:</strong> {profile.bankTransferInstructions}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Delivery Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate codes, delivery instructions..."
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {/* Order Review Sidecard */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Order Review</h3>
          
          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            {items.map((i) => {
              const price = i.variant?.priceOverride ?? i.product.effectivePrice;
              return (
                <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#334155', maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {i.quantity}x {i.product.name}
                  </span>
                  <span style={{ fontWeight: 600 }}>{currencySymbol} {(price * i.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{currencySymbol} {subTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Tax ({taxRate}%)</span>
            <span style={{ fontWeight: 600 }}>{currencySymbol} {estimatedTax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Delivery</span>
            <span style={{ fontWeight: 600 }}>
              {deliveryFee === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `${currencySymbol} ${deliveryFee.toFixed(2)}`}
            </span>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Due</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{currencySymbol} {grandTotal.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', justifyContent: 'center', fontSize: '0.9375rem' }}
          >
            <Lock size={16} />
            {loading ? 'Authorizing & Submitting...' : 'Place Order Now'}
          </button>
        </div>
      </form>
    </div>
  );
};
