import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ArrowLeftRight,
  ClipboardList,
  Receipt,
  BarChart3,
  Settings,
  Store,
  LogOut,
  User as UserIcon,
  Users,
  Menu,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout, isCashier, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Restrict cashiers to POS Terminal, Shift Dashboard, and Profile only
  useEffect(() => {
    if (!isAdmin && !isManager && isCashier) {
      const allowedCashierPaths = ['/admin/pos', '/admin/cashier-shift', '/admin/profile'];
      if (!allowedCashierPaths.includes(location.pathname)) {
        navigate('/admin/cashier-shift', { replace: true });
      }
    }
  }, [location.pathname, isAdmin, isManager, isCashier, navigate]);

  const allNavItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, adminOnly: true },
    { label: 'Shift Summary', path: '/admin/cashier-shift', icon: BarChart3, adminOnly: false },
    { label: 'POS Terminal', path: '/admin/pos', icon: ShoppingCart, adminOnly: false },
    { label: 'Products', path: '/admin/products', icon: Package, adminOnly: true },
    { label: 'Categories', path: '/admin/categories', icon: Layers, adminOnly: true },
    { label: 'Inventory & Stock', path: '/admin/inventory', icon: ArrowLeftRight, adminOnly: true },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList, adminOnly: true },
    { label: 'Staff & Cashiers', path: '/admin/staff', icon: Users, adminOnly: true },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt, adminOnly: true },
    { label: 'Customer Feedback', path: '/admin/feedback', icon: MessageSquare, adminOnly: true },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3, adminOnly: true },
    { label: 'Settings', path: '/admin/settings', icon: Settings, adminOnly: true },
    { label: 'Profile & Security', path: '/admin/profile', icon: UserIcon, adminOnly: false },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (isAdmin || isManager) return true;
    return !item.adminOnly;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative' }}>
      {/* Sidebar Overlay on mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 45, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Apex Portal</h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {isAdmin ? 'Admin Portal' : 'Cashier Suite'}
              </span>
            </div>
          </div>
          {mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu"
              style={{ color: '#94a3b8', background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '0 0.75rem 0.5rem', letterSpacing: '0.05em' }}>
            {isAdmin ? 'Admin Modules' : 'POS Access'}
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? '#1d4ed8' : 'transparent',
                  marginBottom: '0.25rem',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer in Sidebar */}
        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', backgroundColor: '#090d16' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              to="/admin/profile"
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden', textDecoration: 'none' }}
              title="Edit Profile & Password"
            >
              <div style={{ width: 32, height: 32, borderRadius: '9999px', backgroundColor: '#1e293b', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={16} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.fullName || 'Staff User'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                  {user?.roles?.join(', ') || 'Staff'} • Settings
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{ color: '#ef4444', padding: '0.35rem', borderRadius: '0.25rem' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{ height: 60, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="admin-mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              Apex Retail Management Suite
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/"
              style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
            >
              View Public Storefront →
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
