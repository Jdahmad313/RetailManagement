using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class ProductReview : BaseEntity
{
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public string? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    public int Rating { get; set; } = 5; // 1 to 5 stars
    public string Comment { get; set; } = string.Empty;

    public bool IsApproved { get; set; } = true;
}
