using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.DTOs.Settings;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Infrastructure.Services;

public class BusinessSettingsService : IBusinessSettingsService
{
    private readonly IUnitOfWork _unitOfWork;

    public BusinessSettingsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<BusinessProfileDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var profile = await _unitOfWork.Repository<BusinessProfile>()
            .Query()
            .FirstOrDefaultAsync(ct);

        if (profile == null)
        {
            profile = new BusinessProfile();
            await _unitOfWork.Repository<BusinessProfile>().AddAsync(profile, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        return MapToDto(profile);
    }

    public async Task<BusinessProfileDto> UpdateSettingsAsync(UpdateBusinessProfileDto dto, CancellationToken ct = default)
    {
        var profile = await _unitOfWork.Repository<BusinessProfile>()
            .Query()
            .FirstOrDefaultAsync(ct);

        if (profile == null)
        {
            profile = new BusinessProfile();
            await _unitOfWork.Repository<BusinessProfile>().AddAsync(profile, ct);
        }

        profile.BusinessName = dto.BusinessName.Trim();
        profile.Tagline = dto.Tagline;
        profile.LogoUrl = dto.LogoUrl;
        profile.Address = dto.Address.Trim();
        profile.Phone = dto.Phone.Trim();
        profile.Email = dto.Email.Trim();
        profile.CurrencyCode = dto.CurrencyCode.Trim().ToUpperInvariant();
        profile.CurrencySymbol = dto.CurrencySymbol.Trim();
        profile.TimeZone = dto.TimeZone.Trim();
        profile.DefaultTaxRate = dto.DefaultTaxRate;
        profile.PricesIncludeTax = dto.PricesIncludeTax;
        profile.InvoicePrefix = dto.InvoicePrefix.Trim();
        profile.ReceiptHeader = dto.ReceiptHeader;
        profile.ReceiptFooter = dto.ReceiptFooter;
        profile.DeliveryFee = dto.DeliveryFee;
        profile.FreeDeliveryThreshold = dto.FreeDeliveryThreshold;
        profile.AllowPickup = dto.AllowPickup;
        profile.AllowDelivery = dto.AllowDelivery;
        profile.AllowNegativeStock = dto.AllowNegativeStock;
        profile.OperatingHoursJson = dto.OperatingHoursJson;

        _unitOfWork.Repository<BusinessProfile>().Update(profile);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToDto(profile);
    }

    private static BusinessProfileDto MapToDto(BusinessProfile p)
    {
        return new BusinessProfileDto
        {
            Id = p.Id,
            BusinessName = p.BusinessName,
            Tagline = p.Tagline,
            LogoUrl = p.LogoUrl,
            Address = p.Address,
            Phone = p.Phone,
            Email = p.Email,
            CurrencyCode = p.CurrencyCode,
            CurrencySymbol = p.CurrencySymbol,
            TimeZone = p.TimeZone,
            DefaultTaxRate = p.DefaultTaxRate,
            PricesIncludeTax = p.PricesIncludeTax,
            InvoicePrefix = p.InvoicePrefix,
            ReceiptHeader = p.ReceiptHeader,
            ReceiptFooter = p.ReceiptFooter,
            DeliveryFee = p.DeliveryFee,
            FreeDeliveryThreshold = p.FreeDeliveryThreshold,
            AllowPickup = p.AllowPickup,
            AllowDelivery = p.AllowDelivery,
            AllowNegativeStock = p.AllowNegativeStock,
            OperatingHoursJson = p.OperatingHoursJson
        };
    }
}
