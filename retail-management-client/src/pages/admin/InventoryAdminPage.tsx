import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeftRight, AlertTriangle, Search, X, CheckCircle } from 'lucide-react';
import { InventoryMovement, Product, PagedResponse, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const InventoryAdminPage: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [movementType, setMovementType] = useState<number>(5); // 5=AdjustmentAddition, 6=AdjustmentDeduction, 7=DamageWriteOff
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('searchTerm', search);
    params.append('pageSize', '50');

    Promise.all([
      apiClient.get<ApiResponse<PagedResponse<InventoryMovement>>>(`/inventory/movements?${params.toString()}`),
      apiClient.get<ApiResponse<Product[]>>('/inventory/low-stock-alerts'),
      apiClient.get<ApiResponse<{ items: Product[] }>>('/products?pageSize=100'),
    ])
      .then(([movRes, lowRes, prodRes]) => {
        if (movRes.data.success && movRes.data.data) {
          setMovements(movRes.data.data.items);
        }
        if (lowRes.data.success) {
          setLowStockProducts(lowRes.data.data);
        }
        if (prodRes.data.success && prodRes.data.data) {
          setProducts(prodRes.data.data.items);
          if (!selectedProductId && prodRes.data.data.items.length > 0) {
            setSelectedProductId(prodRes.data.data.items[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSaving(true);
    setErrorMsg(null);

    const adjustedQty = movementType === 6 || movementType === 7 ? -Math.abs(quantityChange) : Math.abs(quantityChange);

    try {
      await apiClient.post('/inventory/adjust', {
        productId: selectedProductId,
        quantityChange: adjustedQty,
        movementType,
        reason: reason.trim() || 'Manual stock adjustment by admin',
      });
      setShowAdjustModal(false);
      setReason('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setSaving(false);
    }
  };

  const getMovementTypeLabel = (type: number) => {
    switch (type) {
      case 0: return { label: 'Opening Stock', color: 'badge-info' };
      case 1: return { label: 'Purchase Receipt', color: 'badge-success' };
      case 2: return { label: 'Online Sale', color: 'badge-warning' };
      case 3: return { label: 'POS Sale', color: 'badge-warning' };
      case 4: return { label: 'Return Restock', color: 'badge-info' };
      case 5: return { label: 'Adjustment (+)', color: 'badge-success' };
      case 6: return { label: 'Adjustment (-)', color: 'badge-danger' };
      case 7: return { label: 'Damage Write-off', color: 'badge-danger' };
      default: return { label: 'Movement', color: 'badge-info' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Inventory Movements & Audit</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Every addition, sale, deduction, and adjustment is recorded with full traceability</p>
        </div>
        <button onClick={() => setShowAdjustModal(true)} className="btn btn-primary">
          <ArrowLeftRight size={16} /> Adjust Stock
        </button>
      </div>

      {/* Low Stock Alerts Bar */}
      {lowStockProducts.length > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '0.5rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <strong style={{ fontSize: '0.875rem', color: '#92400e' }}>
                {lowStockProducts.length} Product(s) at or below Reorder Threshold
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                {lowStockProducts.map((p) => `${p.name} (${p.stockQuantity} remaining)`).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (lowStockProducts.length > 0) {
                setSelectedProductId(lowStockProducts[0].id);
                setMovementType(5);
                setQuantityChange(25);
                setShowAdjustModal(true);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', backgroundColor: '#ffffff' }}
          >
            Quick Restock
          </button>
        </div>
      )}

      {/* Movements Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 300 }}>
            <input
              type="text"
              placeholder="Search by product, SKU, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.75rem 0.4rem 2rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Showing latest stock ledger events</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.25rem' }}>Date & Time</th>
              <th style={{ padding: '0.75rem 1rem' }}>Product</th>
              <th style={{ padding: '0.75rem 1rem' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Change</th>
              <th style={{ padding: '0.75rem 1rem' }}>Before → After</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reference / Reason</th>
              <th style={{ padding: '0.75rem 1.25rem' }}>User</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading movements...</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No movement records found.</td></tr>
            ) : (
              movements.map((m) => {
                const badge = getMovementTypeLabel(m.movementType);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#64748b' }}>
                      {new Date(m.createdAtUtc).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.productName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {m.sku}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: m.quantityChange > 0 ? '#16a34a' : '#dc2626' }}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                      {m.quantityBefore} → {m.quantityAfter}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {m.referenceId && <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>Ref: {m.referenceId}</div>}
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{m.reason || 'None'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#64748b' }}>
                      {m.performedByUserName || 'System'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Manual Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)}><X size={18} /></button>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Adjustment Type *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                >
                  <option value={5}>Stock Addition (Restock / Found Stock)</option>
                  <option value={6}>Stock Deduction (Manual Correction / Shrinkage)</option>
                  <option value={7}>Damage / Expiry Write-Off</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reason / Notes</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for manual adjustment (audited)..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Adjusting...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
