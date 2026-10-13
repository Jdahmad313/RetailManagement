import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Store,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Phone,
  MessageCircle,
  MessageSquarePlus,
  Menu,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, ApiResponse } from '../types';
import { apiClient } from '../api/client';
import { FeedbackModal } from '../components/FeedbackModal';

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout, isCashier, isAdmin } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
      setMobileMenuOpen(false);
    }
  };

  const rawPhone = profile?.whatsAppNumber || profile?.phone || '+15550192834';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '0.5rem 0', fontSize: '0.8125rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>📍 {profile?.address || 'Storefront & Online Dispatch'}</span>
            <span style={{ display: 'none', margin: '0 0.5rem' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              📞 <a href={`tel:${profile?.phone || '+15550192834'}`} style={{ color: '#cbd5e1' }}>{profile?.phone || '+1 (555) 019-2834'}</a>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAdmin ? (
              <Link to="/admin" style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> Admin Portal
              </Link>
            ) : isCashier ? (
              <Link to="/admin/pos" style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> POS Terminal
              </Link>
            ) : null}

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/account" style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  📦 My Orders
                </Link>
                <Link to="/profile" style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  👤 Profile
                </Link>
                <button
                  onClick={() => logout()}
                  style={{ background: 'none', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
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
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', gap: '1rem' }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: 0 }}>
                {profile?.businessName || 'Apex Retail'}
              </h1>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0 0' }}>
                {profile?.tagline || 'Everyday Essentials & Quality Store'}
              </p>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="desktop-search" style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products by name, SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 2.25rem 0.55rem 1rem',
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
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
            </button>
          </form>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/" style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Home</Link>
            <Link to="/catalog" style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Catalog</Link>

            <button
              onClick={() => setFeedbackOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <MessageSquarePlus size={16} /> Feedback
            </button>

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

          {/* Mobile Actions: Cart & Hamburger Toggle */}
          <div className="mobile-actions" style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/cart"
              style={{ position: 'relative', color: '#0f172a', padding: '0.25rem' }}
            >
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    padding: '0.1rem 0.35rem',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '0.25rem' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="submit"
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b' }}
              >
                <Search size={16} />
              </button>
            </form>

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', padding: '0.25rem 0' }}
            >
              Home
            </Link>
            <Link
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', padding: '0.25rem 0' }}
            >
              All Catalog
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', padding: '0.25rem 0' }}
                >
                  📦 My Orders & Invoices
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', padding: '0.25rem 0' }}
                >
                  👤 Profile & Security
                </Link>
              </>
            )}
            <button
              onClick={() => { setFeedbackOpen(true); setMobileMenuOpen(false); }}
              style={{ background: 'none', border: 'none', textAlign: 'left', fontWeight: 600, color: '#0f172a', padding: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <MessageSquarePlus size={16} /> Leave Feedback & Suggestion
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        <Outlet />
      </main>

      {/* Floating Contact & WhatsApp Widget */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 90 }}>
        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${cleanPhone}?text=Hello%20Apex%20Retail,%20I%20have%20an%20inquiry%20regarding%20products.`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
          style={{
            width: 48,
            height: 48,
            borderRadius: '9999px',
            backgroundColor: '#22c55e',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
            transition: 'transform 0.15s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={26} />
        </a>

        {/* Call Button */}
        <a
          href={`tel:${profile?.phone || '+15550192834'}`}
          title="Call Customer Support"
          style={{
            width: 48,
            height: 48,
            borderRadius: '9999px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
            transition: 'transform 0.15s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Phone size={22} />
        </a>
      </div>

      {/* Store Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#cbd5e1', padding: '3rem 0 1.5rem', marginTop: 'auto' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {profile?.businessName || 'Apex Retail'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Modern verified e-commerce retail store with real-time stock, premium products, and fast home delivery.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Contact & Support
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                📍 {profile?.address}<br />
                ✉️ {profile?.email}<br />
                📞 {profile?.phone}<br />
                💬 WhatsApp: {profile?.whatsAppNumber || profile?.phone}
              </p>
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Help & Community
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <button
                  onClick={() => setFeedbackOpen(true)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#38bdf8', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  💡 Send Suggestion or Feedback
                </button>
                <span style={{ color: '#94a3b8' }}>Free delivery above {profile?.currencySymbol}{profile?.freeDeliveryThreshold || 75.0}</span>
                <span style={{ color: '#94a3b8' }}>14-day hassle-free in-store returns</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
            <div>© {new Date().getFullYear()} {profile?.businessName || 'Apex Retail'}. All rights reserved.</div>
            <div>Powered by ASP.NET Core Clean Architecture & React TypeScript</div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
};
