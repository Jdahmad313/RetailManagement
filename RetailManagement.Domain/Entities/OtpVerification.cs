using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class OtpVerification : BaseEntity
{
    public string Target { get; set; } = string.Empty; // Email or Phone Number
    public string OtpHash { get; set; } = string.Empty;
    public string Purpose { get; set; } = "CustomerRegistration"; // CustomerRegistration, PasswordReset, PhoneVerification
    public string? PayloadJson { get; set; } // Temporary JSON holding registration details (FullName, PasswordHash, etc.)
    public DateTime ExpiryUtc { get; set; }
    public int AttemptCount { get; set; } = 0;
    public bool IsUsed { get; set; } = false;
}
