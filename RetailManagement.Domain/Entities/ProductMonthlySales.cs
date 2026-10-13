using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class ProductMonthlySales : BaseEntity
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public int Year { get; set; }
    public int Month { get; set; } // 1 - 12
    public int UnitsSold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal GrossProfit { get; set; }
    public DateTime LastSaleDateUtc { get; set; }
}
