using RetailManagement.Application.Common;

namespace RetailManagement.Application.DTOs.Catalog;

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? PriceOverride { get; set; }
    public int StockQuantity { get; set; }
    public string? AttributesJson { get; set; }
    public bool IsActive { get; set; }
}

public class ProductDto
{
    public Guid Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string Unit { get; set; } = "pcs";

    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public decimal PurchaseCost { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public decimal? CustomTaxRate { get; set; }
    public decimal EffectivePrice => DiscountPrice.HasValue && DiscountPrice.Value > 0 ? DiscountPrice.Value : SellingPrice;

    public int StockQuantity { get; set; }
    public int ReorderThreshold { get; set; }
    public bool IsLowStock => StockQuantity <= ReorderThreshold;

    public string? ImageUrl { get; set; }
    public string? AdditionalImagesJson { get; set; }
    public string? AttributesJson { get; set; }

    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class CreateProductVariantDto
{
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? PriceOverride { get; set; }
    public int StockQuantity { get; set; } = 0;
    public string? AttributesJson { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateProductDto
{
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string Unit { get; set; } = "pcs";
    public Guid CategoryId { get; set; }

    public decimal PurchaseCost { get; set; } = 0.00m;
    public decimal SellingPrice { get; set; } = 0.00m;
    public decimal? DiscountPrice { get; set; }
    public decimal? CustomTaxRate { get; set; }

    public int InitialStock { get; set; } = 0;
    public int ReorderThreshold { get; set; } = 5;

    public string? ImageUrl { get; set; }
    public string? AdditionalImagesJson { get; set; }
    public string? AttributesJson { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;

    public List<CreateProductVariantDto> Variants { get; set; } = new();
}

public class UpdateProductDto : CreateProductDto
{
    public Guid Id { get; set; }
}

public class ProductFilterParams : QueryParameters
{
    public Guid? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStockOnly { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
}
