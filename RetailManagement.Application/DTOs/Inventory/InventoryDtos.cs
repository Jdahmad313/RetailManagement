using RetailManagement.Domain.Enums;

namespace RetailManagement.Application.DTOs.Inventory;

public class StockAdjustmentDto
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int QuantityChange { get; set; } // positive or negative
    public InventoryMovementType MovementType { get; set; } = InventoryMovementType.AdjustmentAddition;
    public string? Reason { get; set; }
}

public class InventoryMovementDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }

    public int QuantityChange { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }

    public InventoryMovementType MovementType { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public decimal UnitCost { get; set; }
    public string? Reason { get; set; }
    public string? PerformedByUserName { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
