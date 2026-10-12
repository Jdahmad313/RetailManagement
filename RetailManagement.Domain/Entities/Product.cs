using RetailManagement.Domain.Common;

namespace RetailManagement.Domain.Entities;

public class Product : AuditableEntity, ISoftDelete
{
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string Unit { get; set; } = "pcs"; // pcs, kg, litre, box, etc.

    public Guid CategoryId { get; set; }
    public virtual Category Category { get; set; } = null!;

    public decimal PurchaseCost { get; set; } = 0.00m;
    public decimal SellingPrice { get; set; } = 0.00m;
    public decimal? DiscountPrice { get; set; }
    public decimal? CustomTaxRate { get; set; }

    public int StockQuantity { get; set; } = 0;
    public int ReorderThreshold { get; set; } = 5;

    public string? ImageUrl { get; set; }
    public string? AdditionalImagesJson { get; set; } // JSON array of urls
    public string? AttributesJson { get; set; } // Generic extensible attributes {"Size":"L", "Color":"Blue", etc.}

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;

    public byte[]? RowVersion { get; set; }

    public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public virtual ICollection<InventoryMovement> InventoryMovements { get; set; } = new List<InventoryMovement>();

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}

public class ProductVariant : AuditableEntity
{
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Small / Red"
    public decimal? PriceOverride { get; set; }
    public int StockQuantity { get; set; } = 0;
    public string? AttributesJson { get; set; }
    public bool IsActive { get; set; } = true;
}
