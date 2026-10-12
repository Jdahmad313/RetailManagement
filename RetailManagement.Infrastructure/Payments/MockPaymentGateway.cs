using RetailManagement.Application.Interfaces.Payments;

namespace RetailManagement.Infrastructure.Payments;

public class MockPaymentGateway : IPaymentGateway
{
    public string ProviderName => "ApexGateway-Mock";

    public Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            return Task.FromResult(new PaymentResult
            {
                Success = false,
                Message = "Amount must be greater than zero."
            });
        }

        // Simulate success
        var transactionId = $"TXN-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
        return Task.FromResult(new PaymentResult
        {
            Success = true,
            TransactionId = transactionId,
            Message = $"Payment of {request.Amount:C} successfully processed via {ProviderName}.",
            RawResponse = $"{{\"status\":\"succeeded\",\"charge_id\":\"{transactionId}\"}}"
        });
    }

    public Task<PaymentResult> RefundPaymentAsync(string transactionId, decimal amount, CancellationToken ct = default)
    {
        var refundId = $"REF-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
        return Task.FromResult(new PaymentResult
        {
            Success = true,
            TransactionId = refundId,
            Message = $"Refund of {amount:C} for transaction {transactionId} was processed.",
            RawResponse = $"{{\"status\":\"refunded\",\"original_txn\":\"{transactionId}\",\"refund_id\":\"{refundId}\"}}"
        });
    }
}
