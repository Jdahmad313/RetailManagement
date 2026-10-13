using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Feedback;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

public class FeedbackController : BaseApiController
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<FeedbackDto>>> SubmitFeedback([FromBody] CreateFeedbackDto dto, CancellationToken ct)
    {
        var result = await _feedbackService.SubmitFeedbackAsync(dto, ct);
        return CreatedSuccess($"/api/feedback/{result.Id}", result, "Thank you! Your feedback has been received.");
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FeedbackDto>>>> GetAllFeedback(CancellationToken ct)
    {
        var result = await _feedbackService.GetAllFeedbackAsync(ct);
        return Success(result, "Feedback records retrieved.");
    }
}
