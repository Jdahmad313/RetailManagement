import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, subTotal, itemCount } = useCart();

  const freeDeliveryThreshold = 75;
  const remainingForFreeShipping = Math.max(0, freeDeliveryThreshold - subTotal);

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <ShoppingBag size={32} color="#94a3b8" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your shopping cart is empty</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link to="/catalog" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>Shopping Cart ({itemCount} items)</h1>

      {/* Free Delivery Bar */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.875rem 1.25rem', marginBottom: '2rem' }}>
        {remainingForFreeShipping > 0 ? (
          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
            Add <strong>${remainingForFreeShipping.toFixed(2)}</strong> more of items to qualify for <strong>FREE Delivery</strong>!
          </div>
        ) : (
          <div style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600 }}>
            🎉 You have qualified for <strong>FREE Delivery</strong>!
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Items Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.875rem 1.25rem' }}>Product</th>
                <th style={{ padding: '0.875rem 1rem' }}>Price</th>
                <th style={{ padding: '0.875rem 1rem' }}>Quantity</th>
                <th style={{ padding: '0.875rem 1rem' }}>Total</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const price = item.variant?.priceOverride ?? item.product.effectivePrice;
                const lineTotal = price * item.quantity;
                return (
                  <tr key={`${item.product.id}-${item.variant?.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                        alt={item.product.name}
                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <Link to={`/product/${item.product.id}`} style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Variant: {item.variant.name}</div>
                        )}
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {item.product.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>${price.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                          style={{ padding: '0.25rem 0.5rem', fontWeight: 700 }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0 0.5rem', minWidth: 24, textAlign: 'center', fontSize: '0.8125rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                          style={{ padding: '0.25rem 0.5rem', fontWeight: 700 }}
                          disabled={item.quantity >= item.product.stockQuantity}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>${lineTotal.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                        style={{ color: '#ef4444', padding: '0.25rem' }}
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={clearCart} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
              Clear Cart
            </button>
            <Link to="/catalog" style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600 }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>${subTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Estimated Tax (8.5%)</span>
            <span style={{ fontWeight: 600 }}>${(subTotal * 0.085).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Delivery Fee</span>
            <span style={{ fontWeight: 600 }}>
              {subTotal >= freeDeliveryThreshold ? (
                <span style={{ color: '#16a34a' }}>FREE</span>
              ) : (
                '$5.00'
              )}
            </span>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Estimated Total</span>
            <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>
              ${(subTotal + subTotal * 0.085 + (subTotal >= freeDeliveryThreshold ? 0 : 5)).toFixed(2)}
            </span>
          </div>

          <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}>
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
