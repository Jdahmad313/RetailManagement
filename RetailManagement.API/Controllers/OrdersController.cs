using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

public class OrdersController : BaseApiController
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder([FromBody] CreateOrderDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _orderService.CreateOrderAsync(dto, userId, ct);
        return CreatedSuccess($"/api/v1/orders/{result.Id}", result, "Order placed successfully.");
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _orderService.GetByIdAsync(id, ct);
        return Success(result, "Order retrieved successfully.");
    }

    [HttpGet("number/{orderNumber}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetByNumber(string orderNumber, CancellationToken ct)
    {
        var result = await _orderService.GetByOrderNumberAsync(orderNumber, ct);
        return Success(result, "Order retrieved successfully.");
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Cashier")]
    public async Task<ActionResult<ApiResponse<PagedResponse<OrderDto>>>> GetPaged([FromQuery] OrderFilterParams filter, CancellationToken ct)
    {
        var result = await _orderService.GetPagedOrdersAsync(filter, ct);
        return Success(result, "Orders retrieved successfully.");
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusDto dto, CancellationToken ct)
    {
        var result = await _orderService.UpdateStatusAsync(id, dto, ct);
        return Success(result, "Order status updated successfully.");
    }
}
