using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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

    public AuthService(
        UserManager<AppUser> userManager,
        RoleManager<AppRole> roleManager,
        IConfiguration configuration,
        RetailDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _dbContext = dbContext;
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

        var roleName = string.IsNullOrWhiteSpace(dto.Role) ? "Customer" : dto.Role;
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new AppRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        return await GenerateAuthResultAsync(user);
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
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForRetailManagementSystemDev2026!Apex";
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
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForRetailManagementSystemDev2026!Apex";
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = false // Allow reading claims from expired token for refresh flow
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
