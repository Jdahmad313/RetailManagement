using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class ProductAuditLog : BaseEntity
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "Created", "PriceUpdated", "CostUpdated", "StockAdjusted", "InfoUpdated"
    public decimal? OldSellingPrice { get; set; }
    public decimal? NewSellingPrice { get; set; }
    public decimal? OldPurchaseCost { get; set; }
    public decimal? NewPurchaseCost { get; set; }
    public int? OldStock { get; set; }
    public int? NewStock { get; set; }
    public string ChangeSummary { get; set; } = string.Empty;
    public string? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
}
