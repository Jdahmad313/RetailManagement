using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Reviews;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

[Route("api/v1/products/{productId:guid}/reviews")]
[Route("api/products/{productId:guid}/reviews")]
public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductReviewDto>>>> GetReviews(Guid productId, CancellationToken ct)
    {
        var result = await _reviewService.GetByProductIdAsync(productId, ct);
        return Success(result, "Reviews retrieved successfully.");
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductReviewDto>>> AddReview(
        Guid productId,
        [FromBody] CreateProductReviewDto dto,
        [FromQuery] string? guestName,
        [FromQuery] string? guestEmail,
        CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue("name") ?? guestName ?? "Verified Customer";
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? guestEmail ?? "customer@store.local";

        var result = await _reviewService.AddReviewAsync(productId, dto, userId, userName, userEmail, ct);
        return CreatedSuccess($"/api/products/{productId}/reviews/{result.Id}", result, "Thank you! Your review has been submitted.");
    }
}
