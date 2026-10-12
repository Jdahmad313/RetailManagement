using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Expenses;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
public class ExpensesController : BaseApiController
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExpenseCategoryDto>>>> GetCategories(CancellationToken ct)
    {
        var result = await _expenseService.GetCategoriesAsync(ct);
        return Success(result, "Expense categories retrieved.");
    }

    [HttpPost("categories")]
    public async Task<ActionResult<ApiResponse<ExpenseCategoryDto>>> CreateCategory([FromBody] CreateExpenseCategoryDto dto, CancellationToken ct)
    {
        var result = await _expenseService.CreateCategoryAsync(dto, ct);
        return Success(result, "Expense category created.");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<ExpenseDto>>>> GetPaged([FromQuery] ExpenseFilterParams filter, CancellationToken ct)
    {
        var result = await _expenseService.GetPagedExpensesAsync(filter, ct);
        return Success(result, "Expenses retrieved.");
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Create([FromBody] CreateExpenseDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Email);

        var result = await _expenseService.CreateExpenseAsync(dto, userId, userName, ct);
        return CreatedSuccess($"/api/v1/expenses/{result.Id}", result, "Expense recorded successfully.");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        await _expenseService.DeleteExpenseAsync(id, ct);
        return Success(true, "Expense deleted successfully.");
    }
}
