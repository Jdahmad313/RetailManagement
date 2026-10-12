export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
  timestamp: string;
  traceId: string;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
  parentCategoryName?: string;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  priceOverride?: number;
  stockQuantity: number;
  attributesJson?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  unit: string;
  categoryId: string;
  categoryName: string;
  purchaseCost: number;
  sellingPrice: number;
  discountPrice?: number;
  customTaxRate?: number;
  effectivePrice: number;
  stockQuantity: number;
  reorderThreshold: number;
  isLowStock: boolean;
  imageUrl?: string;
  additionalImagesJson?: string;
  attributesJson?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAtUtc: string;
  variants: ProductVariant[];
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  taxAmount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: number; // 0=Pending, 1=Confirmed, 2=Processing, 3=ReadyForPickup, 4=OutForDelivery, 5=Completed, 6=Cancelled, 7=Returned
  fulfillmentType: number; // 0=Delivery, 1=Pickup
  shippingAddressJson?: string;
  subTotal: number;
  taxAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: number;
  paymentMethod: number;
  paymentTransactionReference?: string;
  notes?: string;
  createdAtUtc: string;
  items: OrderItem[];
}

export interface PosSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface PosPayment {
  paymentMethod: number;
  amount: number;
  transactionReference?: string;
  cardLastFour?: string;
}

export interface PosSale {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountTendered: number;
  changeGiven: number;
  isReturned: boolean;
  returnReason?: string;
  returnedAtUtc?: string;
  createdAtUtc: string;
  items: PosSaleItem[];
  payments: PosPayment[];
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  variantName?: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  movementType: number;
  referenceType?: string;
  referenceId?: string;
  unitCost: number;
  reason?: string;
  performedByUserName?: string;
  createdAtUtc: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  expenseCount: number;
  totalAmount: number;
}

export interface Expense {
  id: string;
  expenseCategoryId: string;
  categoryName: string;
  title: string;
  amount: number;
  expenseDateUtc: string;
  paymentMethod: number;
  description?: string;
  receiptAttachmentUrl?: string;
  recordedByUserName?: string;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  totalRevenue: number;
}

export interface SalesTrend {
  date: string;
  onlineSales: number;
  posSales: number;
  totalSales: number;
  transactionCount: number;
}

export interface DashboardSummary {
  salesToday: number;
  salesThisMonth: number;
  ordersToday: number;
  ordersThisMonth: number;
  posTransactionsCount: number;
  onlineOrdersCount: number;
  totalProducts: number;
  lowStockProductsCount: number;
  expensesThisMonth: number;
  estimatedGrossProfitThisMonth: number;
  estimatedNetProfitThisMonth: number;
  salesTrend: SalesTrend[];
  topProducts: TopSellingProduct[];
}

export interface InventoryValuation {
  totalUniqueItems: number;
  totalStockOnHand: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  currencyCode: string;
  currencySymbol: string;
  timeZone: string;
  defaultTaxRate: number;
  pricesIncludeTax: boolean;
  invoicePrefix: string;
  receiptHeader: string;
  receiptFooter: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  allowPickup: boolean;
  allowDelivery: boolean;
  allowNegativeStock: boolean;
  operatingHoursJson: string;
}
