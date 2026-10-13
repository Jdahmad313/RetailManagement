using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Reports;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetDashboardSummary(CancellationToken ct)
    {
        var result = await _reportService.GetDashboardSummaryAsync(ct);
        return Success(result, "Dashboard metrics retrieved.");
    }

    [HttpGet("inventory-valuation")]
    public async Task<ActionResult<ApiResponse<InventoryValuationDto>>> GetInventoryValuation(CancellationToken ct)
    {
        var result = await _reportService.GetInventoryValuationAsync(ct);
        return Success(result, "Inventory valuation report retrieved.");
    }

    [HttpGet("yearly-analytics")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductYearlyAnalyticsDto>>>> GetYearlyAnalytics([FromQuery] int? year, CancellationToken ct)
    {
        var targetYear = year.HasValue && year.Value > 2000 ? year.Value : DateTime.UtcNow.Year;
        var result = await _reportService.GetProductYearlyAnalyticsAsync(targetYear, ct);
        return Success(result, $"Yearly item analytics for {targetYear} retrieved.");
    }

    [HttpGet("product-audit-logs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductAuditLogDto>>>> GetProductAuditLogs([FromQuery] Guid? productId, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var result = await _reportService.GetProductAuditLogsAsync(productId, limit, ct);
        return Success(result, "Product modification audit logs retrieved.");
    }
}
