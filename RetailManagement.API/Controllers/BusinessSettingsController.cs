using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Settings;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

public class BusinessSettingsController : BaseApiController
{
    private readonly IBusinessSettingsService _settingsService;

    public BusinessSettingsController(IBusinessSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<BusinessProfileDto>>> GetSettings(CancellationToken ct)
    {
        var result = await _settingsService.GetSettingsAsync(ct);
        return Success(result, "Business settings retrieved.");
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<BusinessProfileDto>>> UpdateSettings([FromBody] UpdateBusinessProfileDto dto, CancellationToken ct)
    {
        var result = await _settingsService.UpdateSettingsAsync(dto, ct);
        return Success(result, "Business settings updated successfully.");
    }
}
