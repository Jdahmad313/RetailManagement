using RetailManagement.Domain.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Domain.Entities;

public class Order : AuditableEntity, ISoftDelete
{
    public string OrderNumber { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }
    public virtual Customer? Customer { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public FulfillmentType FulfillmentType { get; set; } = FulfillmentType.Delivery;

    public string? ShippingAddressJson { get; set; }
    public string? BillingAddressJson { get; set; }

    public decimal SubTotal { get; set; } = 0.00m;
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal ShippingFee { get; set; } = 0.00m;
    public decimal DiscountAmount { get; set; } = 0.00m;
    public decimal TotalAmount { get; set; } = 0.00m;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Card;
    public string? PaymentTransactionReference { get; set; }

    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }

    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public virtual Order Order { get; set; } = null!;

    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public Guid? VariantId { get; set; }
    public virtual ProductVariant? Variant { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; } = 0.00m;
    public decimal UnitCost { get; set; } = 0.00m; // For gross margin calculation
    public int Quantity { get; set; } = 1;
    public decimal SubTotal { get; set; } = 0.00m;
    public decimal TaxRate { get; set; } = 0.00m;
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal DiscountAmount { get; set; } = 0.00m;
    public decimal Total { get; set; } = 0.00m;
}
