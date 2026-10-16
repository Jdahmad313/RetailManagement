import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Receipt,
  PieChart,
  Package,
} from 'lucide-react';
import { DashboardSummary, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useBusiness } from '../../context/BusinessContext';

export const DashboardPage: React.FC = () => {
  const { currencySymbol } = useBusiness();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<ApiResponse<DashboardSummary>>('/reports/dashboard-summary')
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading dashboard metrics...</div>;
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Business Analytics & Overview</h1>
        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Real-time metrics calculated directly from persisted POS transactions, e-commerce orders, and expenses.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sales Today</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{currencySymbol} {data.salesToday.toFixed(2)}</div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>{data.ordersToday} transactions today</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sales This Month</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{currencySymbol} {data.salesThisMonth.toFixed(2)}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{data.ordersThisMonth} total orders</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Channel Split</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
              POS: {data.posTransactionsCount} | Web: {data.onlineOrdersCount}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Omni-channel transactions</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Expenses This Month</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{currencySymbol} {data.expensesThisMonth.toFixed(2)}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Operating & supplies</div>
          </div>
        </div>
      </div>

      {/* Financial Health Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#2563eb" /> Profitability Estimates
            </h3>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Revenue - COGS - Expenses</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>Gross Profit (Revenue - COGS)</span>
              <strong style={{ color: '#16a34a' }}>{currencySymbol} {data.estimatedGrossProfitThisMonth.toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#475569' }}>Operating Expenses</span>
              <strong style={{ color: '#dc2626' }}>-{currencySymbol} {data.expensesThisMonth.toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem', fontSize: '1rem', border: '1px solid #bfdbfe' }}>
              <span style={{ fontWeight: 700, color: '#1e3a8a' }}>Estimated Net Operating Result</span>
              <strong style={{ color: data.estimatedNetProfitThisMonth >= 0 ? '#16a34a' : '#dc2626' }}>
                {currencySymbol} {data.estimatedNetProfitThisMonth.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* Inventory Status Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="#d97706" /> Inventory Health
            </h3>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Active Catalog</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{data.totalProducts}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Active Products</div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: data.lowStockProductsCount > 0 ? '#fef3c7' : '#f0fdf4', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: data.lowStockProductsCount > 0 ? '#b45309' : '#15803d' }}>
                {data.lowStockProductsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Low-Stock Warnings</div>
            </div>
          </div>

          {data.lowStockProductsCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#b45309' }}>
              <AlertTriangle size={14} /> Reorder thresholds reached. Visit Inventory to review purchase requirements.
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Sales Trend & Top Products Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Sales Trend Bar Visual */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>7-Day Revenue Trend</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 180, paddingTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {data.salesTrend.map((t) => {
              const maxVal = Math.max(...data.salesTrend.map((x) => x.totalSales), 100);
              const heightPct = Math.min(100, Math.max(10, (t.totalSales / maxVal) * 100));
              return (
                <div key={t.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0f172a' }}>
                    {currencySymbol} {t.totalSales.toFixed(0)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 32,
                      height: `${heightPct}%`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '0.25rem 0.25rem 0 0',
                    }}
                    title={`Online: ${currencySymbol} ${t.onlineSales} | POS: ${currencySymbol} ${t.posSales}`}
                  />
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    {t.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Top Selling Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.topProducts.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8125rem', textAlign: 'center', padding: '2rem' }}>
                No completed sales recorded yet.
              </div>
            ) : (
              data.topProducts.map((p, idx) => (
                <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 800, color: '#94a3b8', width: 16 }}>{idx + 1}.</span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.productName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace' }}>SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                    <div style={{ fontWeight: 700 }}>{currencySymbol} {p.totalRevenue.toFixed(2)}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#16a34a' }}>{p.unitsSold} sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
