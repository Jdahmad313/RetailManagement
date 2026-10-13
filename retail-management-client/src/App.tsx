import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Storefront Pages
import { HomePage } from './pages/store/HomePage';
import { CatalogPage } from './pages/store/CatalogPage';
import { ProductDetailPage } from './pages/store/ProductDetailPage';
import { CartPage } from './pages/store/CartPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { OrderConfirmationPage } from './pages/store/OrderConfirmationPage';
import { CustomerDashboardPage } from './pages/store/CustomerDashboardPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/auth/ProfilePage';

// Admin & POS Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { CashierDashboardPage } from './pages/admin/CashierDashboardPage';
import { PosTerminalPage } from './pages/pos/PosTerminalPage';
import { ProductsAdminPage } from './pages/admin/ProductsAdminPage';
import { CategoriesAdminPage } from './pages/admin/CategoriesAdminPage';
import { InventoryAdminPage } from './pages/admin/InventoryAdminPage';
import { OrdersAdminPage } from './pages/admin/OrdersAdminPage';
import { StaffAdminPage } from './pages/admin/StaffAdminPage';
import { ExpensesAdminPage } from './pages/admin/ExpensesAdminPage';
import { ReportsAdminPage } from './pages/admin/ReportsAdminPage';
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isCashier, isAdmin, isManager } = useAuth();
  
  if (!isAuthenticated && !localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />;
  }

  // Strictly block customers from accessing staff or admin suite
  if (!isAdmin && !isManager && !isCashier) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Storefront Routes */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/account" element={<CustomerDashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Admin & POS Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="cashier-shift" element={<CashierDashboardPage />} />
              <Route path="pos" element={<PosTerminalPage />} />
              <Route path="products" element={<ProductsAdminPage />} />
              <Route path="categories" element={<CategoriesAdminPage />} />
              <Route path="inventory" element={<InventoryAdminPage />} />
              <Route path="orders" element={<OrdersAdminPage />} />
              <Route path="staff" element={<StaffAdminPage />} />
              <Route path="expenses" element={<ExpensesAdminPage />} />
              <Route path="reports" element={<ReportsAdminPage />} />
              <Route path="settings" element={<SettingsAdminPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
