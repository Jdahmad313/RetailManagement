using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Feedback;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Infrastructure.Data;

namespace RetailManagement.Infrastructure.Services;

public class FeedbackService : IFeedbackService
{
    private readonly RetailDbContext _dbContext;

    public FeedbackService(RetailDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FeedbackDto> SubmitFeedbackAsync(CreateFeedbackDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
        {
            throw new BadRequestException("Full name, email, and message are required.");
        }

        var feedback = new CustomerFeedback
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            Phone = dto.Phone?.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Suggestion" : dto.Category.Trim(),
            Subject = string.IsNullOrWhiteSpace(dto.Subject) ? "Customer Feedback" : dto.Subject.Trim(),
            Message = dto.Message.Trim(),
            Status = "New"
        };

        await _dbContext.CustomerFeedbacks.AddAsync(feedback, ct);
        await _dbContext.SaveChangesAsync(ct);

        return new FeedbackDto
        {
            Id = feedback.Id,
            FullName = feedback.FullName,
            Email = feedback.Email,
            Phone = feedback.Phone,
            Category = feedback.Category,
            Subject = feedback.Subject,
            Message = feedback.Message,
            Status = feedback.Status,
            CreatedAtUtc = feedback.CreatedAtUtc
        };
    }

    public async Task<IReadOnlyList<FeedbackDto>> GetAllFeedbackAsync(CancellationToken ct = default)
    {
        return await _dbContext.CustomerFeedbacks
            .OrderByDescending(f => f.CreatedAtUtc)
            .Select(f => new FeedbackDto
            {
                Id = f.Id,
                FullName = f.FullName,
                Email = f.Email,
                Phone = f.Phone,
                Category = f.Category,
                Subject = f.Subject,
                Message = f.Message,
                Status = f.Status,
                CreatedAtUtc = f.CreatedAtUtc
            })
            .ToListAsync(ct);
    }
}
