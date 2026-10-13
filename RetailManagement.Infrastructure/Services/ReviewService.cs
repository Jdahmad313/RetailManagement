using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Reviews;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Infrastructure.Data;

namespace RetailManagement.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly RetailDbContext _dbContext;

    public ReviewService(RetailDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ProductReviewDto>> GetByProductIdAsync(Guid productId, CancellationToken ct = default)
    {
        return await _dbContext.ProductReviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new ProductReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                CustomerName = r.CustomerName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAtUtc = r.CreatedAtUtc
            })
            .ToListAsync(ct);
    }

    public async Task<ProductReviewDto> AddReviewAsync(Guid productId, CreateProductReviewDto dto, string? userId, string userName, string userEmail, CancellationToken ct = default)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null)
        {
            throw new NotFoundException("Product", productId);
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            throw new BadRequestException("Rating must be between 1 and 5 stars.");
        }

        if (string.IsNullOrWhiteSpace(dto.Comment))
        {
            throw new BadRequestException("Please provide a comment for your review.");
        }

        var review = new ProductReview
        {
            ProductId = productId,
            UserId = userId,
            CustomerName = userName.Trim(),
            CustomerEmail = userEmail.Trim(),
            Rating = dto.Rating,
            Comment = dto.Comment.Trim(),
            IsApproved = true
        };

        await _dbContext.ProductReviews.AddAsync(review, ct);
        await _dbContext.SaveChangesAsync(ct);

        return new ProductReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            CustomerName = review.CustomerName,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAtUtc = review.CreatedAtUtc
        };
    }
}
