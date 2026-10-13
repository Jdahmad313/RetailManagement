namespace RetailManagement.Application.DTOs.Reports;

public class TopSellingProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class SalesTrendDto
{
    public string Date { get; set; } = string.Empty;
    public decimal OnlineSales { get; set; }
    public decimal PosSales { get; set; }
    public decimal TotalSales { get; set; }
    public int TransactionCount { get; set; }
}

public class DashboardSummaryDto
{
    public decimal SalesToday { get; set; }
    public decimal SalesThisMonth { get; set; }
    public int OrdersToday { get; set; }
    public int OrdersThisMonth { get; set; }
    public int PosTransactionsCount { get; set; }
    public int OnlineOrdersCount { get; set; }

    public int TotalProducts { get; set; }
    public int LowStockProductsCount { get; set; }

    public decimal ExpensesThisMonth { get; set; }
    public decimal EstimatedGrossProfitThisMonth { get; set; }
    public decimal EstimatedNetProfitThisMonth { get; set; }

    public List<SalesTrendDto> SalesTrend { get; set; } = new();
    public List<TopSellingProductDto> TopProducts { get; set; } = new();
}

public class InventoryValuationDto
{
    public int TotalUniqueItems { get; set; }
    public int TotalStockOnHand { get; set; }
    public decimal TotalCostValue { get; set; }
    public decimal TotalRetailValue { get; set; }
    public decimal PotentialProfit => TotalRetailValue - TotalCostValue;
}

public class ProductMonthlyBucketDto
{
    public int Month { get; set; } // 1 - 12
    public string MonthName { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }
}

public class ProductYearlyAnalyticsDto
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int TotalUnitsSold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalGrossProfit { get; set; }
    public List<ProductMonthlyBucketDto> MonthlySales { get; set; } = new();
}

public class ProductAuditLogDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public decimal? OldSellingPrice { get; set; }
    public decimal? NewSellingPrice { get; set; }
    public decimal? OldPurchaseCost { get; set; }
    public decimal? NewPurchaseCost { get; set; }
    public int? OldStock { get; set; }
    public int? NewStock { get; set; }
    public string ChangeSummary { get; set; } = string.Empty;
    public string? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
