using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class BusinessProfile : AuditableEntity
{
    public string BusinessName { get; set; } = "Apex Retail";
    public string? Tagline { get; set; } = "Quality Products, Unmatched Service";
    public string? LogoUrl { get; set; }
    public string Address { get; set; } = "123 Commercial Boulevard";
    public string Phone { get; set; } = "+1 (555) 019-2834";
    public string Email { get; set; } = "contact@apexretail.local";
    public string CurrencyCode { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public string TimeZone { get; set; } = "UTC";
    public decimal DefaultTaxRate { get; set; } = 8.5m; // 8.5%
    public bool PricesIncludeTax { get; set; } = false;
    public string InvoicePrefix { get; set; } = "INV-";
    public string ReceiptHeader { get; set; } = "Welcome to Apex Retail";
    public string ReceiptFooter { get; set; } = "Thank you for shopping with us! Returns accepted within 14 days with original receipt.";
    public decimal DeliveryFee { get; set; } = 5.00m;
    public decimal FreeDeliveryThreshold { get; set; } = 75.00m;
    public bool AllowPickup { get; set; } = true;
    public bool AllowDelivery { get; set; } = true;
    public bool AllowNegativeStock { get; set; } = false;
    public string? WhatsAppNumber { get; set; } = "+1 (555) 019-2834";
    public string EnabledPaymentMethodsJson { get; set; } = "[\"CashOnDelivery\",\"Card\",\"BankTransfer\"]";
    public string? BankTransferInstructions { get; set; } = "Bank: Standard Chartered, Title: Apex Retail Ltd, IBAN/Account: PK00SCBL12345678901234";
    public string OperatingHoursJson { get; set; } = "{\"Mon\":\"09:00 - 20:00\",\"Tue\":\"09:00 - 20:00\",\"Wed\":\"09:00 - 20:00\",\"Thu\":\"09:00 - 20:00\",\"Fri\":\"09:00 - 21:00\",\"Sat\":\"10:00 - 21:00\",\"Sun\":\"11:00 - 18:00\"}";
}
