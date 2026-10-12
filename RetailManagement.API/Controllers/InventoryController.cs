using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.DTOs.Inventory;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

[Authorize(Roles = "Admin,Manager,Cashier")]
public class InventoryController : BaseApiController
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("movements")]
    public async Task<ActionResult<ApiResponse<PagedResponse<InventoryMovementDto>>>> GetMovements(
        [FromQuery] Guid? productId,
        [FromQuery] QueryParameters filter,
        CancellationToken ct)
    {
        var result = await _inventoryService.GetMovementsAsync(productId, filter, ct);
        return Success(result, "Inventory movements retrieved successfully.");
    }

    [HttpPost("adjust")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> AdjustStock([FromBody] StockAdjustmentDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Email);

        var result = await _inventoryService.AdjustStockAsync(dto, userId, userName, ct);
        return Success(result, "Stock adjusted successfully.");
    }

    [HttpGet("low-stock-alerts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductDto>>>> GetLowStockAlerts(CancellationToken ct)
    {
        var result = await _inventoryService.GetLowStockAlertsAsync(ct);
        return Success(result, "Low-stock alert products retrieved successfully.");
    }
}
