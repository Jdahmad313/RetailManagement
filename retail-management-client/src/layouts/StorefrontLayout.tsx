import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Store, ShieldCheck, User as UserIcon, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, ApiResponse } from '../types';
import { apiClient } from '../api/client';

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout, isCashier, isAdmin } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings')
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '0.5rem 0', fontSize: '0.8125rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>📍 {profile?.address || 'Storefront & Online Dispatch'}</span>
            <span style={{ margin: '0 0.75rem' }}>|</span>
            <span>📞 {profile?.phone || '+1 (555) 234-5678'}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {(isCashier || isAdmin) && (
              <Link to="/admin" style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> Staff Portal
              </Link>
            )}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#f8fafc' }}>Hello, {user?.fullName}</span>
                <button onClick={() => logout()} style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserIcon size={14} /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', gap: '2rem' }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {profile?.businessName || 'Apex Retail'}
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {profile?.tagline || 'Modern Commerce & Everyday Essentials'}
              </p>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: 500, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products by title, SKU, brand, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 2.5rem 0.625rem 1rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            >
              <Search size={18} />
            </button>
          </form>

          {/* Nav Links & Cart */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/" style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Home</Link>
            <Link to="/catalog" style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Catalog</Link>
            
            <Link
              to="/cart"
              className="btn btn-primary"
              style={{ position: 'relative', padding: '0.5rem 1rem', borderRadius: '9999px' }}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              {itemCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    padding: '0.1rem 0.4rem',
                    marginLeft: '0.25rem',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        <Outlet />
      </main>

      {/* Store Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#cbd5e1', padding: '3rem 0 1.5rem', marginTop: 'auto' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {profile?.businessName || 'Apex Retail'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Unified multi-channel retail system. High inventory accuracy, transparent pricing, and instant in-store POS checkout.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Contact & Location
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                {profile?.address}<br />
                {profile?.email}<br />
                {profile?.phone}
              </p>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Customer Care
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Returns accepted within 14 days.<br />
                Free delivery on orders over ${profile?.freeDeliveryThreshold || 75.0}.<br />
                Currency: {profile?.currencyCode} ({profile?.currencySymbol})
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <div>© {new Date().getFullYear()} {profile?.businessName || 'Apex Retail'}. All rights reserved.</div>
            <div>Powered by Clean Architecture ASP.NET Core & React TypeScript</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
