using RetailManagement.Application.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Application.DTOs.Orders;

public class AddressDto
{
    public string RecipientName { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "USA";
}

public class CreateOrderItemDto
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CreateOrderDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }

    public FulfillmentType FulfillmentType { get; set; } = FulfillmentType.Delivery;
    public AddressDto? ShippingAddress { get; set; }

    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Card;
    public string? Notes { get; set; }

    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }

    public OrderStatus Status { get; set; }
    public FulfillmentType FulfillmentType { get; set; }
    public string? ShippingAddressJson { get; set; }

    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public PaymentStatus PaymentStatus { get; set; }
    public PaymentMethodType PaymentMethod { get; set; }
    public string? PaymentTransactionReference { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public List<OrderItemDto> Items { get; set; } = new();
}

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
    public string? CancellationReason { get; set; }
}

public class OrderFilterParams : QueryParameters
{
    public OrderStatus? Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
