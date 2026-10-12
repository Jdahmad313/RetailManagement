using RetailManagement.Application.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Application.DTOs.Pos;

public class CreatePosSaleItemDto
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal? CustomUnitPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0.00m;
}

public class CreatePosPaymentDto
{
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Cash;
    public decimal Amount { get; set; }
    public string? TransactionReference { get; set; }
    public string? CardLastFour { get; set; }
}

public class CreatePosSaleDto
{
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = "Walk-in Customer";
    public decimal GlobalDiscountAmount { get; set; } = 0.00m;
    public decimal AmountTendered { get; set; } = 0.00m;
    public string? Notes { get; set; }

    public List<CreatePosSaleItemDto> Items { get; set; } = new();
    public List<CreatePosPaymentDto> Payments { get; set; } = new();
}

public class PosSaleItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
}

public class PosPaymentDto
{
    public PaymentMethodType PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionReference { get; set; }
    public string? CardLastFour { get; set; }
}

public class PosSaleDto
{
    public Guid Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string CashierId { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;

    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountTendered { get; set; }
    public decimal ChangeGiven { get; set; }

    public bool IsReturned { get; set; }
    public string? ReturnReason { get; set; }
    public DateTime? ReturnedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public List<PosSaleItemDto> Items { get; set; } = new();
    public List<PosPaymentDto> Payments { get; set; } = new();
}

public class ReturnSaleDto
{
    public string Reason { get; set; } = "Customer return";
}

public class PosSaleFilterParams : QueryParameters
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? CashierId { get; set; }
}
