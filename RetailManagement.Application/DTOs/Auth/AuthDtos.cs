namespace RetailManagement.Application.DTOs.Auth;

public class RegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Customer"; // Admin, Manager, Cashier, Customer
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class TokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}

public class RegisterInitiateDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class VerifyOtpDto
{
    public string Target { get; set; } = string.Empty; // Email or Phone
    public string OtpCode { get; set; } = string.Empty; // 6-digit code
}

public class ResendOtpDto
{
    public string Target { get; set; } = string.Empty;
}

public class InviteCashierDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class UpdateProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}


