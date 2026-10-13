namespace RetailManagement.Application.Interfaces.Services;

public interface IOtpService
{
    Task<string> InitiateOtpAsync(string target, string recipientName, string purpose, string payloadJson, CancellationToken ct = default);
    Task<string?> VerifyOtpAsync(string target, string otpCode, string purpose, CancellationToken ct = default);
    Task<bool> ResendOtpAsync(string target, string recipientName, string purpose, CancellationToken ct = default);
}
