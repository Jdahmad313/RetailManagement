using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Application.Interfaces.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default);
    Task<(bool Success, string Provider, string? ErrorMessage)> SendEmailDetailedAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default);
    Dictionary<string, object> GetDiagnostics();
    Task<bool> SendOtpEmailAsync(string toEmail, string customerName, string otpCode, CancellationToken ct = default);
    Task<bool> SendPasswordResetOtpEmailAsync(string toEmail, string userName, string otpCode, CancellationToken ct = default);
    Task<bool> SendOrderInvoiceAsync(OrderDto order, BusinessProfile profile, CancellationToken ct = default);
    Task<bool> SendCashierInviteAsync(string toEmail, string cashierName, string temporaryPassword, string portalUrl, CancellationToken ct = default);
}
