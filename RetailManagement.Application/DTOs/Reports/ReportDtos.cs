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
