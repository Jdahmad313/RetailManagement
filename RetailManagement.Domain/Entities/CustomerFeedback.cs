using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class CustomerFeedback : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Category { get; set; } = "Suggestion"; // Suggestion, Inquiry, Complaint, InStoreExperience
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New"; // New, Reviewed, Resolved
}
