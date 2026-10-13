import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Package,
  Printer,
  History,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import {
  DashboardSummary,
  InventoryValuation,
  ApiResponse,
  BusinessProfile,
  ProductYearlyAnalytics,
  ProductAuditLog
} from '../../types';
import { apiClient } from '../../api/client';

export const ReportsAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statement' | 'yearlyAnalytics' | 'auditLogs'>('statement');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [valuation, setValuation] = useState<InventoryValuation | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Yearly Analysis State
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [yearlyData, setYearlyData] = useState<ProductYearlyAnalytics[]>([]);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [searchItem, setSearchItem] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ProductAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  const currencySymbol = profile?.currencySymbol || 'Rs.';

  const loadFinancialSummary = async () => {
    try {
      const [sumRes, valRes, profRes] = await Promise.all([
        apiClient.get<ApiResponse<DashboardSummary>>('/reports/dashboard-summary'),
        apiClient.get<ApiResponse<InventoryValuation>>('/reports/inventory-valuation'),
        apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings'),
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (valRes.data.success) setValuation(valRes.data.data);
      if (profRes.data.success) setProfile(profRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyAnalytics = async (year: number) => {
    setLoadingYearly(true);
    try {
      const res = await apiClient.get<ApiResponse<ProductYearlyAnalytics[]>>(`/reports/yearly-analytics?year=${year}`);
      if (res.data.success) {
        setYearlyData(res.data.data || []);
      }
    } finally {
      setLoadingYearly(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await apiClient.get<ApiResponse<ProductAuditLog[]>>('/reports/product-audit-logs?limit=200');
      if (res.data.success) {
        setAuditLogs(res.data.data || []);
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadFinancialSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'yearlyAnalytics') {
      loadYearlyAnalytics(selectedYear);
    } else if (activeTab === 'auditLogs') {
      loadAuditLogs();
    }
  }, [activeTab, selectedYear]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Generating financial reports...</div>;
  }

  const grossMarginPct =
    summary && summary.salesThisMonth > 0
      ? (summary.estimatedGrossProfitThisMonth / summary.salesThisMonth) * 100
      : 0;

  // Filter yearly items
  const filteredYearlyItems = yearlyData.filter(item =>
    !searchItem ||
    item.productName.toLowerCase().includes(searchItem.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchItem.toLowerCase()) ||
    item.categoryName.toLowerCase().includes(searchItem.toLowerCase())
  );

  const totalYearUnits = yearlyData.reduce((acc, i) => acc + i.totalUnitsSold, 0);
  const totalYearRevenue = yearlyData.reduce((acc, i) => acc + i.totalRevenue, 0);
  const totalYearProfit = yearlyData.reduce((acc, i) => acc + i.totalGrossProfit, 0);

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log =>
    !auditSearch ||
    log.productName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.sku.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.actionType.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.changeSummary.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Financial & Analytics Reports</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Authoritative operating results, yearly sales analysis, and product price audit history
          </p>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary">
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('statement')}
          style={{
            padding: '0.625rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: activeTab === 'statement' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'statement' ? '2px solid #2563eb' : 'none',
            marginBottom: '-4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <DollarSign size={16} /> Financial Statement & Valuation
        </button>

        <button
          onClick={() => setActiveTab('yearlyAnalytics')}
          style={{
            padding: '0.625rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: activeTab === 'yearlyAnalytics' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'yearlyAnalytics' ? '2px solid #2563eb' : 'none',
            marginBottom: '-4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <TrendingUp size={16} /> Yearly Item Sales Analysis
        </button>

        <button
          onClick={() => setActiveTab('auditLogs')}
          style={{
            padding: '0.625rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: activeTab === 'auditLogs' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'auditLogs' ? '2px solid #2563eb' : 'none',
            marginBottom: '-4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <History size={16} /> Product Price & Info Audit Log
        </button>
      </div>

      {/* TAB 1: Financial & Operating Statement */}
      {activeTab === 'statement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Income & Profit Statement */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="#16a34a" /> Monthly Operating Statement (Estimated)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                <span style={{ fontWeight: 600 }}>Total Gross Revenue (POS + E-Commerce)</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{currencySymbol} {summary?.salesThisMonth.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Estimated Cost of Goods Sold (COGS)</span>
                <span style={{ color: '#dc2626' }}>
                  -{currencySymbol} {((summary?.salesThisMonth || 0) - (summary?.estimatedGrossProfitThisMonth || 0)).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0' }}>
                <span style={{ fontWeight: 700, color: '#166534' }}>Estimated Gross Profit</span>
                <strong style={{ fontSize: '1.125rem', color: '#16a34a' }}>
                  {currencySymbol} {summary?.estimatedGrossProfitThisMonth.toFixed(2)} ({grossMarginPct.toFixed(1)}% Margin)
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Operating & Administrative Expenses</span>
                <span style={{ color: '#dc2626' }}>-{currencySymbol} {summary?.expensesThisMonth.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '2px solid #93c5fd' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#1e3a8a' }}>Net Operating Result</span>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Gross profit minus operational expenses</div>
                </div>
                <strong style={{ fontSize: '1.5rem', color: (summary?.estimatedNetProfitThisMonth || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                  {currencySymbol} {summary?.estimatedNetProfitThisMonth.toFixed(2)}
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
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Stock Units</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {valuation?.totalStockOnHand}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Units in physical inventory</div>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Total Cost Capital (FIFO)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
                  {currencySymbol} {valuation?.totalCostValue.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#b91c1c' }}>Total inventory purchase investment</div>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Total Retail Asset Value</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
                  {currencySymbol} {valuation?.totalRetailValue.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#15803d' }}>Gross retail liquidation value</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Yearly & Monthly Item Sales Performance */}
      {activeTab === 'yearlyAnalytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls: Year Selector & Search */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Select Analysis Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.875rem' }}
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                placeholder="Filter item by name, SKU, category..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Items Sold ({selectedYear})</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {totalYearUnits.toLocaleString()} units
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Across catalog items</div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Annual Revenue ({selectedYear})</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
                {currencySymbol} {totalYearRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Gross revenue generated</div>
            </div>

            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0891b2' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Profit ({selectedYear})</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0891b2', margin: '0.25rem 0' }}>
                {currencySymbol} {totalYearProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Revenue minus unit cost</div>
            </div>
          </div>

          {/* Yearly Item Sales Analysis Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Itemized Monthly Sales Matrix ({selectedYear})
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing {filteredYearlyItems.length} products
              </span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>SKU</th>
                    <th style={{ padding: '0.75rem 1rem', minWidth: 160 }}>Product Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>Total Sold</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700 }}>Revenue ({currencySymbol})</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700 }}>Profit ({currencySymbol})</th>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                      <th key={m} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.7rem' }}>{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingYearly ? (
                    <tr>
                      <td colSpan={18} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Loading annual data...
                      </td>
                    </tr>
                  ) : filteredYearlyItems.length === 0 ? (
                    <tr>
                      <td colSpan={18} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No product sales records found for {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    filteredYearlyItems.map((item) => (
                      <tr key={item.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                          {item.sku}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                          {item.productName}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                          <span className="badge badge-info">{item.categoryName}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e40af' }}>
                          {item.totalUnitsSold}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                          {item.totalRevenue.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#166534' }}>
                          {item.totalGrossProfit.toFixed(2)}
                        </td>
                        {item.monthlySales.map((m) => (
                          <td
                            key={m.month}
                            style={{
                              padding: '0.75rem 0.5rem',
                              textAlign: 'center',
                              fontWeight: m.unitsSold > 0 ? 700 : 400,
                              color: m.unitsSold > 0 ? '#0f172a' : '#cbd5e1',
                              backgroundColor: m.unitsSold > 0 ? '#faf5ff' : 'transparent',
                            }}
                            title={`${m.monthName}: ${m.unitsSold} units, Rev: ${currencySymbol} ${m.revenue.toFixed(2)}`}
                          >
                            {m.unitsSold > 0 ? m.unitsSold : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Product Price & Modification Audit Logs */}
      {activeTab === 'auditLogs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls: Search */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Product Change & Price Audit Trail</span>
            </div>

            <div style={{ position: 'relative', width: 300 }}>
              <input
                type="text"
                placeholder="Search by SKU, item, action, user..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem' }}>SKU & Product</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Action Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Selling Price Change</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Purchase Cost Change</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Stock Impact</th>
                    <th style={{ padding: '0.75rem 1rem', minWidth: 200 }}>Change Summary</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Modified By</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Loading audit history...
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isPriceUp = (log.newSellingPrice || 0) > (log.oldSellingPrice || 0);
                      const isPriceDown = (log.newSellingPrice || 0) < (log.oldSellingPrice || 0);

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                            {new Date(log.createdAtUtc).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>SKU: {log.sku}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              className={`badge ${
                                log.actionType.includes('Price')
                                  ? 'badge-warning'
                                  : log.actionType.includes('Stock')
                                  ? 'badge-info'
                                  : log.actionType === 'Created'
                                  ? 'badge-success'
                                  : 'badge-secondary'
                              }`}
                            >
                              {log.actionType}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {log.oldSellingPrice !== undefined && log.newSellingPrice !== undefined && log.oldSellingPrice !== log.newSellingPrice ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                                <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                  {currencySymbol} {log.oldSellingPrice?.toFixed(2)}
                                </span>
                                <span>→</span>
                                <span style={{ color: isPriceUp ? '#16a34a' : '#dc2626' }}>
                                  {currencySymbol} {log.newSellingPrice?.toFixed(2)}
                                </span>
                              </div>
                            ) : log.newSellingPrice !== undefined ? (
                              <span>{currencySymbol} {log.newSellingPrice?.toFixed(2)}</span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {log.oldPurchaseCost !== undefined && log.newPurchaseCost !== undefined && log.oldPurchaseCost !== log.newPurchaseCost ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                  {currencySymbol} {log.oldPurchaseCost?.toFixed(2)}
                                </span>
                                <span>→</span>
                                <span style={{ fontWeight: 600 }}>
                                  {currencySymbol} {log.newPurchaseCost?.toFixed(2)}
                                </span>
                              </div>
                            ) : log.newPurchaseCost !== undefined ? (
                              <span>{currencySymbol} {log.newPurchaseCost?.toFixed(2)}</span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {log.oldStock !== undefined && log.newStock !== undefined && log.oldStock !== log.newStock ? (
                              <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                {log.oldStock} → {log.newStock}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                            {log.changeSummary}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            👤 {log.changedByUserName || 'System'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
