import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Clock,
  Printer,
  ChevronRight,
  User,
  ShieldCheck,
  Truck,
  CreditCard,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { Order, ApiResponse, PagedResponse, BusinessProfile } from '../../types';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { currencySymbol } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const [ordRes, bizRes] = await Promise.all([
        apiClient.get<ApiResponse<PagedResponse<Order>>>('/orders/my-orders?pageSize=50'),
        apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings'),
      ]);
      if (ordRes.data.success) {
        setOrders(ordRes.data.data.items);
      }
      if (bizRes.data.success) {
        setBusinessProfile(bizRes.data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="badge badge-warning">Pending</span>;
      case 1:
        return <span className="badge badge-primary">Confirmed</span>;
      case 2:
        return <span className="badge badge-primary">Processing</span>;
      case 3:
        return <span className="badge badge-success">Shipped</span>;
      case 4:
        return <span className="badge badge-success">Delivered</span>;
      case 5:
        return <span className="badge badge-danger">Cancelled</span>;
      case 6:
        return <span className="badge badge-danger">Returned</span>;
      default:
        return <span className="badge badge-secondary">Order Placed</span>;
    }
  };

  const getPaymentBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem' }}>● Paid</span>;
      case 0:
        return <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>○ Pending Payment</span>;
      case 2:
        return <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>✕ Failed</span>;
      default:
        return <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Pending</span>;
    }
  };

  return (
    <div className="container" style={{ maxWidth: 1080, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Account Overview Header */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Welcome back, {user?.fullName}!
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {user?.email} • Verified Customer Account
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchMyOrders}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <Link
              to="/profile"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}
            >
              Edit Profile & Password
            </Link>
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Orders & Purchase History
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Track shipments and print or download official invoices
            </p>
          </div>
          <span className="badge badge-secondary">{orders.length} Total Orders</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
            <ShoppingBag size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>No orders placed yet</h3>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Explore our catalog and find the products you love!
            </p>
            <Link to="/catalog" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', padding: '0.5rem 1.25rem' }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.9375rem' }}>
                      {ord.orderNumber}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(ord.createdAtUtc).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getPaymentBadge(ord.paymentStatus)}
                    {getStatusBadge(ord.status)}
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Items ({ord.items?.length || 0}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {ord.items?.map((item) => (
                        <div key={item.id} style={{ fontSize: '0.8125rem', color: '#334155', display: 'flex', justifyContent: 'space-between', maxWidth: 420 }}>
                          <span>{item.quantity}x {item.productName}</span>
                          <span style={{ fontWeight: 600 }}>{currencySymbol} {item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Invoice Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: 160 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Fulfillment: <strong style={{ color: '#0f172a' }}>{ord.fulfillmentType === 0 ? 'Home Delivery' : 'Pickup'}</strong>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {currencySymbol} {ord.totalAmount.toFixed(2)}
                    </div>
                    <button
                      onClick={() => setSelectedInvoice(ord)}
                      className="btn btn-secondary"
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Printer size={14} /> Download / Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>Official Tax Invoice</span>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Printable Content Block */}
            <div id="customer-printable-invoice" style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    {businessProfile?.businessName || 'Apex Retail Store'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '3px 0' }}>{businessProfile?.address}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0' }}>📞 {businessProfile?.phone} • ✉ {businessProfile?.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2563eb', display: 'block' }}>INVOICE</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>#{selectedInvoice.orderNumber}</span>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Date: {new Date(selectedInvoice.createdAtUtc).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Bill To & Fulfillment Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>Billed To:</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.customerName}</div>
                  <div style={{ color: '#475569' }}>{selectedInvoice.customerEmail}</div>
                  {selectedInvoice.customerPhone && <div style={{ color: '#475569' }}>{selectedInvoice.customerPhone}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>Fulfillment & Payment:</div>
                  <div>Method: <strong>{selectedInvoice.fulfillmentType === 0 ? 'Delivery' : 'Store Pickup'}</strong></div>
                  <div>Payment: <strong>{selectedInvoice.paymentMethod === 0 ? 'Cash on Delivery' : selectedInvoice.paymentMethod === 1 ? 'Credit/Debit Card' : 'Bank Wire Transfer'}</strong></div>
                  <div>Payment Status: {getPaymentBadge(selectedInvoice.paymentStatus)}</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #0f172a', borderTop: '1px solid #0f172a' }}>
                    <th style={{ padding: '0.5rem 0' }}>Item Description</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{currencySymbol} {item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>{currencySymbol} {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '0.75rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220 }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span>{currencySymbol} {selectedInvoice.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220 }}>
                  <span style={{ color: '#64748b' }}>Delivery Fee:</span>
                  <span>{currencySymbol} {selectedInvoice.shippingFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220 }}>
                  <span style={{ color: '#64748b' }}>Estimated Tax:</span>
                  <span>{currencySymbol} {selectedInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: '1rem', fontWeight: 800, borderTop: '2px solid #0f172a', paddingTop: '0.35rem', marginTop: '0.25rem' }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#2563eb' }}>{currencySymbol} {selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                Thank you for choosing {businessProfile?.businessName || 'Apex Retail Store'}! If you have any inquiries, please contact our support team.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Printer size={16} /> Print / Save as PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
