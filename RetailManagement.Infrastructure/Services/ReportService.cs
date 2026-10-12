using Microsoft.EntityFrameworkCore;
using RetailManagement.Application.DTOs.Reports;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;

namespace RetailManagement.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Orders
        var onlineOrders = await _unitOfWork.Repository<Order>()
            .Query()
            .Include(o => o.Items)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .AsNoTracking()
            .ToListAsync(ct);

        // POS Sales
        var posSales = await _unitOfWork.Repository<PosSale>()
            .Query()
            .Include(s => s.Items)
            .Where(s => !s.IsReturned)
            .AsNoTracking()
            .ToListAsync(ct);

        // Expenses
        var expenses = await _unitOfWork.Repository<Expense>()
            .Query()
            .AsNoTracking()
            .ToListAsync(ct);

        // Products
        var products = await _unitOfWork.Repository<Product>()
            .Query()
            .AsNoTracking()
            .ToListAsync(ct);

        var onlineSalesToday = onlineOrders.Where(o => o.CreatedAtUtc >= todayStart).Sum(o => o.TotalAmount);
        var posSalesToday = posSales.Where(s => s.CreatedAtUtc >= todayStart).Sum(s => s.TotalAmount);
        var totalSalesToday = onlineSalesToday + posSalesToday;

        var onlineSalesMonth = onlineOrders.Where(o => o.CreatedAtUtc >= monthStart).Sum(o => o.TotalAmount);
        var posSalesMonth = posSales.Where(s => s.CreatedAtUtc >= monthStart).Sum(s => s.TotalAmount);
        var totalSalesMonth = onlineSalesMonth + posSalesMonth;

        var ordersTodayCount = onlineOrders.Count(o => o.CreatedAtUtc >= todayStart) + posSales.Count(s => s.CreatedAtUtc >= todayStart);
        var ordersMonthCount = onlineOrders.Count(o => o.CreatedAtUtc >= monthStart) + posSales.Count(s => s.CreatedAtUtc >= monthStart);

        var expensesThisMonth = expenses.Where(e => e.ExpenseDateUtc >= monthStart).Sum(e => e.Amount);

        // COGS (Cost of goods sold this month)
        var onlineCogsMonth = onlineOrders
            .Where(o => o.CreatedAtUtc >= monthStart)
            .SelectMany(o => o.Items)
            .Sum(i => i.UnitCost * i.Quantity);

        var posCogsMonth = posSales
            .Where(s => s.CreatedAtUtc >= monthStart)
            .SelectMany(s => s.Items)
            .Sum(i => i.UnitCost * i.Quantity);

        var totalCogsMonth = onlineCogsMonth + posCogsMonth;
        var estimatedGrossProfit = Math.Max(0.00m, totalSalesMonth - totalCogsMonth);
        var estimatedNetProfit = estimatedGrossProfit - expensesThisMonth;

        // Sales trend for last 7 days
        var salesTrend = new List<SalesTrendDto>();
        for (int i = 6; i >= 0; i--)
        {
            var targetDate = todayStart.AddDays(-i);
            var nextDate = targetDate.AddDays(1);

            var dayOnline = onlineOrders.Where(o => o.CreatedAtUtc >= targetDate && o.CreatedAtUtc < nextDate).Sum(o => o.TotalAmount);
            var dayPos = posSales.Where(s => s.CreatedAtUtc >= targetDate && s.CreatedAtUtc < nextDate).Sum(s => s.TotalAmount);
            var dayCount = onlineOrders.Count(o => o.CreatedAtUtc >= targetDate && o.CreatedAtUtc < nextDate) +
                           posSales.Count(s => s.CreatedAtUtc >= targetDate && s.CreatedAtUtc < nextDate);

            salesTrend.Add(new SalesTrendDto
            {
                Date = targetDate.ToString("yyyy-MM-dd"),
                OnlineSales = dayOnline,
                PosSales = dayPos,
                TotalSales = dayOnline + dayPos,
                TransactionCount = dayCount
            });
        }

        // Top selling products (all time / this month)
        var allSoldItems = onlineOrders.SelectMany(o => o.Items.Select(i => new { i.ProductId, i.ProductName, i.SKU, i.Quantity, i.Total }))
            .Concat(posSales.SelectMany(s => s.Items.Select(i => new { i.ProductId, i.ProductName, i.SKU, i.Quantity, i.Total })))
            .GroupBy(i => i.ProductId)
            .Select(g => new TopSellingProductDto
            {
                ProductId = g.Key,
                ProductName = g.First().ProductName,
                SKU = g.First().SKU,
                UnitsSold = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.Total)
            })
            .OrderByDescending(x => x.UnitsSold)
            .Take(5)
            .ToList();

        return new DashboardSummaryDto
        {
            SalesToday = totalSalesToday,
            SalesThisMonth = totalSalesMonth,
            OrdersToday = ordersTodayCount,
            OrdersThisMonth = ordersMonthCount,
            PosTransactionsCount = posSales.Count,
            OnlineOrdersCount = onlineOrders.Count,
            TotalProducts = products.Count(p => !p.IsDeleted),
            LowStockProductsCount = products.Count(p => !p.IsDeleted && p.StockQuantity <= p.ReorderThreshold),
            ExpensesThisMonth = expensesThisMonth,
            EstimatedGrossProfitThisMonth = estimatedGrossProfit,
            EstimatedNetProfitThisMonth = estimatedNetProfit,
            SalesTrend = salesTrend,
            TopProducts = allSoldItems
        };
    }

    public async Task<InventoryValuationDto> GetInventoryValuationAsync(CancellationToken ct = default)
    {
        var products = await _unitOfWork.Repository<Product>()
            .Query()
            .Where(p => !p.IsDeleted && p.IsActive)
            .AsNoTracking()
            .ToListAsync(ct);

        var totalCost = products.Sum(p => p.StockQuantity * p.PurchaseCost);
        var totalRetail = products.Sum(p => p.StockQuantity * (p.DiscountPrice ?? p.SellingPrice));

        return new InventoryValuationDto
        {
            TotalUniqueItems = products.Count,
            TotalStockOnHand = products.Sum(p => p.StockQuantity),
            TotalCostValue = totalCost,
            TotalRetailValue = totalRetail
        };
    }
}
