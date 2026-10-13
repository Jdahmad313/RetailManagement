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

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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
}
