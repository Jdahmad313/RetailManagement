import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Search, X } from 'lucide-react';
import { Order, PagedResponse, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const OrdersAdminPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Selected Order for detail & status change
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<number>(1);
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (search) params.append('searchTerm', search);
    params.append('pageSize', '50');

    apiClient.get<ApiResponse<PagedResponse<Order>>>(`/orders?${params.toString()}`)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setOrders(res.data.data.items);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await apiClient.put<ApiResponse<Order>>(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        cancellationReason: newStatus === 6 ? cancelReason : null,
      });
      if (res.data.success) {
        setSelectedOrder(null);
        loadOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <span className="badge badge-warning">Pending</span>;
      case 1: return <span className="badge badge-info">Confirmed</span>;
      case 2: return <span className="badge badge-info">Processing</span>;
      case 3: return <span className="badge badge-info">Ready For Pickup</span>;
      case 4: return <span className="badge badge-warning">Out For Delivery</span>;
      case 5: return <span className="badge badge-success">Completed</span>;
      case 6: return <span className="badge badge-danger">Cancelled</span>;
      case 7: return <span className="badge badge-warning">Returned</span>;
      default: return <span className="badge">Unknown</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Order Processing</h1>
        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Manage online orders, dispatch workflows, and fulfillment statuses</p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.75rem 0.4rem 2rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Statuses</option>
          <option value="0">Pending</option>
          <option value="1">Confirmed</option>
          <option value="2">Processing</option>
          <option value="4">Out For Delivery</option>
          <option value="5">Completed</option>
          <option value="6">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.25rem' }}>Order Number</th>
              <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
              <th style={{ padding: '0.75rem 1rem' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Total</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {o.orderNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{o.customerName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{o.customerEmail}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {o.fulfillmentType === 0 ? 'Delivery' : 'Pickup'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>
                    ${o.totalAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {getStatusBadge(o.status)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {new Date(o.createdAtUtc).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setNewStatus(o.status);
                        setCancelReason('');
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
                    >
                      <Eye size={14} /> View / Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Order Details: {selectedOrder.orderNumber}</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Placed: {new Date(selectedOrder.createdAtUtc).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)}><X size={18} /></button>
            </div>

            {/* Customer & Fulfillment Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <strong>Customer: </strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})
                  {selectedOrder.customerPhone && <div><strong>Phone: </strong> {selectedOrder.customerPhone}</div>}
                </div>
                <div>
                  <strong>Fulfillment: </strong> {selectedOrder.fulfillmentType === 0 ? 'Doorstep Delivery' : 'In-Store Pickup'}
                  {selectedOrder.shippingAddressJson && (
                    <div style={{ marginTop: '0.25rem', color: '#475569' }}>
                      <strong>Address: </strong> {selectedOrder.shippingAddressJson}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ordered Items</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.375rem 0' }}>Product</th>
                    <th style={{ padding: '0.375rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.375rem', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '0.375rem 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0' }}>
                        <div style={{ fontWeight: 600 }}>{i.productName}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>SKU: {i.sku}</div>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${i.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>${i.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                <div>Subtotal: ${selectedOrder.subTotal.toFixed(2)}</div>
                <div>Tax: ${selectedOrder.taxAmount.toFixed(2)}</div>
                <div>Delivery: ${selectedOrder.shippingFee.toFixed(2)}</div>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', marginTop: '0.25rem' }}>
                  Total: ${selectedOrder.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Status Transition Control */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Update Status</h4>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(parseInt(e.target.value, 10))}
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value={1}>Confirmed</option>
                  <option value={2}>Processing</option>
                  <option value={3}>Ready for Pickup</option>
                  <option value={4}>Out for Delivery</option>
                  <option value={5}>Completed</option>
                  <option value={6}>Cancelled (Restocks Inventory)</option>
                </select>
                <button onClick={handleUpdateStatus} disabled={updating} className="btn btn-primary">
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>

              {newStatus === 6 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Cancellation Reason *</label>
                  <input
                    type="text"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="E.g. Customer requested refund, stock unavailable"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
