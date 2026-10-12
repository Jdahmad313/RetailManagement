# PROJECT CONTEXT: Generic E-Commerce, Inventory, and POS Management System

## 1. System Vision & Objectives
A production-oriented, generic, multi-tenant capable, web-based retail management system combining:
1. Customer-Facing E-Commerce Storefront (React + TypeScript).
2. Admin Dashboard & Business Management Portal (React + TypeScript).
3. Touch & Keyboard-Friendly Point of Sale (POS) with receipt printing & split payments.
4. Product, Multi-attribute variants, Category, Pricing & Inventory Management.
5. Order Processing, Billing, Invoicing, Payment abstractions, and Returns.
6. Expense Tracking, Accounting estimates, and Financial Reports (COGS, Gross/Net profit).
7. Business Settings, Tenant Branding, Tax rules, Working hours, and Store settings.
8. Authentication, Authorization (RBAC), Auditing, and OWASP-compliant security.

The system is generic to support multiple retail verticals: clothing, general store, grocery, electronics, pharmacy, cosmetics, etc., configured via the admin portal rather than hardcoded logic.

## 2. Technology Stack & Architectural Decisions
- **Backend Architecture**: Clean Architecture inspired by SOLID principles.
  - `RetailManagement.Domain`: Pure domain entities, value objects, enums, domain exceptions. Zero external framework dependencies.
  - `RetailManagement.Application`: Service contracts, DTOs, request validation, business rules, repository interfaces, Unit of Work abstraction.
  - `RetailManagement.Infrastructure`: EF Core `AppDbContext`, SQL Server mapping, Entity configurations, Migrations, ASP.NET Core Identity, JWT authentication, Payment adapters, file storage.
  - `RetailManagement.API`: ASP.NET Core Web API controllers, centralized exception middleware, JWT/Cookie bearer auth, Swagger/OpenAPI, security headers, rate limiting.
- **Frontend Architecture**:
  - `retail-management-client`: React 18+, TypeScript, Vite, React Router, TailwindCSS/Lucide-react modular design system, Axios centralized HTTP client with interceptors, Context API / Zustand state stores.
  - Modular feature structure: `features/auth`, `features/products`, `features/categories`, `features/cart`, `features/checkout`, `features/orders`, `features/pos`, `features/inventory`, `features/expenses`, `features/reports`, `features/settings`.
- **Database**:
  - Microsoft SQL Server with EF Core Code First.
  - UTC timestamps, soft deletes, concurrency tokens (`RowVersion`), decimal monetary precision (`decimal(18,2)`), non-clustered indexes on frequent queries.
- **Response Contract**:
  - Unified `ApiResponse<T>`: `{ success: bool, message: string, data: T, errors: object?, timestamp: DateTime, traceId: string }`.
  - Paginated `PagedResponse<T>`: `{ items: IEnumerable<T>, pageNumber: int, pageSize: int, totalCount: int, totalPages: int, hasPrevious: bool, hasNext: bool }`.
- **Security**:
  - BCrypt/Identity password hashing, JWT access token + secure rotating refresh tokens.
  - Role-based access control (`Admin`, `Manager`, `Cashier`, `Customer`).
  - Auditing on sensitive administrative actions and inventory changes.
