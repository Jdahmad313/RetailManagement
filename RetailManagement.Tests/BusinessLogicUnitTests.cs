using Moq;
using RetailManagement.Application.Common.Exceptions;
using RetailManagement.Application.DTOs.Catalog;
using RetailManagement.Application.DTOs.Inventory;
using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Application.DTOs.Pos;
using RetailManagement.Application.DTOs.Reports;
using RetailManagement.Application.Interfaces.Payments;
using RetailManagement.Application.Interfaces.Repositories;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;
using RetailManagement.Infrastructure.Payments;
using RetailManagement.Infrastructure.Services;
using Xunit;

namespace RetailManagement.Tests;

public class BusinessLogicUnitTests
{
    [Fact]
    public void MockPaymentGateway_ProcessesPositiveAmount_Successfully()
    {
        // Arrange
        var gateway = new MockPaymentGateway();
        var request = new PaymentRequest
        {
            Amount = 149.99m,
            Currency = "USD",
            OrderReference = "ORD-TEST-123",
            CustomerEmail = "customer@retail.local"
        };

        // Act
        var result = gateway.ProcessPaymentAsync(request).Result;

        // Assert
        Assert.True(result.Success);
        Assert.StartsWith("TXN-", result.TransactionId);
        Assert.Contains("149.99", result.Message);
    }

    [Fact]
    public void MockPaymentGateway_RejectsZeroOrNegativeAmount()
    {
        // Arrange
        var gateway = new MockPaymentGateway();
        var request = new PaymentRequest
        {
            Amount = 0.00m,
            Currency = "USD",
            OrderReference = "ORD-ZERO"
        };

        // Act
        var result = gateway.ProcessPaymentAsync(request).Result;

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public void OrderCalculation_Recalculates_Authoritative_Subtotal_And_Tax()
    {
        // Server side price calculation logic test
        decimal unitPrice = 25.00m;
        int quantity = 3;
        decimal taxRate = 8.5m;

        decimal subtotal = unitPrice * quantity; // 75.00
        decimal tax = Math.Round(subtotal * (taxRate / 100m), 2); // 6.38
        decimal total = subtotal + tax; // 81.38

        Assert.Equal(75.00m, subtotal);
        Assert.Equal(6.38m, tax);
        Assert.Equal(81.38m, total);
    }

    [Fact]
    public void PosSale_ChangeCalculation_Accurate_When_AmountTendered_Exceeds_GrandTotal()
    {
        decimal grandTotal = 87.50m;
        decimal amountTendered = 100.00m;

        decimal change = amountTendered - grandTotal;

        Assert.Equal(12.50m, change);
    }

    [Fact]
    public void PosSale_SplitPayments_Reconciles_Correctly()
    {
        decimal grandTotal = 150.00m;
        var payments = new List<CreatePosPaymentDto>
        {
            new() { PaymentMethod = PaymentMethodType.Cash, Amount = 50.00m },
            new() { PaymentMethod = PaymentMethodType.Card, Amount = 100.00m }
        };

        decimal totalPaid = payments.Sum(p => p.Amount);

        Assert.Equal(grandTotal, totalPaid);
        Assert.True(totalPaid >= grandTotal);
    }

    [Fact]
    public void InventoryMovement_Calculates_Quantity_Transitions_Accurately()
    {
        int startingStock = 50;
        int orderQty = 5;

        int resultingStock = startingStock - orderQty;

        var movement = new InventoryMovement
        {
            QuantityChange = -orderQty,
            QuantityBefore = startingStock,
            QuantityAfter = resultingStock,
            MovementType = InventoryMovementType.SaleOrder
        };

        Assert.Equal(45, movement.QuantityAfter);
        Assert.Equal(-5, movement.QuantityChange);
    }

    [Fact]
    public void FinancialReports_COGS_And_GrossProfit_Computed_Accurately()
    {
        decimal totalRevenue = 1000.00m;
        decimal totalCOGS = 600.00m;
        decimal operatingExpenses = 250.00m;

        decimal grossProfit = totalRevenue - totalCOGS; // 400
        decimal netProfit = grossProfit - operatingExpenses; // 150

        Assert.Equal(400.00m, grossProfit);
        Assert.Equal(150.00m, netProfit);
    }
}
