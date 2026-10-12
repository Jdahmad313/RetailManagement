using RetailManagement.Domain.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Domain.Entities;

public class ExpenseCategory : AuditableEntity, ISoftDelete
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class Expense : AuditableEntity, ISoftDelete
{
    public Guid ExpenseCategoryId { get; set; }
    public virtual ExpenseCategory ExpenseCategory { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; } = 0.00m;
    public DateTime ExpenseDateUtc { get; set; } = DateTime.UtcNow;
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Cash;

    public string? Description { get; set; }
    public string? ReceiptAttachmentUrl { get; set; }

    public string? RecordedByUserId { get; set; }
    public string? RecordedByUserName { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}
