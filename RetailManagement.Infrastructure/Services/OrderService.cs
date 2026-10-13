using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.Common;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Application.Interfaces.Payments;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IEmailService _emailService;

    public OrderService(IUnitOfWork unitOfWork, IPaymentGateway paymentGateway, IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _paymentGateway = paymentGateway;
        _emailService = emailService;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderDto dto, string? userId, CancellationToken ct = default)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            throw new BadRequestException("Order must contain at least one item.");
        }

        var profile = await _unitOfWork.Repository<BusinessProfile>().Query().FirstOrDefaultAsync(ct)
            ?? new BusinessProfile();

        var allowNegative = profile.AllowNegativeStock;
        var defaultTaxRate = profile.DefaultTaxRate;
        var deliveryFee = dto.FulfillmentType == FulfillmentType.Delivery ? profile.DeliveryFee : 0.00m;

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            decimal calculatedSubTotal = 0.00m;
            decimal calculatedTax = 0.00m;
            var orderItems = new List<OrderItem>();
            var movements = new List<InventoryMovement>();

            // Collect all product IDs
            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _unitOfWork.Repository<Product>()
                .Query()
                .Include(p => p.Category)
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
                    throw new BadRequestException($"Product with ID '{itemDto.ProductId}' does not exist.");
                }

                if (!product.IsActive)
                {
                    throw new BadRequestException($"Product '{product.Name}' is not currently available for purchase.");
                }

                // Check stock
                if (product.StockQuantity < itemDto.Quantity && !allowNegative)
                {
                    throw new BadRequestException($"Insufficient stock for product '{product.Name}'. Available: {product.StockQuantity}, Requested: {itemDto.Quantity}.");
                }

                // Authoritative server-side pricing
                var unitPrice = product.DiscountPrice.HasValue && product.DiscountPrice.Value > 0
                    ? product.DiscountPrice.Value
                    : product.SellingPrice;

                var lineSubTotal = unitPrice * itemDto.Quantity;
                var taxRate = product.CustomTaxRate ?? defaultTaxRate;
                var lineTax = Math.Round(lineSubTotal * (taxRate / 100m), 2);
                var lineTotal = lineSubTotal + lineTax;

                calculatedSubTotal += lineSubTotal;
                calculatedTax += lineTax;

                // Deduct stock
                var qtyBefore = product.StockQuantity;
                product.StockQuantity -= itemDto.Quantity;
                _unitOfWork.Repository<Product>().Update(product);

                var orderItem = new OrderItem
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
                    DiscountAmount = 0.00m,
                    Total = lineTotal
                };
                orderItems.Add(orderItem);

                // Inventory Movement audit
                movements.Add(new InventoryMovement
                {
                    ProductId = product.Id,
                    VariantId = itemDto.VariantId,
                    QuantityChange = -itemDto.Quantity,
                    QuantityBefore = qtyBefore,
                    QuantityAfter = product.StockQuantity,
                    MovementType = InventoryMovementType.SaleOrder,
                    ReferenceType = "OnlineOrder",
                    UnitCost = product.PurchaseCost,
                    Reason = "Online Store Checkout",
                    PerformedByUserId = userId,
                    PerformedByUserName = dto.CustomerName
                });
            }

            // Check free delivery threshold
            if (dto.FulfillmentType == FulfillmentType.Delivery && profile.FreeDeliveryThreshold > 0 && calculatedSubTotal >= profile.FreeDeliveryThreshold)
            {
                deliveryFee = 0.00m;
            }

            var calculatedTotal = calculatedSubTotal + calculatedTax + deliveryFee;
            var orderNumber = $"{profile.InvoicePrefix}{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

            var order = new Order
            {
                OrderNumber = orderNumber,
                CustomerName = dto.CustomerName.Trim(),
                CustomerEmail = dto.CustomerEmail.Trim(),
                CustomerPhone = dto.CustomerPhone?.Trim(),
                Status = OrderStatus.Confirmed,
                FulfillmentType = dto.FulfillmentType,
                ShippingAddressJson = dto.ShippingAddress != null ? JsonSerializer.Serialize(dto.ShippingAddress) : null,
                SubTotal = calculatedSubTotal,
                TaxAmount = calculatedTax,
                ShippingFee = deliveryFee,
                DiscountAmount = 0.00m,
                TotalAmount = calculatedTotal,
                PaymentMethod = dto.PaymentMethod,
                PaymentStatus = PaymentStatus.Pending,
                Notes = dto.Notes,
                CreatedBy = userId
            };

            foreach (var item in orderItems)
            {
                order.Items.Add(item);
            }

            await _unitOfWork.Repository<Order>().AddAsync(order, ct);

            // Upsert ProductMonthlySales for each ordered item
            var currentYear = DateTime.UtcNow.Year;
            var currentMonth = DateTime.UtcNow.Month;
            foreach (var item in orderItems)
            {
                var monthlyRecord = await _unitOfWork.Repository<ProductMonthlySales>()
                    .Query()
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.Year == currentYear && s.Month == currentMonth, ct);

                var product = productMap[item.ProductId];
                var catName = product.Category?.Name ?? "General";
                var lineCost = item.UnitCost * item.Quantity;
                var lineProfit = item.SubTotal - lineCost;

                if (monthlyRecord == null)
                {
                    monthlyRecord = new ProductMonthlySales
                    {
                        ProductId = item.ProductId,
                        SKU = item.SKU,
                        ProductName = item.ProductName,
                        CategoryName = catName,
                        Year = currentYear,
                        Month = currentMonth,
                        UnitsSold = item.Quantity,
                        TotalRevenue = item.SubTotal,
                        TotalCost = lineCost,
                        GrossProfit = lineProfit,
                        LastSaleDateUtc = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<ProductMonthlySales>().AddAsync(monthlyRecord, ct);
                }
                else
                {
                    monthlyRecord.UnitsSold += item.Quantity;
                    monthlyRecord.TotalRevenue += item.SubTotal;
                    monthlyRecord.TotalCost += lineCost;
                    monthlyRecord.GrossProfit += lineProfit;
                    monthlyRecord.LastSaleDateUtc = DateTime.UtcNow;
                    _unitOfWork.Repository<ProductMonthlySales>().Update(monthlyRecord);
                }
            }

            // Process payment through payment abstraction
            if (dto.PaymentMethod == PaymentMethodType.Card || dto.PaymentMethod == PaymentMethodType.BankTransfer)
            {
                var payResult = await _paymentGateway.ProcessPaymentAsync(new PaymentRequest
                {
                    Amount = calculatedTotal,
                    Currency = profile.CurrencyCode,
                    OrderReference = orderNumber,
                    CustomerEmail = dto.CustomerEmail
                }, ct);

                if (payResult.Success)
                {
                    order.PaymentStatus = PaymentStatus.Completed;
                    order.PaymentTransactionReference = payResult.TransactionId;
                }
                else
                {
                    order.PaymentStatus = PaymentStatus.Failed;
                    throw new BadRequestException($"Payment processing failed: {payResult.Message}");
                }
            }
            else if (dto.PaymentMethod == PaymentMethodType.CashOnDelivery)
            {
                order.PaymentStatus = PaymentStatus.Pending;
            }

            // Link reference id to inventory movements
            foreach (var m in movements)
            {
                m.ReferenceId = order.OrderNumber;
                await _unitOfWork.Repository<InventoryMovement>().AddAsync(m, ct);
            }

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            var orderDto = await GetByIdAsync(order.Id, ct);
            try
            {
                _ = Task.Run(async () => await _emailService.SendOrderInvoiceAsync(orderDto, profile, CancellationToken.None));
            }
            catch
            {
                // Never block checkout on background email failures
            }

            return orderDto;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    public async Task<OrderDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var order = await _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
        {
            throw new NotFoundException("Order", id);
        }

        return MapToDto(order);
    }

    public async Task<OrderDto> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default)
    {
        var order = await _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

        if (order == null)
        {
            throw new NotFoundException($"Order '{orderNumber}' was not found.");
        }

        return MapToDto(order);
    }

    public async Task<PagedResponse<OrderDto>> GetPagedOrdersAsync(OrderFilterParams filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .AsNoTracking();

        if (filter.Status.HasValue)
        {
            query = query.Where(o => o.Status == filter.Status.Value);
        }

        if (filter.PaymentStatus.HasValue)
        {
            query = query.Where(o => o.PaymentStatus == filter.PaymentStatus.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(o => o.CreatedAtUtc >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(o => o.CreatedAtUtc <= filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(search) ||
                o.CustomerName.ToLower().Contains(search) ||
                o.CustomerEmail.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => MapToDto(o))
            .ToListAsync(ct);

        return new PagedResponse<OrderDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<PagedResponse<OrderDto>> GetMyOrdersAsync(string userId, string? userEmail, QueryParameters filter, CancellationToken ct = default)
    {
        var query = _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(userEmail))
        {
            var emailLower = userEmail.Trim().ToLower();
            query = query.Where(o => o.CreatedBy == userId || (o.CustomerEmail != null && o.CustomerEmail.ToLower() == emailLower));
        }
        else
        {
            query = query.Where(o => o.CreatedBy == userId);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => MapToDto(o))
            .ToListAsync(ct);

        return new PagedResponse<OrderDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<OrderDto> UpdateStatusAsync(Guid id, UpdateOrderStatusDto dto, CancellationToken ct = default)
    {
        var order = await _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
        {
            throw new NotFoundException("Order", id);
        }

        // Validate state transitions
        if (order.Status == OrderStatus.Completed && dto.Status != OrderStatus.Returned)
        {
            throw new BadRequestException("Completed orders can only transition to Returned status.");
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            throw new BadRequestException("Cancelled orders cannot be modified.");
        }

        // Handle cancellation & restocking
        if (dto.Status == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
        {
            order.CancellationReason = dto.CancellationReason ?? "Cancelled by admin/customer";

            // Restock items
            foreach (var item in order.Items)
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
                        ReferenceType = "OrderCancellation",
                        ReferenceId = order.OrderNumber,
                        UnitCost = product.PurchaseCost,
                        Reason = $"Restock from cancelled order {order.OrderNumber}"
                    }, ct);
                }
            }
        }

        order.Status = dto.Status;
        _unitOfWork.Repository<Order>().Update(order);
        await _unitOfWork.SaveChangesAsync(ct);

        return await GetByIdAsync(order.Id, ct);
    }

    private static OrderDto MapToDto(Order o)
    {
        return new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerName = o.CustomerName,
            CustomerEmail = o.CustomerEmail,
            CustomerPhone = o.CustomerPhone,
            Status = o.Status,
            FulfillmentType = o.FulfillmentType,
            ShippingAddressJson = o.ShippingAddressJson,
            SubTotal = o.SubTotal,
            TaxAmount = o.TaxAmount,
            ShippingFee = o.ShippingFee,
            DiscountAmount = o.DiscountAmount,
            TotalAmount = o.TotalAmount,
            PaymentStatus = o.PaymentStatus,
            PaymentMethod = o.PaymentMethod,
            PaymentTransactionReference = o.PaymentTransactionReference,
            Notes = o.Notes,
            CreatedAtUtc = o.CreatedAtUtc,
            Items = o.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                SKU = i.SKU,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                Total = i.Total
            }).ToList()
        };
    }
}
