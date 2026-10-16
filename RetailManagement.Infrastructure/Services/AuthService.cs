using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Auth;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Infrastructure.Data;
using RetailManagement.Infrastructure.Identity;

namespace RetailManagement.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly RetailDbContext _dbContext;
    private readonly IOtpService _otpService;
    private readonly IEmailService _emailService;

    public AuthService(
        UserManager<AppUser> userManager,
        RoleManager<AppRole> roleManager,
        IConfiguration configuration,
        RetailDbContext dbContext,
        IOtpService otpService,
        IEmailService emailService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _dbContext = dbContext;
        _otpService = otpService;
        _emailService = emailService;
    }

    public async Task<TokenResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
        {
            throw new BadRequestException("An account with this email address already exists.");
        }

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException(errors);
        }

        // Public registration is strictly restricted to Customer role
        const string roleName = "Customer";
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new AppRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        return await GenerateAuthResultAsync(user);
    }

    public async Task<string> InitiateRegisterOtpAsync(RegisterInitiateDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim();
        var existing = await _userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            throw new BadRequestException("An account with this email address already exists.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
        {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }
        if (!dto.Password.Any(char.IsUpper))
        {
            throw new BadRequestException("Password must contain at least one uppercase letter ('A'-'Z').");
        }
        if (!dto.Password.Any(char.IsLower))
        {
            throw new BadRequestException("Password must contain at least one lowercase letter ('a'-'z').");
        }
        if (!dto.Password.Any(char.IsDigit))
        {
            throw new BadRequestException("Password must contain at least one numeric digit ('0'-'9').");
        }

        var target = email.ToLowerInvariant();
        var payloadJson = JsonSerializer.Serialize(dto);

        await _otpService.InitiateOtpAsync(target, dto.FullName.Trim(), "CustomerRegistration", payloadJson, ct);
        return target;
    }

    public async Task<TokenResponseDto> VerifyRegisterOtpAsync(VerifyOtpDto dto, CancellationToken ct = default)
    {
        var target = dto.Target.Trim().ToLowerInvariant();
        var payloadJson = await _otpService.VerifyOtpAsync(target, dto.OtpCode, "CustomerRegistration", ct);

        if (string.IsNullOrEmpty(payloadJson))
        {
            throw new BadRequestException("Registration details missing or expired. Please sign up again.");
        }

        var registerData = JsonSerializer.Deserialize<RegisterInitiateDto>(payloadJson);
        if (registerData == null)
        {
            throw new BadRequestException("Invalid registration data.");
        }

        var existing = await _userManager.FindByEmailAsync(registerData.Email.Trim());
        if (existing != null)
        {
            return await GenerateAuthResultAsync(existing);
        }

        var user = new AppUser
        {
            UserName = registerData.Email.Trim(),
            Email = registerData.Email.Trim(),
            FullName = registerData.FullName.Trim(),
            PhoneNumber = registerData.PhoneNumber?.Trim(),
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, registerData.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException(errors);
        }

        const string roleName = "Customer";
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new AppRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        return await GenerateAuthResultAsync(user);
    }

    public async Task<bool> ResendRegisterOtpAsync(ResendOtpDto dto, CancellationToken ct = default)
    {
        var target = dto.Target.Trim().ToLowerInvariant();
        return await _otpService.ResendOtpAsync(target, "Customer", "CustomerRegistration", ct);
    }

    public async Task<UserDto> InviteCashierAsync(InviteCashierDto dto, string portalUrl, CancellationToken ct = default)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (existing != null)
        {
            throw new BadRequestException("A user with this email address already exists.");
        }

        var user = new AppUser
        {
            UserName = dto.Email.Trim(),
            Email = dto.Email.Trim(),
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException(errors);
        }

        const string roleName = "Cashier";
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new AppRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        // Send invitation email with credentials and portal link
        await _emailService.SendCashierInviteAsync(dto.Email.Trim(), dto.FullName.Trim(), dto.Password, portalUrl, ct);

        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Roles = new List<string> { roleName }
        };
    }

    public async Task<IReadOnlyList<UserDto>> GetCashiersAsync(CancellationToken ct = default)
    {
        var cashiers = await _userManager.GetUsersInRoleAsync("Cashier");
        return cashiers.Select(u => new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email ?? string.Empty,
            PhoneNumber = u.PhoneNumber,
            Roles = new List<string> { "Cashier" }
        }).ToList();
    }

    public async Task DeleteCashierAsync(string id, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        var isCashier = await _userManager.IsInRoleAsync(user, "Cashier");
        if (!isCashier)
        {
            throw new BadRequestException("Only cashier accounts can be removed via this endpoint.");
        }

        await _userManager.DeleteAsync(user);
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileDto dto, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            user.FullName = dto.FullName.Trim();
        }

        user.PhoneNumber = dto.PhoneNumber?.Trim();

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException(errors);
        }

        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Roles = roles
        };
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.GroupBy(e => e.Code).ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            throw new ValidationException(errors);
        }

        return true;
    }

    public async Task<string> InitiateForgotPasswordOtpAsync(ForgotPasswordInitiateDto dto, CancellationToken ct = default)
    {
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new BadRequestException("Please enter your registered email address.");
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("No account found with this email address.");
        }

        if (!user.IsActive)
        {
            throw new BadRequestException("This account is currently deactivated. Please contact store administration.");
        }

        var payloadJson = JsonSerializer.Serialize(new { Email = user.Email, FullName = user.FullName });
        await _otpService.InitiateOtpAsync(email, user.FullName ?? "Customer", "PasswordReset", payloadJson, ct);
        return email;
    }

    public async Task<bool> ResetPasswordWithOtpAsync(ResetPasswordWithOtpDto dto, CancellationToken ct = default)
    {
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new BadRequestException("Please provide your email address.");
        }

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
        {
            throw new BadRequestException("New password must be at least 6 characters long.");
        }
        if (!dto.NewPassword.Any(char.IsUpper))
        {
            throw new BadRequestException("Password must contain at least one uppercase letter ('A'-'Z').");
        }
        if (!dto.NewPassword.Any(char.IsLower))
        {
            throw new BadRequestException("Password must contain at least one lowercase letter ('a'-'z').");
        }
        if (!dto.NewPassword.Any(char.IsDigit))
        {
            throw new BadRequestException("Password must contain at least one numeric digit ('0'-'9').");
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("No account found with this email address.");
        }

        // 1. Verify and consume the OTP token
        await _otpService.VerifyOtpAsync(email, dto.OtpCode, "PasswordReset", ct);

        // 2. Perform ASP.NET Identity reset
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join("; ", resetResult.Errors.Select(e => e.Description));
            throw new BadRequestException($"Password reset failed: {errors}");
        }

        // 3. Invalidate past refresh tokens for security
        var oldTokens = await _dbContext.UserRefreshTokens.Where(t => t.UserId == user.Id).ToListAsync(ct);
        if (oldTokens.Any())
        {
            _dbContext.UserRefreshTokens.RemoveRange(oldTokens);
            await _dbContext.SaveChangesAsync(ct);
        }

        return true;
    }

    public async Task<bool> ResendForgotPasswordOtpAsync(ForgotPasswordInitiateDto dto, CancellationToken ct = default)
    {
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            throw new NotFoundException("No account found with this email address.");
        }

        return await _otpService.ResendOtpAsync(email, user.FullName ?? "Customer", "PasswordReset", ct);
    }

    public async Task<TokenResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Your account is deactivated. Please contact support.");
        }

        return await GenerateAuthResultAsync(user);
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenDto dto, CancellationToken ct = default)
    {
        var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal == null)
        {
            throw new BadRequestException("Invalid access token.");
        }

        var jti = principal.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Jti)?.Value;
        var userId = principal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(jti) || string.IsNullOrEmpty(userId))
        {
            throw new BadRequestException("Invalid token claims.");
        }

        var storedRefreshToken = await _dbContext.UserRefreshTokens
            .FirstOrDefaultAsync(x => x.Token == dto.RefreshToken && x.UserId == userId, ct);

        if (storedRefreshToken == null || storedRefreshToken.IsRevoked || storedRefreshToken.IsUsed || storedRefreshToken.ExpiryDateUtc < DateTime.UtcNow)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        storedRefreshToken.IsUsed = true;
        _dbContext.UserRefreshTokens.Update(storedRefreshToken);
        await _dbContext.SaveChangesAsync(ct);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedException("User not found or inactive.");
        }

        return await GenerateAuthResultAsync(user);
    }

    public async Task RevokeTokenAsync(string token, CancellationToken ct = default)
    {
        var storedToken = await _dbContext.UserRefreshTokens.FirstOrDefaultAsync(x => x.Token == token, ct);
        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            _dbContext.UserRefreshTokens.Update(storedToken);
            await _dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task<TokenResponseDto> GenerateAuthResultAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForRetailManagementSystemDev2026!ApexSecureKeyMustBe256BitsLong";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString();

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("name", user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, jti)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expires = DateTime.UtcNow.AddHours(2);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "RetailManagementAPI",
            audience: _configuration["Jwt:Audience"] ?? "RetailManagementClient",
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        var accessToken = tokenHandler.WriteToken(token);

        var refreshToken = GenerateRefreshTokenString();
        var userRefreshToken = new UserRefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            JwtId = jti,
            ExpiryDateUtc = DateTime.UtcNow.AddDays(7)
        };

        await _dbContext.UserRefreshTokens.AddAsync(userRefreshToken);
        await _dbContext.SaveChangesAsync();

        return new TokenResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAtUtc = expires,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                Roles = roles
            }
        };
    }

    private static string GenerateRefreshTokenString()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForRetailManagementSystemDev2026!ApexSecureKeyMustBe256BitsLong";
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
