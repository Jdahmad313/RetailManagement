import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Package, Printer } from 'lucide-react';
import { DashboardSummary, InventoryValuation, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const ReportsAdminPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [valuation, setValuation] = useState<InventoryValuation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<DashboardSummary>>('/reports/dashboard-summary'),
      apiClient.get<ApiResponse<InventoryValuation>>('/reports/inventory-valuation'),
    ])
      .then(([sumRes, valRes]) => {
        if (sumRes.data.success) setSummary(sumRes.data.data);
        if (valRes.data.success) setValuation(valRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Generating financial reports...</div>;
  }

  const grossMarginPct =
    summary && summary.salesThisMonth > 0
      ? (summary.estimatedGrossProfitThisMonth / summary.salesThisMonth) * 100
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Financial & Inventory Reports</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Authoritative calculations for COGS, gross margin, operating results, and stock valuation</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary">
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Income & Profit Statement */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} color="#16a34a" /> Monthly Operating Statement (Estimated)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
            <span style={{ fontWeight: 600 }}>Total Gross Revenue (POS + E-Commerce)</span>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>${summary?.salesThisMonth.toFixed(2)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
            <span style={{ color: '#64748b' }}>Estimated Cost of Goods Sold (COGS)</span>
            <span style={{ color: '#dc2626' }}>
              -${((summary?.salesThisMonth || 0) - (summary?.estimatedGrossProfitThisMonth || 0)).toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0' }}>
            <span style={{ fontWeight: 700, color: '#166534' }}>Estimated Gross Profit</span>
            <strong style={{ fontSize: '1.125rem', color: '#16a34a' }}>
              ${summary?.estimatedGrossProfitThisMonth.toFixed(2)} ({grossMarginPct.toFixed(1)}% Margin)
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
            <span style={{ color: '#64748b' }}>Operating & Administrative Expenses</span>
            <span style={{ color: '#dc2626' }}>-${summary?.expensesThisMonth.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '2px solid #93c5fd' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#1e3a8a' }}>Net Operating Result</span>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Gross profit minus operational expenses</div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: (summary?.estimatedNetProfitThisMonth || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
              ${summary?.estimatedNetProfitThisMonth.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Inventory Valuation Report */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} color="#2563eb" /> Inventory Capital & Valuation Report
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Unique SKUs</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {valuation?.totalUniqueItems}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Distinct catalog items</div>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Units On Hand</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {valuation?.totalStockOnHand}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total physical units</div>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cost Valuation</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>
              ${valuation?.totalCostValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Asset purchase value</div>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Retail Valuation</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', margin: '0.25rem 0' }}>
              ${valuation?.totalRetailValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 600 }}>
              Potential Markup: +${valuation?.potentialProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
