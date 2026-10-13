using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.DTOs.Inventory;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IProductService _productService;

    public InventoryService(IUnitOfWork unitOfWork, IProductService productService)
    {
        _unitOfWork = unitOfWork;
        _productService = productService;
    }

    public async Task<PagedResponse<InventoryMovementDto>> GetMovementsAsync(Guid? productId, QueryParameters filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<InventoryMovement>()
            .Query()
            .Include(m => m.Product)
            .Include(m => m.Variant)
            .AsNoTracking();

        if (productId.HasValue && productId.Value != Guid.Empty)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(m =>
                m.Product.Name.ToLower().Contains(search) ||
                m.Product.SKU.ToLower().Contains(search) ||
                (m.Reason != null && m.Reason.ToLower().Contains(search)) ||
                (m.ReferenceId != null && m.ReferenceId.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(m => m.CreatedAtUtc)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(m => new InventoryMovementDto
            {
                Id = m.Id,
                ProductId = m.ProductId,
                ProductName = m.Product.Name,
                SKU = m.Product.SKU,
                VariantId = m.VariantId,
                VariantName = m.Variant != null ? m.Variant.Name : null,
                QuantityChange = m.QuantityChange,
                QuantityBefore = m.QuantityBefore,
                QuantityAfter = m.QuantityAfter,
                MovementType = m.MovementType,
                ReferenceType = m.ReferenceType,
                ReferenceId = m.ReferenceId,
                UnitCost = m.UnitCost,
                Reason = m.Reason,
                PerformedByUserName = m.PerformedByUserName,
                CreatedAtUtc = m.CreatedAtUtc
            })
            .ToListAsync(ct);

        return new PagedResponse<InventoryMovementDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<ProductDto> AdjustStockAsync(StockAdjustmentDto dto, string? userId, string? userName, CancellationToken ct = default)
    {
        if (dto.QuantityChange == 0)
        {
            throw new BadRequestException("Quantity change cannot be zero.");
        }

        var product = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId, ct);

        if (product == null)
        {
            throw new NotFoundException("Product", dto.ProductId);
        }

        var profile = await _unitOfWork.Repository<BusinessProfile>().Query().FirstOrDefaultAsync(ct);
        var allowNegative = profile?.AllowNegativeStock ?? false;

        var qtyBefore = product.StockQuantity;
        var qtyAfter = qtyBefore + dto.QuantityChange;

        if (qtyAfter < 0 && !allowNegative)
        {
            throw new BadRequestException($"Stock adjustment would result in negative stock ({qtyAfter}). Business policy disallows negative stock.");
        }

        product.StockQuantity = qtyAfter;

        if (dto.VariantId.HasValue)
        {
            var variant = product.Variants.FirstOrDefault(v => v.Id == dto.VariantId.Value);
            if (variant != null)
            {
                var vQtyAfter = variant.StockQuantity + dto.QuantityChange;
                if (vQtyAfter < 0 && !allowNegative)
                {
                    throw new BadRequestException($"Variant stock would result in negative stock ({vQtyAfter}).");
                }
                variant.StockQuantity = vQtyAfter;
            }
        }

        var movement = new InventoryMovement
        {
            ProductId = product.Id,
            VariantId = dto.VariantId,
            QuantityChange = dto.QuantityChange,
            QuantityBefore = qtyBefore,
            QuantityAfter = qtyAfter,
            MovementType = dto.MovementType,
            ReferenceType = "ManualAdjustment",
            ReferenceId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
            UnitCost = product.PurchaseCost,
            Reason = dto.Reason ?? "Manual stock adjustment by admin",
            PerformedByUserId = userId,
            PerformedByUserName = userName ?? "System Administrator"
        };

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Repository<InventoryMovement>().AddAsync(movement, ct);

        // Record Product Audit Log
        var audit = new ProductAuditLog
        {
            ProductId = product.Id,
            SKU = product.SKU,
            ProductName = product.Name,
            ActionType = "StockAdjusted",
            OldStock = qtyBefore,
            NewStock = qtyAfter,
            OldSellingPrice = product.SellingPrice,
            NewSellingPrice = product.SellingPrice,
            OldPurchaseCost = product.PurchaseCost,
            NewPurchaseCost = product.PurchaseCost,
            ChangeSummary = $"Stock adjusted by {dto.QuantityChange:+#;-#;0} units (from {qtyBefore} to {qtyAfter}). Reason: {dto.Reason ?? "Manual Adjustment"}",
            ChangedByUserId = userId,
            ChangedByUserName = userName ?? "System Administrator",
            CreatedAtUtc = DateTime.UtcNow
        };
        await _unitOfWork.Repository<ProductAuditLog>().AddAsync(audit, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return await _productService.GetByIdAsync(product.Id, ct);
    }

    public async Task<IReadOnlyList<ProductDto>> GetLowStockAlertsAsync(CancellationToken ct = default)
    {
        var lowStock = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .AsNoTracking()
            .Where(p => p.StockQuantity <= p.ReorderThreshold && p.IsActive)
            .OrderBy(p => p.StockQuantity)
            .ToListAsync(ct);

        var list = new List<ProductDto>();
        foreach (var p in lowStock)
        {
            list.Add(new ProductDto
            {
                Id = p.Id,
                SKU = p.SKU,
                Barcode = p.Barcode,
                Name = p.Name,
                Brand = p.Brand,
                Unit = p.Unit,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? string.Empty,
                SellingPrice = p.SellingPrice,
                DiscountPrice = p.DiscountPrice,
                StockQuantity = p.StockQuantity,
                ReorderThreshold = p.ReorderThreshold,
                ImageUrl = p.ImageUrl,
                IsActive = p.IsActive
            });
        }
        return list;
    }
}
