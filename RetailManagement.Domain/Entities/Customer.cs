using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class Customer : AuditableEntity, ISoftDelete
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public string? IdentityUserId { get; set; } // Linked if registered as an online user

    public virtual ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class CustomerAddress : BaseEntity
{
    public Guid CustomerId { get; set; }
    public virtual Customer Customer { get; set; } = null!;

    public string RecipientName { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "USA";
    public bool IsDefaultShipping { get; set; } = false;
    public bool IsDefaultBilling { get; set; } = false;
}
