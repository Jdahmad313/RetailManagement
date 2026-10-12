using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public CategoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        var categories = await _unitOfWork.Repository<Category>()
            .Query()
            .Include(c => c.ParentCategory)
            .Include(c => c.Products)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                ParentCategoryId = c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                ProductCount = c.Products.Count(p => !p.IsDeleted)
            })
            .ToListAsync(ct);

        return categories;
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _unitOfWork.Repository<Category>()
            .Query()
            .Include(c => c.ParentCategory)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            throw new NotFoundException("Category", id);
        }

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            ParentCategoryId = category.ParentCategoryId,
            ParentCategoryName = category.ParentCategory?.Name,
            ProductCount = category.Products.Count(p => !p.IsDeleted)
        };
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        var slug = GenerateSlug(dto.Name);
        var existing = await _unitOfWork.Repository<Category>()
            .Query()
            .AnyAsync(c => c.Slug == slug, ct);

        if (existing)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            ParentCategoryId = dto.ParentCategoryId
        };

        await _unitOfWork.Repository<Category>().AddAsync(category, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return await GetByIdAsync(category.Id, ct);
    }

    public async Task<CategoryDto> UpdateAsync(UpdateCategoryDto dto, CancellationToken ct = default)
    {
        var category = await _unitOfWork.Repository<Category>().GetByIdAsync(dto.Id, ct);
        if (category == null)
        {
            throw new NotFoundException("Category", dto.Id);
        }

        if (dto.ParentCategoryId == dto.Id)
        {
            throw new BadRequestException("A category cannot be its own parent.");
        }

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.ImageUrl = dto.ImageUrl;
        category.DisplayOrder = dto.DisplayOrder;
        category.IsActive = dto.IsActive;
        category.ParentCategoryId = dto.ParentCategoryId;

        _unitOfWork.Repository<Category>().Update(category);
        await _unitOfWork.SaveChangesAsync(ct);

        return await GetByIdAsync(category.Id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _unitOfWork.Repository<Category>()
            .Query()
            .Include(c => c.Products)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (category == null)
        {
            throw new NotFoundException("Category", id);
        }

        if (category.Products.Any(p => !p.IsDeleted))
        {
            throw new BadRequestException("Cannot delete category because it contains active products. Reassign or deactivate the products first.");
        }

        if (category.SubCategories.Any(s => !s.IsDeleted))
        {
            throw new BadRequestException("Cannot delete category because it contains active subcategories.");
        }

        _unitOfWork.Repository<Category>().Remove(category);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static string GenerateSlug(string name)
    {
        var str = name.ToLowerInvariant().Trim();
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = Regex.Replace(str, @"\s+", "-").Trim('-');
        return string.IsNullOrEmpty(str) ? Guid.NewGuid().ToString("N")[..8] : str;
    }
}
