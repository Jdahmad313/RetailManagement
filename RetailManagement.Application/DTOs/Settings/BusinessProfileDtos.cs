namespace RetailManagement.Application.DTOs.Settings;

public class BusinessProfileDto
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? LogoUrl { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public string TimeZone { get; set; } = "UTC";
    public decimal DefaultTaxRate { get; set; }
    public bool PricesIncludeTax { get; set; }
    public string InvoicePrefix { get; set; } = "INV-";
    public string ReceiptHeader { get; set; } = string.Empty;
    public string ReceiptFooter { get; set; } = string.Empty;
    public decimal DeliveryFee { get; set; }
    public decimal FreeDeliveryThreshold { get; set; }
    public bool AllowPickup { get; set; }
    public bool AllowDelivery { get; set; }
    public bool AllowNegativeStock { get; set; }
    public string OperatingHoursJson { get; set; } = string.Empty;
}

public class UpdateBusinessProfileDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? LogoUrl { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public string TimeZone { get; set; } = "UTC";
    public decimal DefaultTaxRate { get; set; }
    public bool PricesIncludeTax { get; set; }
    public string InvoicePrefix { get; set; } = "INV-";
    public string ReceiptHeader { get; set; } = string.Empty;
    public string ReceiptFooter { get; set; } = string.Empty;
    public decimal DeliveryFee { get; set; }
    public decimal FreeDeliveryThreshold { get; set; }
    public bool AllowPickup { get; set; }
    public bool AllowDelivery { get; set; }
    public bool AllowNegativeStock { get; set; }
    public string OperatingHoursJson { get; set; } = string.Empty;
}
