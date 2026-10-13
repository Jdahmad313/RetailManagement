using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Auth;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;

    public AuthController(IAuthService authService, IEmailService emailService)
    {
        _authService = authService;
        _emailService = emailService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(dto, ct);
        return Success(result, "Account created successfully.");
    }

    [HttpPost("register-initiate")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> RegisterInitiate([FromBody] RegisterInitiateDto dto, CancellationToken ct)
    {
        var target = await _authService.InitiateRegisterOtpAsync(dto, ct);
        return Success<object>(new { target }, "Verification OTP sent successfully.");
    }

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> VerifyOtp([FromBody] VerifyOtpDto dto, CancellationToken ct)
    {
        var result = await _authService.VerifyRegisterOtpAsync(dto, ct);
        return Success(result, "Account verified and activated successfully.");
    }

    [HttpPost("resend-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> ResendOtp([FromBody] ResendOtpDto dto, CancellationToken ct)
    {
        var result = await _authService.ResendRegisterOtpAsync(dto, ct);
        return Success(result, "A new verification code has been dispatched.");
    }

    [HttpPost("cashiers/invite")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<UserDto>>> InviteCashier([FromBody] InviteCashierDto dto, CancellationToken ct)
    {
        var portalUrl = $"{Request.Scheme}://{Request.Host}/admin/pos";
        var result = await _authService.InviteCashierAsync(dto, portalUrl, ct);
        return CreatedSuccess($"/api/auth/cashiers/{result.Id}", result, "Cashier account created and invitation dispatched.");
    }

    [HttpGet("cashiers")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetCashiers(CancellationToken ct)
    {
        var result = await _authService.GetCashiersAsync(ct);
        return Success(result, "Cashiers retrieved successfully.");
    }

    [HttpDelete("cashiers/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCashier(string id, CancellationToken ct)
    {
        await _authService.DeleteCashierAsync(id, ct);
        return Success(true, "Cashier account removed successfully.");
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(dto, ct);
        return Success(result, "Signed in successfully.");
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto, CancellationToken ct)
    {
        var result = await _authService.RefreshTokenAsync(dto, ct);
        return Success(result, "Token refreshed successfully.");
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout([FromBody] RefreshTokenDto dto, CancellationToken ct)
    {
        await _authService.RevokeTokenAsync(dto.RefreshToken, ct);
        return Success(true, "Logged out successfully.");
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<ApiResponse<object>> GetCurrentUser()
    {
        var user = new
        {
            Id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Email = User.FindFirstValue(ClaimTypes.Email),
            Name = User.FindFirstValue("name"),
            Roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList()
        };
        return Success<object>(user, "User profile retrieved.");
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _authService.UpdateProfileAsync(userId, dto, ct);
        return Success(result, "Profile updated successfully.");
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword([FromBody] ChangePasswordDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _authService.ChangePasswordAsync(userId, dto, ct);
        return Success(true, "Password changed successfully.");
    }

    [HttpGet("email-diagnostics")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<object>> GetEmailDiagnostics()
    {
        var diagnostics = _emailService.GetDiagnostics();
        return Success<object>(diagnostics, "Email system diagnostic status.");
    }

    [HttpPost("test-email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> TestEmail([FromQuery] string? to, CancellationToken ct)
    {
        var target = string.IsNullOrWhiteSpace(to) ? "sufisheeen@gmail.com" : to.Trim();
        var subject = $"Apex Retail Live Verification Test - {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC";
        var html = $@"
            <div style='font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px;'>
                <h2 style='color: #2563eb; margin-top: 0;'>Apex Retail System</h2>
                <p>Hello,</p>
                <p>This is a live test email sent directly from the Render deployment.</p>
                <div style='background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px;'>
                    Timestamp: {DateTime.UtcNow:u}<br/>
                    Status: Verified
                </div>
            </div>";

        var (sent, provider, error) = await _emailService.SendEmailDetailedAsync(target, "Apex User", subject, html, ct);
        var diagnostics = _emailService.GetDiagnostics();

        var result = new
        {
            recipient = target,
            delivered = sent,
            attemptedProvider = provider,
            error = error,
            environmentDiagnostics = diagnostics
        };

        return Success<object>(result, sent ? "Test email dispatched successfully." : $"Failed to deliver test email: {error}");
    }
}
