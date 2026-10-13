namespace RetailManagement.Application.DTOs.Feedback;

public class CreateFeedbackDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Category { get; set; } = "Suggestion"; // Suggestion, Inquiry, Complaint, InStoreExperience
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class FeedbackDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
