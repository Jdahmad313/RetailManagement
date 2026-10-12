using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailManagement.Application.Common;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.Interfaces.Services;

namespace RetailManagement.API.Controllers;

public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResponse<ProductDto>>>> GetPaged([FromQuery] ProductFilterParams filter, CancellationToken ct)
    {
        var result = await _productService.GetPagedAsync(filter, ct);
        return Success(result, "Products retrieved successfully.");
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _productService.GetByIdAsync(id, ct);
        return Success(result, "Product retrieved successfully.");
    }

    [HttpGet("sku/{sku}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetBySku(string sku, CancellationToken ct)
    {
        var result = await _productService.GetBySkuAsync(sku, ct);
        return Success(result, "Product retrieved successfully.");
    }

    [HttpGet("barcode/{barcode}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetByBarcode(string barcode, CancellationToken ct)
    {
        var result = await _productService.GetByBarcodeAsync(barcode, ct);
        return Success(result, "Product retrieved successfully.");
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Create([FromBody] CreateProductDto dto, CancellationToken ct)
    {
        var result = await _productService.CreateAsync(dto, ct);
        return CreatedSuccess($"/api/v1/products/{result.Id}", result, "Product created successfully.");
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Update(Guid id, [FromBody] CreateProductDto dto, CancellationToken ct)
    {
        var updateDto = new UpdateProductDto
        {
            Id = id,
            SKU = dto.SKU,
            Barcode = dto.Barcode,
            Name = dto.Name,
            Description = dto.Description,
            Brand = dto.Brand,
            Unit = dto.Unit,
            CategoryId = dto.CategoryId,
            PurchaseCost = dto.PurchaseCost,
            SellingPrice = dto.SellingPrice,
            DiscountPrice = dto.DiscountPrice,
            CustomTaxRate = dto.CustomTaxRate,
            InitialStock = dto.InitialStock,
            ReorderThreshold = dto.ReorderThreshold,
            ImageUrl = dto.ImageUrl,
            AdditionalImagesJson = dto.AdditionalImagesJson,
            AttributesJson = dto.AttributesJson,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured,
            Variants = dto.Variants
        };
        var result = await _productService.UpdateAsync(updateDto, ct);
        return Success(result, "Product updated successfully.");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        await _productService.DeleteAsync(id, ct);
        return Success(true, "Product deleted successfully.");
    }
}
