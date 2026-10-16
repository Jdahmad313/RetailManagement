# PROJECT CONTEXT: Mukhtar Bashir Merchant Karyana Store Management System

## 1. System Vision & Objectives
A production-ready retail management, point-of-sale, and e-commerce system specifically tailored for **Mukhtar Bashir Merchant Karyana Store** (located in Jurian, Hafizabad, Pakistan), while retaining flexible multi-vertical architecture:
1. **Storefront (E-Commerce)**:
   - Full village general store catalog featuring staple bulk items (flours, pulses, rice, nimko, biscuits, washing powders, beverages like Next Cola, Khilafat Cola, Coke, Pepsi).
   - Dynamic sorting, keyword search, category filters, and robust pagination.
   - Cash on Delivery (COD) and Direct Mobile Wallet (Easypaisa & Raast to `03446583468`).
2. **Point of Sale (POS)**:
   - Optimized for fast touch and keyboard operation.
   - Device camera barcode scanning via modern browser APIs and ZXing fallback.
   - Hardware scanner gun compatibility with instant SKU/barcode lookup.
   - Thermal receipt generation (80mm) and plaintext download.
3. **Admin Dashboard & Management Portal**:
   - Real-time gross and net profit margin calculations (Revenue - COGS - Expenses).
   - Universal mobile-responsive tables with sticky action buttons (Edit & Delete remain visible on mobile devices).
   - Stock ledger movement audit logs and stock adjustment modals.
   - In-store cashier creation and invitation dispatch via email.
   - Direct image upload from phone gallery or camera with automatic canvas compression (< 150KB).
4. **Security & User Management**:
   - ASP.NET Core Identity with role-based access control (`Admin`, `Manager`, `Cashier`, `Customer`).
   - Forgot Password via 6-digit OTP email verification with automatic session invalidation.

---

## 2. Store Profile & Default Identity
- **Business Name**: Mukhtar Bashir Merchant Karyana Store
- **Tagline**: Taza Karyana, Bulk Flours, Nimko & Village General Store
- **Address**: Jurian, Hafizabad, Punjab, Pakistan
- **Phone / WhatsApp**: `+923446583468`
- **Email**: `mukhtarbashirkaryana@gmail.com`
- **Currency**: Pakistani Rupee (`PKR`, symbol: `Rs.`)
- **Bank / Payment Description**: Easypaisa or Raast at `03446583468` (Share screenshot on same WhatsApp number)

---

## 3. Technology Stack & Architectural Decisions
- **Backend Architecture**: Clean Architecture inspired by SOLID principles.
  - `RetailManagement.Domain`: Pure domain entities, value objects, enums, soft delete interfaces.
  - `RetailManagement.Application`: Service contracts, DTOs, request validation, business rules, repository interfaces.
  - `RetailManagement.Infrastructure`: EF Core `AppDbContext`, Identity, JWT, EmailService (MailKit), OtpService.
  - `RetailManagement.API`: REST controllers, global exception middleware, CORS, rate limiting.
- **Frontend Architecture**:
  - `retail-management-client`: React 18, Vite, TypeScript, React Router 6, Lucide icons, Context API (`AuthContext`, `BusinessContext`, `CartContext`).
  - Mobile-responsive utilities: `.admin-table-container`, `.sticky-action-col`, `.sticky-action-header`, `.responsive-form-grid`.
- **Database**:
  - PostgreSQL / Supabase / Neon or SQL Server EF Core Code First.
  - Decimal monetary precision (`decimal(18,2)`), UTC timestamp tracking.
- **Additive Data Policy**:
  - Seeders never delete existing registered users, accounts, or custom products.

---

## 4. Key Endpoints & Flows
- **Auth**:
  - `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`
  - `POST /api/auth/forgot-password-initiate`: Dispatches 6-digit OTP email.
  - `POST /api/auth/reset-password-otp`: Verifies OTP and updates password.
  - `POST /api/auth/resend-forgot-password-otp`: Resends fresh OTP with rate limit.
- **Catalog**:
  - `GET /api/products?pageNumber=1&pageSize=12&sortBy=created&sortDirection=desc`
  - `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`
- **POS**:
  - `GET /api/products/barcode/{code}`, `POST /api/pos/sales`, `GET /api/pos/sales`
- **Reports & Dashboard**:
  - `GET /api/reports/dashboard-summary`, `GET /api/reports/inventory-valuation`
