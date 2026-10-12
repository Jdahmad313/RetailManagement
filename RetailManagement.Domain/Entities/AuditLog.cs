using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty; // "Create", "Update", "Delete", "StockAdjustment", "StatusChange"
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? ChangesJson { get; set; }
    public string? PerformedByUserId { get; set; }
    public string? PerformedByUserName { get; set; }
    public string? IpAddress { get; set; }
}

public class UserRefreshToken : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string JwtId { get; set; } = string.Empty;
    public bool IsUsed { get; set; } = false;
    public bool IsRevoked { get; set; } = false;
    public DateTime ExpiryDateUtc { get; set; }
}
