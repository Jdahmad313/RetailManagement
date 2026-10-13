using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Infrastructure.Data;

namespace RetailManagement.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly RetailDbContext _dbContext;
    private readonly IEmailService _emailService;

    public OtpService(RetailDbContext dbContext, IEmailService emailService)
    {
        _dbContext = dbContext;
        _emailService = emailService;
    }

    public async Task<string> InitiateOtpAsync(string target, string recipientName, string purpose, string payloadJson, CancellationToken ct = default)
    {
        var normalizedTarget = target.Trim().ToLowerInvariant();

        // Expire any existing active OTPs for this target & purpose
        var existingOtps = await _dbContext.OtpVerifications
            .Where(o => o.Target == normalizedTarget && o.Purpose == purpose && !o.IsUsed)
            .ToListAsync(ct);

        foreach (var old in existingOtps)
        {
            old.IsUsed = true;
        }

        // Generate 6-digit numeric OTP
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var codeHash = HashCode(code);

        var otpRecord = new OtpVerification
        {
            Target = normalizedTarget,
            OtpHash = codeHash,
            Purpose = purpose,
            PayloadJson = payloadJson,
            ExpiryUtc = DateTime.UtcNow.AddMinutes(5),
            AttemptCount = 0,
            IsUsed = false
        };

        await _dbContext.OtpVerifications.AddAsync(otpRecord, ct);
        await _dbContext.SaveChangesAsync(ct);

        // If target looks like an email, send via EmailService
        if (normalizedTarget.Contains('@'))
        {
            await _emailService.SendOtpEmailAsync(normalizedTarget, recipientName, code, ct);
        }

        return code;
    }

    public async Task<string?> VerifyOtpAsync(string target, string otpCode, string purpose, CancellationToken ct = default)
    {
        var normalizedTarget = target.Trim().ToLowerInvariant();
        var codeHash = HashCode(otpCode.Trim());

        var record = await _dbContext.OtpVerifications
            .Where(o => o.Target == normalizedTarget && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (record == null)
        {
            throw new BadRequestException("No active OTP request found for this account. Please request a new code.");
        }

        if (record.ExpiryUtc < DateTime.UtcNow)
        {
            record.IsUsed = true;
            await _dbContext.SaveChangesAsync(ct);
            throw new BadRequestException("The verification code has expired. Please request a new code.");
        }

        if (record.AttemptCount >= 5)
        {
            record.IsUsed = true;
            await _dbContext.SaveChangesAsync(ct);
            throw new BadRequestException("Too many incorrect attempts. This code has been locked for your security.");
        }

        if (record.OtpHash != codeHash)
        {
            record.AttemptCount++;
            await _dbContext.SaveChangesAsync(ct);
            var remaining = 5 - record.AttemptCount;
            throw new BadRequestException($"Incorrect verification code. {remaining} attempt(s) remaining.");
        }

        record.IsUsed = true;
        await _dbContext.SaveChangesAsync(ct);

        return record.PayloadJson;
    }

    public async Task<bool> ResendOtpAsync(string target, string recipientName, string purpose, CancellationToken ct = default)
    {
        var normalizedTarget = target.Trim().ToLowerInvariant();

        var recent = await _dbContext.OtpVerifications
            .Where(o => o.Target == normalizedTarget && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (recent == null)
        {
            throw new BadRequestException("No pending registration found for this account.");
        }

        // Cool-down check: 45 seconds
        if ((DateTime.UtcNow - recent.CreatedAtUtc).TotalSeconds < 45)
        {
            throw new BadRequestException("Please wait a few seconds before requesting another code.");
        }

        await InitiateOtpAsync(normalizedTarget, recipientName, purpose, recent.PayloadJson ?? "{}", ct);
        return true;
    }

    private static string HashCode(string rawCode)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(rawCode));
        return Convert.ToBase64String(bytes);
    }
}
