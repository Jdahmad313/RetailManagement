using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Expenses;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly IUnitOfWork _unitOfWork;

    public ExpenseService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ExpenseCategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _unitOfWork.Repository<ExpenseCategory>()
            .Query()
            .Include(c => c.Expenses)
            .OrderBy(c => c.Name)
            .Select(c => new ExpenseCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                ExpenseCount = c.Expenses.Count(e => !e.IsDeleted),
                TotalAmount = c.Expenses.Where(e => !e.IsDeleted).Sum(e => e.Amount)
            })
            .ToListAsync(ct);
    }

    public async Task<ExpenseCategoryDto> CreateCategoryAsync(CreateExpenseCategoryDto dto, CancellationToken ct = default)
    {
        var category = new ExpenseCategory
        {
            Name = dto.Name.Trim(),
            Description = dto.Description,
            IsActive = dto.IsActive
        };

        await _unitOfWork.Repository<ExpenseCategory>().AddAsync(category, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new ExpenseCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ExpenseCount = 0,
            TotalAmount = 0.00m
        };
    }

    public async Task<PagedResponse<ExpenseDto>> GetPagedExpensesAsync(ExpenseFilterParams filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<Expense>()
            .Query()
            .Include(e => e.ExpenseCategory)
            .AsNoTracking();

        if (filter.CategoryId.HasValue && filter.CategoryId.Value != Guid.Empty)
        {
            query = query.Where(e => e.ExpenseCategoryId == filter.CategoryId.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDateUtc >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDateUtc <= filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(search) ||
                (e.Description != null && e.Description.ToLower().Contains(search)) ||
                e.ExpenseCategory.Name.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(e => e.ExpenseDateUtc)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                ExpenseCategoryId = e.ExpenseCategoryId,
                CategoryName = e.ExpenseCategory.Name,
                Title = e.Title,
                Amount = e.Amount,
                ExpenseDateUtc = e.ExpenseDateUtc,
                PaymentMethod = e.PaymentMethod,
                Description = e.Description,
                ReceiptAttachmentUrl = e.ReceiptAttachmentUrl,
                RecordedByUserName = e.RecordedByUserName
            })
            .ToListAsync(ct);

        return new PagedResponse<ExpenseDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, string? userId, string? userName, CancellationToken ct = default)
    {
        var category = await _unitOfWork.Repository<ExpenseCategory>().GetByIdAsync(dto.ExpenseCategoryId, ct);
        if (category == null)
        {
            throw new NotFoundException("Expense Category", dto.ExpenseCategoryId);
        }

        var expense = new Expense
        {
            ExpenseCategoryId = dto.ExpenseCategoryId,
            Title = dto.Title.Trim(),
            Amount = dto.Amount,
            ExpenseDateUtc = dto.ExpenseDateUtc,
            PaymentMethod = dto.PaymentMethod,
            Description = dto.Description,
            ReceiptAttachmentUrl = dto.ReceiptAttachmentUrl,
            RecordedByUserId = userId,
            RecordedByUserName = userName ?? "Admin"
        };

        await _unitOfWork.Repository<Expense>().AddAsync(expense, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new ExpenseDto
        {
            Id = expense.Id,
            ExpenseCategoryId = expense.ExpenseCategoryId,
            CategoryName = category.Name,
            Title = expense.Title,
            Amount = expense.Amount,
            ExpenseDateUtc = expense.ExpenseDateUtc,
            PaymentMethod = expense.PaymentMethod,
            Description = expense.Description,
            ReceiptAttachmentUrl = expense.ReceiptAttachmentUrl,
            RecordedByUserName = expense.RecordedByUserName
        };
    }

    public async Task DeleteExpenseAsync(Guid id, CancellationToken ct = default)
    {
        var expense = await _unitOfWork.Repository<Expense>().GetByIdAsync(id, ct);
        if (expense == null)
        {
            throw new NotFoundException("Expense", id);
        }

        _unitOfWork.Repository<Expense>().Remove(expense);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
