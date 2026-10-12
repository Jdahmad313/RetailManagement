# Apex Retail Management System

A production-oriented, generic, multi-tenant capable, web-based retail management system combining:
1. **Customer-Facing E-Commerce Website** (React + TypeScript)
2. **Admin Dashboard & Business Management Portal** (React + TypeScript)
3. **Point of Sale (POS) System** with barcode scanning, split payments, and thermal receipts
4. **Inventory & Stock Movement Ledger** with audit logging and negative stock controls
5. **Orders, Invoicing, Billing, and Payments Abstraction**
6. **Expense Tracking & Financial Reporting** (COGS, Gross Margin, Net Operating Result)
7. **Business Branding & Configurable Retail Settings**
8. **ASP.NET Core Identity & JWT Authentication with Rotating Refresh Tokens**

---

## 🛠 Technology Stack

### Backend
- **Framework**: C# / ASP.NET Core 8.0 Web API
- **Architecture**: Clean Architecture & SOLID Principles
  - `RetailManagement.Domain`: Entities, Enums, Value Objects, Domain Exceptions
  - `RetailManagement.Application`: Service Contracts, DTOs, Repository Abstractions, Unit of Work
  - `RetailManagement.Infrastructure`: EF Core `RetailDbContext`, SQL Server, Identity, Repositories, Mock Payment Gateway
  - `RetailManagement.API`: Controllers, JWT Bearer Authentication, Swagger OpenAPI, Centralized Exception Handling Middleware
- **Database**: Microsoft SQL Server with EF Core Code First Migrations
- **Security**: BCrypt/Identity Password Hasher, JWT Access Token (2h) + Secure Rotating Refresh Tokens (7d)
- **Testing**: xUnit, Moq, EF Core In-Memory

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios with centralized Bearer token interceptor and automatic token renewal
- **Icons & Styling**: Lucide Icons, responsive styling, print-friendly thermal receipt styles

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **.NET 8 SDK**: Installed at `C:\Users\AL-Syed\.gemini\antigravity\scratch\dotnet` (or system PATH)
- **Node.js (v20+) & npm**: Installed at `C:\Users\AL-Syed\tools\nodejs` (or system PATH)
- **Microsoft SQL Server**: Local instance (`MSSQLSERVER` or LocalDB)

### 2. Configure Database Connection
In `RetailManagement.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RetailManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "SuperSecretKeyForRetailManagementSystemDev2026!ApexSecureKeyMustBe256BitsLong",
    "Issuer": "RetailManagementAPI",
    "Audience": "RetailManagementClient"
  }
}
```

### 3. Run Database Migrations
Migrations are applied automatically when the API starts up. To apply manually:
```powershell
dotnet ef database update --project RetailManagement.Infrastructure --startup-project RetailManagement.API
```

### 4. Start Backend API
```powershell
cd RetailManagement.API
dotnet run --urls "http://localhost:5000"
```
- **Swagger Documentation**: `http://localhost:5000/swagger`
- **Base API Endpoint**: `http://localhost:5000/api/v1`

### 5. Start React Frontend Client
```powershell
cd retail-management-client
npm install
npm run dev
```
- Open your browser at: `http://localhost:5173`

---

## 👥 Preloaded Demo Credentials

On initial startup, `DatabaseSeeder` seeds the following accounts:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@retail.local` | `Admin@123456` | Full Access: Dashboard, Products, Inventory, Orders, Expenses, Reports, Settings |
| **Store Cashier** | `cashier@retail.local` | `Cashier@123456` | In-Store POS Checkout, Receipts, Returns, Orders in progress |
| **Customer** | `customer@retail.local` | `Customer@123456` | Storefront Catalog, Shopping Cart, Online Checkout & Order History |

*Tip: The Sign In page includes 1-click quick fill buttons for each account.*

---

## 📦 Core Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /register`: Create customer account
- `POST /login`: JWT access token & rotating refresh token
- `POST /refresh-token`: Renew expired access token
- `POST /logout`: Invalidate refresh token session
- `GET /me`: Authenticated user profile

### Catalog (`/api/v1/products`, `/api/v1/categories`)
- `GET /products`: Filterable, searchable, and paginated product list
- `GET /products/{id}`: Single product details with variants & attributes
- `GET /products/barcode/{barcode}`: Fast scanner lookup for POS terminal
- `POST /products`: Add product (Admin/Manager)
- `PUT /products/{id}`: Update product & prices (Admin/Manager)
- `DELETE /products/{id}`: Soft delete preserving transaction history (Admin)

### Point of Sale (`/api/v1/pos`)
- `POST /pos/sale`: Complete register checkout (Cash, Card, or Split payments, instant stock deduction)
- `GET /pos/receipt/{receiptNumber}`: Retrieve full formatted receipt data
- `GET /pos/sales`: Filterable POS sales history
- `POST /pos/sale/{id}/return`: Process return, refund, and stock restocking

### Orders & E-Commerce (`/api/v1/orders`)
- `POST /orders`: Authoritative checkout calculation, stock deduction, and order placement
- `GET /orders/{id}`: Retrieve order details
- `GET /orders/number/{orderNumber}`: Customer order tracking view
- `PUT /orders/{id}/status`: Workflow state updates (Confirmed → Processing → OutForDelivery → Completed / Cancelled with automatic restocking)

### Inventory & Movements (`/api/v1/inventory`)
- `GET /inventory/movements`: Full stock audit ledger
- `POST /inventory/adjust`: Manual adjustments (Addition, Deduction, Damage write-off)
- `GET /inventory/low-stock-alerts`: List products below reorder thresholds

### Financial Reports & Analytics (`/api/v1/reports`, `/api/v1/expenses`)
- `GET /reports/dashboard-summary`: Real-time sales, order counts, channel split, COGS, gross & net profit
- `GET /reports/inventory-valuation`: Total physical units, cost valuation, retail valuation, and potential markup
- `GET /expenses`: Filtered operating expense ledger
- `POST /expenses`: Record business expense

### Business Settings & Branding (`/api/v1/businesssettings`)
- `GET /businesssettings`: Configured store profile, branding, tax rates, delivery fees, receipt headers
- `PUT /businesssettings`: Persist updated identity and retail settings

---

## 🧪 Running Automated Tests
```powershell
cd RetailManagement
dotnet test
```
Verifies payment processing, authoritative order totals, POS split payments, inventory movement transitions, and financial COGS calculations.
