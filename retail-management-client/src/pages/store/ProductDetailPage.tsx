import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Product, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get<ApiResponse<Product>>(`/products/${id}`)
      .then((res) => {
        if (res.data.success) {
          setProduct(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/catalog" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const attributes: Record<string, string> = product.attributesJson
    ? JSON.parse(product.attributesJson)
    : {};

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', padding: '2rem' }}>
        {/* Product Image */}
        <div>
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
            alt={product.name}
            style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
          />
        </div>

        {/* Product Information */}
        <div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {product.categoryName} {product.brand && `• ${product.brand}`}
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '1rem' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              ${product.effectivePrice.toFixed(2)}
            </span>
            {product.discountPrice && (
              <span style={{ fontSize: '1.25rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ${product.sellingPrice.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ {product.unit}</span>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {product.description || 'No description provided.'}
          </p>

          {/* Extensible Industry Attributes */}
          {Object.keys(attributes).length > 0 && (
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                Specifications & Attributes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8125rem' }}>
                {Object.entries(attributes).map(([k, v]) => (
                  <div key={k}>
                    <span style={{ color: '#64748b' }}>{k}: </span>
                    <strong style={{ color: '#0f172a' }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {product.stockQuantity > 0 ? (
              <span className="badge badge-success" style={{ gap: '0.25rem' }}>
                <CheckCircle size={14} /> In Stock ({product.stockQuantity} available)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ gap: '0.25rem' }}>
                <AlertTriangle size={14} /> Out of Stock
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              SKU: {product.sku}
            </span>
          </div>

          {/* Add to cart section */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.625rem 0.875rem', fontWeight: 700, fontSize: '1rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 0.75rem', fontWeight: 600, minWidth: 32, textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                style={{ padding: '0.625rem 0.875rem', fontWeight: 700, fontSize: '1rem' }}
                disabled={product.stockQuantity <= quantity}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem 1.5rem', fontSize: '0.9375rem', opacity: product.stockQuantity <= 0 ? 0.5 : 1 }}
            >
              <ShoppingBag size={18} />
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
