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
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin & POS Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { PosTerminalPage } from './pages/pos/PosTerminalPage';
import { ProductsAdminPage } from './pages/admin/ProductsAdminPage';
import { CategoriesAdminPage } from './pages/admin/CategoriesAdminPage';
import { InventoryAdminPage } from './pages/admin/InventoryAdminPage';
import { OrdersAdminPage } from './pages/admin/OrdersAdminPage';
import { ExpensesAdminPage } from './pages/admin/ExpensesAdminPage';
import { ReportsAdminPage } from './pages/admin/ReportsAdminPage';
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isCashier, isAdmin } = useAuth();
  if (!isAuthenticated && !localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />;
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
              <Route path="pos" element={<PosTerminalPage />} />
              <Route path="products" element={<ProductsAdminPage />} />
              <Route path="categories" element={<CategoriesAdminPage />} />
              <Route path="inventory" element={<InventoryAdminPage />} />
              <Route path="orders" element={<OrdersAdminPage />} />
              <Route path="expenses" element={<ExpensesAdminPage />} />
              <Route path="reports" element={<ReportsAdminPage />} />
              <Route path="settings" element={<SettingsAdminPage />} />
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
