using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Pos;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Infrastructure.Services;

public class PosService : IPosService
{
    private readonly IUnitOfWork _unitOfWork;

    public PosService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PosSaleDto> ProcessSaleAsync(CreatePosSaleDto dto, string cashierId, string cashierName, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            throw new BadRequestException("POS cart cannot be empty.");
        }

        var profile = await _unitOfWork.Repository<BusinessProfile>().Query().FirstOrDefaultAsync(ct)
            ?? new BusinessProfile();

        var allowNegative = profile.AllowNegativeStock;
        var defaultTaxRate = profile.DefaultTaxRate;

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            decimal calculatedSubTotal = 0.00m;
            decimal calculatedTax = 0.00m;
            var saleItems = new List<PosSaleItem>();
            var movements = new List<InventoryMovement>();

            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _unitOfWork.Repository<Product>()
                .Query()
                .Include(p => p.Variants)
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(ct);

            var productMap = products.ToDictionary(p => p.Id);

            foreach (var itemDto in dto.Items)
            {
                if (itemDto.Quantity <= 0)
                {
                    throw new BadRequestException("Item quantity must be greater than zero.");
                }

                if (!productMap.TryGetValue(itemDto.ProductId, out var product))
                {
                    throw new BadRequestException($"Product ID '{itemDto.ProductId}' was not found.");
                }

                if (!product.IsActive)
                {
                    throw new BadRequestException($"Product '{product.Name}' is marked inactive.");
                }

                if (product.StockQuantity < itemDto.Quantity && !allowNegative)
                {
                    throw new BadRequestException($"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, Requested: {itemDto.Quantity}.");
                }

                var unitPrice = itemDto.CustomUnitPrice ?? (product.DiscountPrice.HasValue && product.DiscountPrice.Value > 0
                    ? product.DiscountPrice.Value
                    : product.SellingPrice);

                var lineSubTotal = unitPrice * itemDto.Quantity;
                var lineDiscount = itemDto.DiscountAmount;
                var taxableAmount = Math.Max(0.00m, lineSubTotal - lineDiscount);
                var taxRate = product.CustomTaxRate ?? defaultTaxRate;
                var lineTax = Math.Round(taxableAmount * (taxRate / 100m), 2);
                var lineTotal = taxableAmount + lineTax;

                calculatedSubTotal += lineSubTotal;
                calculatedTax += lineTax;

                // Deduct stock
                var qtyBefore = product.StockQuantity;
                product.StockQuantity -= itemDto.Quantity;
                _unitOfWork.Repository<Product>().Update(product);

                var saleItem = new PosSaleItem
                {
                    ProductId = product.Id,
                    VariantId = itemDto.VariantId,
                    ProductName = product.Name,
                    SKU = product.SKU,
                    UnitPrice = unitPrice,
                    UnitCost = product.PurchaseCost,
                    Quantity = itemDto.Quantity,
                    SubTotal = lineSubTotal,
                    TaxRate = taxRate,
                    TaxAmount = lineTax,
                    DiscountAmount = lineDiscount,
                    Total = lineTotal
                };
                saleItems.Add(saleItem);

                movements.Add(new InventoryMovement
                {
                    ProductId = product.Id,
                    VariantId = itemDto.VariantId,
                    QuantityChange = -itemDto.Quantity,
                    QuantityBefore = qtyBefore,
                    QuantityAfter = product.StockQuantity,
                    MovementType = InventoryMovementType.PosSale,
                    ReferenceType = "PosSale",
                    UnitCost = product.PurchaseCost,
                    Reason = "POS In-store register checkout",
                    PerformedByUserId = cashierId,
                    PerformedByUserName = cashierName
                });
            }

            var grandTotal = Math.Max(0.00m, calculatedSubTotal + calculatedTax - dto.GlobalDiscountAmount);

            // Reconcile payments
            var totalPaid = dto.Payments.Sum(p => p.Amount);
            if (dto.AmountTendered > totalPaid)
            {
                totalPaid = dto.AmountTendered;
            }

            if (totalPaid < grandTotal)
            {
                throw new BadRequestException($"Insufficient payment amount. Total is {grandTotal:C}, but only {totalPaid:C} was provided.");
            }

            var changeGiven = Math.Max(0.00m, totalPaid - grandTotal);
            var receiptNumber = $"POS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

            var posSale = new PosSale
            {
                ReceiptNumber = receiptNumber,
                CashierId = cashierId,
                CashierName = cashierName,
                CustomerId = dto.CustomerId,
                CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Walk-in Customer" : dto.CustomerName.Trim(),
                SubTotal = calculatedSubTotal,
                TaxAmount = calculatedTax,
                DiscountAmount = dto.GlobalDiscountAmount,
                TotalAmount = grandTotal,
                AmountTendered = totalPaid,
                ChangeGiven = changeGiven,
                Notes = dto.Notes
            };

            foreach (var item in saleItems)
            {
                posSale.Items.Add(item);
            }

            if (dto.Payments.Any())
            {
                foreach (var p in dto.Payments)
                {
                    posSale.Payments.Add(new PosPayment
                    {
                        PaymentMethod = p.PaymentMethod,
                        Amount = p.Amount,
                        TransactionReference = p.TransactionReference,
                        CardLastFour = p.CardLastFour
                    });
                }
            }
            else
            {
                posSale.Payments.Add(new PosPayment
                {
                    PaymentMethod = PaymentMethodType.Cash,
                    Amount = totalPaid
                });
            }

            await _unitOfWork.Repository<PosSale>().AddAsync(posSale, ct);

            foreach (var m in movements)
            {
                m.ReferenceId = posSale.ReceiptNumber;
                await _unitOfWork.Repository<InventoryMovement>().AddAsync(m, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            return await GetByIdAsync(posSale.Id, ct);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    public async Task<PosSaleDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var sale = await _unitOfWork.Repository<PosSale>()
            .Query()
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (sale == null)
        {
            throw new NotFoundException("POS Sale", id);
        }

        return MapToDto(sale);
    }

    public async Task<PosSaleDto> GetByReceiptNumberAsync(string receiptNumber, CancellationToken ct = default)
    {
        var sale = await _unitOfWork.Repository<PosSale>()
            .Query()
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ReceiptNumber == receiptNumber, ct);

        if (sale == null)
        {
            throw new NotFoundException($"POS Receipt '{receiptNumber}' was not found.");
        }

        return MapToDto(sale);
    }

    public async Task<PagedResponse<PosSaleDto>> GetPagedSalesAsync(PosSaleFilterParams filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<PosSale>()
            .Query()
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .AsNoTracking();

        if (filter.FromDate.HasValue)
        {
            query = query.Where(s => s.CreatedAtUtc >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(s => s.CreatedAtUtc <= filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.CashierId))
        {
            query = query.Where(s => s.CashierId == filter.CashierId);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(s =>
                s.ReceiptNumber.ToLower().Contains(search) ||
                s.CustomerName.ToLower().Contains(search) ||
                s.CashierName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => MapToDto(s))
            .ToListAsync(ct);

        return new PagedResponse<PosSaleDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<PosSaleDto> ReturnSaleAsync(Guid id, ReturnSaleDto dto, string cashierName, CancellationToken ct = default)
    {
        var sale = await _unitOfWork.Repository<PosSale>()
            .Query()
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (sale == null)
        {
            throw new NotFoundException("POS Sale", id);
        }

        if (sale.IsReturned)
        {
            throw new BadRequestException("This POS sale has already been returned.");
        }

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            sale.IsReturned = true;
            sale.ReturnReason = dto.Reason;
            sale.ReturnedAtUtc = DateTime.UtcNow;
            sale.ReturnedByCashierName = cashierName;

            // Restock items
            foreach (var item in sale.Items)
            {
                var product = await _unitOfWork.Repository<Product>().GetByIdAsync(item.ProductId, ct);
                if (product != null)
                {
                    var qtyBefore = product.StockQuantity;
                    product.StockQuantity += item.Quantity;
                    _unitOfWork.Repository<Product>().Update(product);

                    await _unitOfWork.Repository<InventoryMovement>().AddAsync(new InventoryMovement
                    {
                        ProductId = product.Id,
                        QuantityChange = item.Quantity,
                        QuantityBefore = qtyBefore,
                        QuantityAfter = product.StockQuantity,
                        MovementType = InventoryMovementType.ReturnRestock,
                        ReferenceType = "PosReturn",
                        ReferenceId = sale.ReceiptNumber,
                        UnitCost = product.PurchaseCost,
                        Reason = $"POS Return restocking for receipt {sale.ReceiptNumber}: {dto.Reason}",
                        PerformedByUserName = cashierName
                    }, ct);
                }
            }

            _unitOfWork.Repository<PosSale>().Update(sale);
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            return await GetByIdAsync(sale.Id, ct);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    private static PosSaleDto MapToDto(PosSale s)
    {
        return new PosSaleDto
        {
            Id = s.Id,
            ReceiptNumber = s.ReceiptNumber,
            CashierId = s.CashierId,
            CashierName = s.CashierName,
            CustomerName = s.CustomerName,
            SubTotal = s.SubTotal,
            TaxAmount = s.TaxAmount,
            DiscountAmount = s.DiscountAmount,
            TotalAmount = s.TotalAmount,
            AmountTendered = s.AmountTendered,
            ChangeGiven = s.ChangeGiven,
            IsReturned = s.IsReturned,
            ReturnReason = s.ReturnReason,
            ReturnedAtUtc = s.ReturnedAtUtc,
            CreatedAtUtc = s.CreatedAtUtc,
            Items = s.Items.Select(i => new PosSaleItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                SKU = i.SKU,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                DiscountAmount = i.DiscountAmount,
                Total = i.Total
            }).ToList(),
            Payments = s.Payments.Select(p => new PosPaymentDto
            {
                PaymentMethod = p.PaymentMethod,
                Amount = p.Amount,
                TransactionReference = p.TransactionReference,
                CardLastFour = p.CardLastFour
            }).ToList()
        };
    }
}
