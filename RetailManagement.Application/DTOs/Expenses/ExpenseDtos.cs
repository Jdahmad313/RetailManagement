using RetailManagement.Application.Common;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Application.DTOs.Expenses;

public class ExpenseCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int ExpenseCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class CreateExpenseCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid ExpenseCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDateUtc { get; set; }
    public PaymentMethodType PaymentMethod { get; set; }
    public string? Description { get; set; }
    public string? ReceiptAttachmentUrl { get; set; }
    public string? RecordedByUserName { get; set; }
}

public class CreateExpenseDto
{
    public Guid ExpenseCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDateUtc { get; set; } = DateTime.UtcNow;
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Cash;
    public string? Description { get; set; }
    public string? ReceiptAttachmentUrl { get; set; }
}

public class ExpenseFilterParams : QueryParameters
{
    public Guid? CategoryId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
