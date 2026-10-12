using RetailManagement.Domain.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Domain.Entities;

public class Supplier : AuditableEntity, ISoftDelete
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class PurchaseOrder : AuditableEntity, ISoftDelete
{
    public string PurchaseOrderNumber { get; set; } = string.Empty;

    public Guid SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;

    public DateTime OrderDateUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDateUtc { get; set; }
    public DateTime? ReceivedDateUtc { get; set; }

    public decimal SubTotal { get; set; } = 0.00m;
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal TotalAmount { get; set; } = 0.00m;

    public string? Notes { get; set; }

    public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class PurchaseOrderItem : BaseEntity
{
    public Guid PurchaseOrderId { get; set; }
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public Guid? VariantId { get; set; }
    public virtual ProductVariant? Variant { get; set; }

    public int QuantityOrdered { get; set; } = 1;
    public int QuantityReceived { get; set; } = 0;
    public decimal UnitCost { get; set; } = 0.00m;
    public decimal Total { get; set; } = 0.00m;
}
