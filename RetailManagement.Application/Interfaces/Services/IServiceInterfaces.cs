using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Auth;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.DTOs.Expenses;
using RetailManagement.Application.DTOs.Inventory;
using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Application.DTOs.Pos;
using RetailManagement.Application.DTOs.Reports;
using RetailManagement.Application.DTOs.Settings;

namespace RetailManagement.Application.Interfaces.Services;

public interface IAuthService
{
    Task<TokenResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<TokenResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default);
    Task RevokeTokenAsync(string token, CancellationToken ct = default);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default);
    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto, CancellationToken ct = default);
    Task<CategoryDto> UpdateAsync(UpdateCategoryDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IProductService
{
    Task<PagedResponse<ProductDto>> GetPagedAsync(ProductFilterParams filter, CancellationToken ct = default);
    Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductDto> GetBySkuAsync(string sku, CancellationToken ct = default);
    Task<ProductDto> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
    Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default);
    Task<ProductDto> UpdateAsync(UpdateProductDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IInventoryService
{
    Task<PagedResponse<InventoryMovementDto>> GetMovementsAsync(Guid? productId, QueryParameters filter, CancellationToken ct = default);
    Task<ProductDto> AdjustStockAsync(StockAdjustmentDto dto, string? userId, string? userName, CancellationToken ct = default);
    Task<IReadOnlyList<ProductDto>> GetLowStockAlertsAsync(CancellationToken ct = default);
}

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderDto dto, string? userId, CancellationToken ct = default);
    Task<OrderDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<OrderDto> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default);
    Task<PagedResponse<OrderDto>> GetPagedOrdersAsync(OrderFilterParams filter, CancellationToken ct = default);
    Task<OrderDto> UpdateStatusAsync(Guid id, UpdateOrderStatusDto dto, CancellationToken ct = default);
}

public interface IPosService
{
    Task<PosSaleDto> ProcessSaleAsync(CreatePosSaleDto dto, string cashierId, string cashierName, CancellationToken ct = default);
    Task<PosSaleDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PosSaleDto> GetByReceiptNumberAsync(string receiptNumber, CancellationToken ct = default);
    Task<PagedResponse<PosSaleDto>> GetPagedSalesAsync(PosSaleFilterParams filter, CancellationToken ct = default);
    Task<PosSaleDto> ReturnSaleAsync(Guid id, ReturnSaleDto dto, string cashierName, CancellationToken ct = default);
}

public interface IExpenseService
{
    Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<ExpenseCategoryDto> CreateCategoryAsync(CreateExpenseCategoryDto dto, CancellationToken ct = default);
    Task<PagedResponse<ExpenseDto>> GetPagedExpensesAsync(ExpenseFilterParams filter, CancellationToken ct = default);
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, string? userId, string? userName, CancellationToken ct = default);
    Task DeleteExpenseAsync(Guid id, CancellationToken ct = default);
}

public interface IReportService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default);
    Task<InventoryValuationDto> GetInventoryValuationAsync(CancellationToken ct = default);
}

public interface IBusinessSettingsService
{
    Task<BusinessProfileDto> GetSettingsAsync(CancellationToken ct = default);
    Task<BusinessProfileDto> UpdateSettingsAsync(UpdateBusinessProfileDto dto, CancellationToken ct = default);
}
