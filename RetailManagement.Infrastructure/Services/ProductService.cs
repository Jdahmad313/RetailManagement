using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResponse<ProductDto>> GetPagedAsync(ProductFilterParams filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .AsNoTracking();

        if (filter.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == filter.IsActive.Value);
        }

        if (filter.IsFeatured.HasValue)
        {
            query = query.Where(p => p.IsFeatured == filter.IsFeatured.Value);
        }

        if (filter.CategoryId.HasValue && filter.CategoryId.Value != Guid.Empty)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => (p.DiscountPrice ?? p.SellingPrice) >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => (p.DiscountPrice ?? p.SellingPrice) <= filter.MaxPrice.Value);
        }

        if (filter.InStockOnly.HasValue && filter.InStockOnly.Value)
        {
            query = query.Where(p => p.StockQuantity > 0);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.SKU.ToLower().Contains(search) ||
                (p.Barcode != null && p.Barcode.ToLower().Contains(search)) ||
                (p.Brand != null && p.Brand.ToLower().Contains(search)) ||
                (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        var isDesc = string.Equals(filter.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "price" => isDesc ? query.OrderByDescending(p => p.DiscountPrice ?? p.SellingPrice) : query.OrderBy(p => p.DiscountPrice ?? p.SellingPrice),
            "name" => isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "stock" => isDesc ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
            _ => isDesc ? query.OrderByDescending(p => p.CreatedAtUtc) : query.OrderBy(p => p.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);

        return new PagedResponse<ProductDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null)
        {
            throw new NotFoundException("Product", id);
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> GetBySkuAsync(string sku, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.SKU == sku, ct);

        if (product == null)
        {
            throw new NotFoundException($"Product with SKU '{sku}' was not found.");
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Barcode == barcode, ct);

        if (product == null)
        {
            throw new NotFoundException($"Product with barcode '{barcode}' was not found.");
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        var skuExists = await _unitOfWork.Repository<Product>()
            .Query()
            .AnyAsync(p => p.SKU == dto.SKU, ct);

        if (skuExists)
        {
            throw new BadRequestException($"A product with SKU '{dto.SKU}' already exists.");
        }

        var category = await _unitOfWork.Repository<Category>().GetByIdAsync(dto.CategoryId, ct);
        if (category == null)
        {
            throw new BadRequestException("Selected category does not exist.");
        }

        var product = new Product
        {
            SKU = dto.SKU.Trim(),
            Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim(),
            Name = dto.Name.Trim(),
            Description = dto.Description,
            Brand = dto.Brand,
            Unit = dto.Unit,
            CategoryId = dto.CategoryId,
            PurchaseCost = dto.PurchaseCost,
            SellingPrice = dto.SellingPrice,
            DiscountPrice = dto.DiscountPrice,
            CustomTaxRate = dto.CustomTaxRate,
            StockQuantity = dto.InitialStock,
            ReorderThreshold = dto.ReorderThreshold,
            ImageUrl = dto.ImageUrl,
            AdditionalImagesJson = dto.AdditionalImagesJson,
            AttributesJson = dto.AttributesJson,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured
        };

        if (dto.Variants.Any())
        {
            foreach (var v in dto.Variants)
            {
                product.Variants.Add(new ProductVariant
                {
                    SKU = v.SKU,
                    Barcode = v.Barcode,
                    Name = v.Name,
                    PriceOverride = v.PriceOverride,
                    StockQuantity = v.StockQuantity,
                    AttributesJson = v.AttributesJson,
                    IsActive = v.IsActive
                });
            }
        }

        await _unitOfWork.Repository<Product>().AddAsync(product, ct);

        // Record initial inventory movement if initial stock > 0
        if (dto.InitialStock > 0)
        {
            var movement = new InventoryMovement
            {
                ProductId = product.Id,
                QuantityChange = dto.InitialStock,
                QuantityBefore = 0,
                QuantityAfter = dto.InitialStock,
                MovementType = InventoryMovementType.OpeningStock,
                ReferenceType = "ProductCreation",
                ReferenceId = product.Id.ToString(),
                UnitCost = dto.PurchaseCost,
                Reason = "Initial Opening Stock"
            };
            await _unitOfWork.Repository<InventoryMovement>().AddAsync(movement, ct);
        }

        // Record Product Audit Log
        var createAudit = new ProductAuditLog
        {
            ProductId = product.Id,
            SKU = product.SKU,
            ProductName = product.Name,
            ActionType = "Created",
            NewSellingPrice = product.SellingPrice,
            NewPurchaseCost = product.PurchaseCost,
            NewStock = product.StockQuantity,
            ChangeSummary = $"Product '{product.Name}' added to catalog with price Rs. {product.SellingPrice:N2}",
            ChangedByUserName = "Store Admin",
            CreatedAtUtc = DateTime.UtcNow
        };
        await _unitOfWork.Repository<ProductAuditLog>().AddAsync(createAudit, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return await GetByIdAsync(product.Id, ct);
    }

    public async Task<ProductDto> UpdateAsync(UpdateProductDto dto, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Repository<Product>()
            .Query()
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == dto.Id, ct);

        if (product == null)
        {
            throw new NotFoundException("Product", dto.Id);
        }

        var skuInUse = await _unitOfWork.Repository<Product>()
            .Query()
            .AnyAsync(p => p.SKU == dto.SKU && p.Id != dto.Id, ct);

        if (skuInUse)
        {
            throw new BadRequestException($"SKU '{dto.SKU}' is already used by another product.");
        }

        var oldPrice = product.SellingPrice;
        var oldCost = product.PurchaseCost;
        var oldStock = product.StockQuantity;
        var priceChanged = oldPrice != dto.SellingPrice;
        var costChanged = oldCost != dto.PurchaseCost;

        var changeSummaryList = new List<string>();
        if (priceChanged) changeSummaryList.Add($"Selling price: Rs. {oldPrice:N2} -> Rs. {dto.SellingPrice:N2}");
        if (costChanged) changeSummaryList.Add($"Purchase cost: Rs. {oldCost:N2} -> Rs. {dto.PurchaseCost:N2}");
        if (!string.Equals(product.Name, dto.Name, StringComparison.OrdinalIgnoreCase)) changeSummaryList.Add($"Name updated to '{dto.Name}'");
        if (product.IsActive != dto.IsActive) changeSummaryList.Add(dto.IsActive ? "Activated" : "Deactivated");
        if (!changeSummaryList.Any()) changeSummaryList.Add("Product details and specifications updated");

        product.SKU = dto.SKU.Trim();
        product.Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim();
        product.Name = dto.Name.Trim();
        product.Description = dto.Description;
        product.Brand = dto.Brand;
        product.Unit = dto.Unit;
        product.CategoryId = dto.CategoryId;
        product.PurchaseCost = dto.PurchaseCost;
        product.SellingPrice = dto.SellingPrice;
        product.DiscountPrice = dto.DiscountPrice;
        product.CustomTaxRate = dto.CustomTaxRate;
        product.ReorderThreshold = dto.ReorderThreshold;
        product.ImageUrl = dto.ImageUrl;
        product.AdditionalImagesJson = dto.AdditionalImagesJson;
        product.AttributesJson = dto.AttributesJson;
        product.IsActive = dto.IsActive;
        product.IsFeatured = dto.IsFeatured;

        _unitOfWork.Repository<Product>().Update(product);

        // Record Audit Entry
        var updateAudit = new ProductAuditLog
        {
            ProductId = product.Id,
            SKU = product.SKU,
            ProductName = product.Name,
            ActionType = priceChanged ? "PriceUpdated" : (costChanged ? "CostUpdated" : "InfoUpdated"),
            OldSellingPrice = oldPrice,
            NewSellingPrice = dto.SellingPrice,
            OldPurchaseCost = oldCost,
            NewPurchaseCost = dto.PurchaseCost,
            OldStock = oldStock,
            NewStock = oldStock,
            ChangeSummary = string.Join("; ", changeSummaryList),
            ChangedByUserName = "Store Admin",
            CreatedAtUtc = DateTime.UtcNow
        };
        await _unitOfWork.Repository<ProductAuditLog>().AddAsync(updateAudit, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return await GetByIdAsync(product.Id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Repository<Product>().GetByIdAsync(id, ct);
        if (product == null)
        {
            throw new NotFoundException("Product", id);
        }

        _unitOfWork.Repository<Product>().Remove(product);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static ProductDto MapToDto(Product p)
    {
        return new ProductDto
        {
            Id = p.Id,
            SKU = p.SKU,
            Barcode = p.Barcode,
            Name = p.Name,
            Description = p.Description,
            Brand = p.Brand,
            Unit = p.Unit,
            CategoryId = p.CategoryId,
            CategoryName = p.Category != null ? p.Category.Name : string.Empty,
            PurchaseCost = p.PurchaseCost,
            SellingPrice = p.SellingPrice,
            DiscountPrice = p.DiscountPrice,
            CustomTaxRate = p.CustomTaxRate,
            StockQuantity = p.StockQuantity,
            ReorderThreshold = p.ReorderThreshold,
            ImageUrl = p.ImageUrl,
            AdditionalImagesJson = p.AdditionalImagesJson,
            AttributesJson = p.AttributesJson,
            IsActive = p.IsActive,
            IsFeatured = p.IsFeatured,
            AverageRating = p.Reviews != null && p.Reviews.Any(r => r.IsApproved) 
                ? Math.Round(p.Reviews.Where(r => r.IsApproved).Average(r => r.Rating), 1) 
                : 5.0,
            ReviewCount = p.Reviews != null ? p.Reviews.Count(r => r.IsApproved) : 0,
            CreatedAtUtc = p.CreatedAtUtc,
            Variants = p.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                ProductId = v.ProductId,
                SKU = v.SKU,
                Barcode = v.Barcode,
                Name = v.Name,
                PriceOverride = v.PriceOverride,
                StockQuantity = v.StockQuantity,
                AttributesJson = v.AttributesJson,
                IsActive = v.IsActive
            }).ToList()
        };
    }
}
