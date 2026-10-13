import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Banknote,
  CreditCard,
  Receipt,
  Clock,
  TrendingUp,
  Printer,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PosSale, ApiResponse, PagedResponse, BusinessProfile } from '../../types';

export const CashierDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PosSale | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  const fetchShiftData = async () => {
    setLoading(true);
    try {
      const [salesRes, setRes] = await Promise.all([
        apiClient.get<ApiResponse<PagedResponse<PosSale>>>('/pos/sales?pageSize=50'),
        apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings'),
      ]);
      if (salesRes.data.success) {
        setSales(salesRes.data.data.items);
      }
      if (setRes.data.success) {
        setBusinessProfile(setRes.data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, []);

  // Compute shift metrics
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransactions = sales.length;

  const cashSalesAmount = sales.reduce((sum, s) => {
    const cashPortion = s.payments?.filter((p) => p.paymentMethod === 0).reduce((pSum, p) => pSum + p.amount, 0) || 0;
    return sum + (s.payments?.length ? cashPortion : s.totalAmount);
  }, 0);

  const cardSalesAmount = sales.reduce((sum, s) => {
    const cardPortion = s.payments?.filter((p) => p.paymentMethod === 1).reduce((pSum, p) => pSum + p.amount, 0) || 0;
    return sum + cardPortion;
  }, 0);

  const averageTicket = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Shift Header & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Cashier Shift & POS Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Logged in as <strong>{user?.fullName || 'Cashier'}</strong> • Active Register #{user?.email?.slice(0, 8) || '01'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchShiftData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <Link
            to="/admin/pos"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.9375rem', fontWeight: 700 }}
          >
            <ShoppingCart size={18} /> Launch POS Register
          </Link>
        </div>
      </div>

      {/* KPI Shift Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Shift Total Sales</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>${totalSalesAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Transactions</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>{totalTransactions}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cash Collected</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>${cashSalesAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Card & Digital</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>${cardSalesAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Shift Transactions List */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Shift Transactions</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Recent invoices and receipts processed at this station</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>Loading shift transactions...</div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Receipt size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>No sales recorded in this session yet.</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Open the POS Terminal to start billing customers.</div>
            <Link to="/admin/pos" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', padding: '0.5rem 1rem' }}>
              Open POS Terminal
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Receipt #</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Items</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#2563eb' }}>
                      {sale.receiptNumber}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                      {new Date(sale.createdAtUtc).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                      {sale.customerName || 'Walk-in Customer'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {sale.items?.length || 1}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      ${sale.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedReceipt(sale)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Printer size={13} /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 420, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-success">Completed Transaction</span>
              <button onClick={() => setSelectedReceipt(null)}><X size={18} /></button>
            </div>

            <div id="printable-cashier-receipt" style={{ fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.4, border: '1px dashed #cbd5e1', padding: '1rem', backgroundColor: '#ffffff', color: '#000000' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{businessProfile?.businessName || 'Apex Retail Store'}</h3>
                <div>{businessProfile?.address}</div>
                <div>{businessProfile?.phone}</div>
                <div>{businessProfile?.receiptHeader}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                <div>Receipt: {selectedReceipt.receiptNumber}</div>
                <div>Date: {new Date(selectedReceipt.createdAtUtc).toLocaleString()}</div>
                <div>Cashier: {selectedReceipt.cashierName}</div>
                <div>Customer: {selectedReceipt.customerName}</div>
              </div>

              <table style={{ width: '100%', textAlign: 'left', marginBottom: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceipt.items?.map((i) => (
                    <tr key={i.id}>
                      <td>{i.productName}</td>
                      <td style={{ textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${i.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>${selectedReceipt.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>${selectedReceipt.taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9375rem', borderTop: '1px solid #000', paddingTop: '0.25rem' }}>
                  <span>TOTAL:</span>
                  <span>${selectedReceipt.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tendered:</span>
                  <span>${selectedReceipt.amountTendered.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Change:</span>
                  <span>${selectedReceipt.changeGiven.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', borderTop: '1px dashed #000', paddingTop: '0.5rem' }}>
                {businessProfile?.receiptFooter || 'Thank you for shopping with us!'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Printer size={16} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
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
