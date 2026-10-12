using RetailManagement.Domain.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Domain.Entities;

public class PosSale : AuditableEntity, ISoftDelete
{
    public string ReceiptNumber { get; set; } = string.Empty;

    public string CashierId { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }
    public virtual Customer? Customer { get; set; }
    public string CustomerName { get; set; } = "Walk-in Customer";

    public decimal SubTotal { get; set; } = 0.00m;
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal DiscountAmount { get; set; } = 0.00m;
    public decimal TotalAmount { get; set; } = 0.00m;

    public decimal AmountTendered { get; set; } = 0.00m;
    public decimal ChangeGiven { get; set; } = 0.00m;

    public bool IsReturned { get; set; } = false;
    public string? ReturnReason { get; set; }
    public DateTime? ReturnedAtUtc { get; set; }
    public string? ReturnedByCashierName { get; set; }

    public string? Notes { get; set; }

    public virtual ICollection<PosSaleItem> Items { get; set; } = new List<PosSaleItem>();
    public virtual ICollection<PosPayment> Payments { get; set; } = new List<PosPayment>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class PosSaleItem : BaseEntity
{
    public Guid PosSaleId { get; set; }
    public virtual PosSale PosSale { get; set; } = null!;

    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public Guid? VariantId { get; set; }
    public virtual ProductVariant? Variant { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; } = 0.00m;
    public decimal UnitCost { get; set; } = 0.00m;
    public int Quantity { get; set; } = 1;
    public decimal SubTotal { get; set; } = 0.00m;
    public decimal TaxRate { get; set; } = 0.00m;
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal DiscountAmount { get; set; } = 0.00m;
    public decimal Total { get; set; } = 0.00m;
}

public class PosPayment : BaseEntity
{
    public Guid PosSaleId { get; set; }
    public virtual PosSale PosSale { get; set; } = null!;

    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Cash;
    public decimal Amount { get; set; } = 0.00m;
    public string? TransactionReference { get; set; }
    public string? CardLastFour { get; set; }
}
