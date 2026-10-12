namespace RetailManagement.Application.Interfaces.Payments;

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string OrderReference { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Description { get; set; }
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? RawResponse { get; set; }
}

public interface IPaymentGateway
{
    string ProviderName { get; }
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken ct = default);
    Task<PaymentResult> RefundPaymentAsync(string transactionId, decimal amount, CancellationToken ct = default);
}
