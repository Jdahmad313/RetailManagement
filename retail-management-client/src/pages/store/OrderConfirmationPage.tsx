import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Printer, Package, Clock } from 'lucide-react';
import { Order, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    apiClient.get<ApiResponse<Order>>(`/orders/number/${orderNumber}`)
      .then((res) => {
        if (res.data.success) {
          setOrder(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading order confirmation...</div>;
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Order not found</h2>
        <Link to="/catalog" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 800, padding: '3rem 1.5rem' }}>
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle2 size={36} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Thank You for Your Order!
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
          We received your order and have reserved your items in inventory.
        </p>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', display: 'inline-flex', gap: '2rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Order Number</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{order.orderNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
            <span className="badge badge-success">Confirmed</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Paid</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>${order.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
            <Printer size={15} /> Print / Save PDF
          </button>
          <Link to="/account" className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
            <Package size={15} /> View My Orders
          </Link>
          <Link to="/catalog" className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
            Continue Shopping <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Order Item Details */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
          Order Items & Breakdown
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <thead style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '0.5rem 0' }}>Item</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 0' }}>
                  <div style={{ fontWeight: 600 }}>{i.productName}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {i.sku}</div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{i.quantity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${i.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700 }}>${i.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end', fontSize: '0.875rem' }}>
          <div><span style={{ color: '#64748b' }}>Subtotal: </span> <strong>${order.subTotal.toFixed(2)}</strong></div>
          <div><span style={{ color: '#64748b' }}>Tax: </span> <strong>${order.taxAmount.toFixed(2)}</strong></div>
          <div><span style={{ color: '#64748b' }}>Delivery Fee: </span> <strong>${order.shippingFee.toFixed(2)}</strong></div>
          <div style={{ fontSize: '1.125rem', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            Grand Total: <strong style={{ color: '#2563eb' }}>${order.totalAmount.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
