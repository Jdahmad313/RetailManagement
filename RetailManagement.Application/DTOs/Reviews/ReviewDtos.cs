namespace RetailManagement.Application.DTOs.Reviews;

public class ProductReviewDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateProductReviewDto
{
    public int Rating { get; set; } = 5; // 1 to 5
    public string Comment { get; set; } = string.Empty;
}
