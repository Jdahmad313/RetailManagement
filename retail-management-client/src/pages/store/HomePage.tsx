import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Truck, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import { Product, Category, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<{ items: Product[] }>>('/products?isFeatured=true&pageSize=8'),
      apiClient.get<ApiResponse<Category[]>>('/categories'),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data.success) {
          setFeaturedProducts(prodRes.data.data?.items || []);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '4rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1rem' }}>
              <Tag size={14} /> Multi-Channel Generic Retail System
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
              Everyday Essentials, Premium Quality & Modern Convenience.
            </h1>
            <p style={{ fontSize: '1.0625rem', color: '#bfdbfe', lineHeight: 1.6, marginBottom: '2rem' }}>
              Browse our diverse multi-category catalog across Electronics, Apparel, Organics, Pharmacy, and Home Living with authoritative real-time inventory.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/catalog" className="btn btn-primary" style={{ backgroundColor: '#ffffff', color: '#1e3a8a', padding: '0.75rem 1.75rem' }}>
                <ShoppingBag size={18} /> Shop Catalog
              </Link>
              <Link to="/catalog" className="btn btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', padding: '0.75rem 1.75rem' }}>
                Explore Categories <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80"
              alt="Retail Storefront"
              style={{ width: '100%', maxWidth: 480, height: 320, objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
            />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Express Delivery</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Free shipping on orders over $75</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Stock Guarantee</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Synchronized POS & online inventory</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Easy 14-Day Returns</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Hassle-free refund with receipt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="container" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Browse by Category</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Explore our configured industry departments</p>
          </div>
          <Link to="/catalog" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalog?category=${c.id}`}
              className="card"
              style={{
                padding: '1rem',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'block',
              }}
            >
              <img
                src={c.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                alt={c.name}
                style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.75rem' }}
              />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{c.name}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.productCount} Items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Featured Products</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Hand-picked top sellers from across departments</p>
          </div>
          <Link to="/catalog" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb' }}>
            Full Catalog & Filters →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading products...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {featuredProducts.map((p) => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <img
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                    alt={p.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  {p.discountPrice && (
                    <span
                      className="badge badge-danger"
                      style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}
                    >
                      SALE
                    </span>
                  )}
                  {p.stockQuantity <= 0 && (
                    <span
                      className="badge badge-warning"
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                    >
                      Out of Stock
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  {p.categoryName} {p.brand && `• ${p.brand}`}
                </div>

                <Link
                  to={`/product/${p.id}`}
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0.25rem 0 0.5rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.name}
                </Link>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                      ${p.effectivePrice.toFixed(2)}
                    </span>
                    {p.discountPrice && (
                      <span style={{ fontSize: '0.8125rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                        ${p.sellingPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(p, 1)}
                    disabled={p.stockQuantity <= 0}
                    className="btn btn-primary"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8125rem',
                      opacity: p.stockQuantity <= 0 ? 0.5 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
