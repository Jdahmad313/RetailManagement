using Microsoft.AspNetCore.Identity;

namespace RetailManagement.Infrastructure.Identity;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class AppRole : IdentityRole
{
    public AppRole() : base() { }
    public AppRole(string roleName) : base(roleName) { }
}
