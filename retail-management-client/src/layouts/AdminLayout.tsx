import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout, isCashier, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'POS Terminal', path: '/admin/pos', icon: ShoppingCart },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Inventory & Stock', path: '/admin/inventory', icon: ArrowLeftRight },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Apex Portal</h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Admin & POS Suite</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '0 0.75rem 0.5rem', letterSpacing: '0.05em' }}>
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: 32, height: 32, borderRadius: '9999px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={16} color="#94a3b8" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.fullName || 'Staff User'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>
                  {user?.roles?.[0] || 'Staff'}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} title="Log Out" style={{ color: '#ef4444', padding: '0.25rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <header
          style={{
            height: 60,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Store Management</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {navItems.find((n) => n.path === location.pathname)?.label || 'Console'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
            >
              <Store size={14} /> View Storefront
            </Link>
          </div>
        </header>

        {/* Content Viewport */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
