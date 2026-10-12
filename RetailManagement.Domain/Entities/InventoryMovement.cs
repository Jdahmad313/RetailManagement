using RetailManagement.Domain.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Domain.Entities;

public class InventoryMovement : BaseEntity
{
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public Guid? VariantId { get; set; }
    public virtual ProductVariant? Variant { get; set; }

    public int QuantityChange { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }

    public InventoryMovementType MovementType { get; set; }
    public string? ReferenceType { get; set; } // "Order", "PosSale", "PurchaseOrder", "ManualAdjustment"
    public string? ReferenceId { get; set; }

    public decimal UnitCost { get; set; } = 0.00m;
    public string? Reason { get; set; }

    public string? PerformedByUserId { get; set; }
    public string? PerformedByUserName { get; set; }
}
