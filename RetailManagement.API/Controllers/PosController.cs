using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Pos;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

[Authorize(Roles = "Admin,Manager,Cashier")]
public class PosController : BaseApiController
{
    private readonly IPosService _posService;

    public PosController(IPosService posService)
    {
        _posService = posService;
    }

    [HttpPost("sale")]
    public async Task<ActionResult<ApiResponse<PosSaleDto>>> ProcessSale([FromBody] CreatePosSaleDto dto, CancellationToken ct)
    {
        var cashierId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "cashier-001";
        var cashierName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Email) ?? "Store Cashier";

        var result = await _posService.ProcessSaleAsync(dto, cashierId, cashierName, ct);
        return CreatedSuccess($"/api/v1/pos/sale/{result.Id}", result, "POS transaction completed successfully.");
    }

    [HttpGet("sale/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PosSaleDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _posService.GetByIdAsync(id, ct);
        return Success(result, "POS transaction retrieved.");
    }

    [HttpGet("receipt/{receiptNumber}")]
    public async Task<ActionResult<ApiResponse<PosSaleDto>>> GetByReceiptNumber(string receiptNumber, CancellationToken ct)
    {
        var result = await _posService.GetByReceiptNumberAsync(receiptNumber, ct);
        return Success(result, "POS receipt retrieved.");
    }

    [HttpGet("sales")]
    public async Task<ActionResult<ApiResponse<PagedResponse<PosSaleDto>>>> GetPaged([FromQuery] PosSaleFilterParams filter, CancellationToken ct)
    {
        var result = await _posService.GetPagedSalesAsync(filter, ct);
        return Success(result, "POS sales history retrieved.");
    }

    [HttpPost("sale/{id:guid}/return")]
    public async Task<ActionResult<ApiResponse<PosSaleDto>>> ReturnSale(Guid id, [FromBody] ReturnSaleDto dto, CancellationToken ct)
    {
        var cashierName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Email) ?? "Store Cashier";
        var result = await _posService.ReturnSaleAsync(id, dto, cashierName, ct);
        return Success(result, "Sale successfully returned and inventory restocked.");
    }
}
