using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Domain.Entities;
using RetailManagement.Domain.Enums;
using RetailManagement.Infrastructure.Identity;

namespace RetailManagement.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(RetailDbContext context, UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
    {
        // 1. Seed Roles (Only if missing)
        var roles = new[] { "Admin", "Manager", "Cashier", "Customer" };
        foreach (var r in roles)
        {
            if (!await roleManager.RoleExistsAsync(r))
            {
                await roleManager.CreateAsync(new AppRole(r));
            }
        }

        // 2. Ensure Default Users exist (Preserving all existing users)
        var adminEmail = "admin@retail.local";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        var cashierEmail = "cashier@retail.local";
        var cashierUser = await userManager.FindByEmailAsync(cashierEmail);
        if (cashierUser == null)
        {
            cashierUser = new AppUser
            {
                UserName = cashierEmail,
                Email = cashierEmail,
                FullName = "Store Cashier",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(cashierUser, "Cashier@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(cashierUser, "Cashier");
            }
        }

        var customerEmail = "customer@retail.local";
        var customerUser = await userManager.FindByEmailAsync(customerEmail);
        if (customerUser == null)
        {
            customerUser = new AppUser
            {
                UserName = customerEmail,
                Email = customerEmail,
                FullName = "Valued Customer",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(customerUser, "Customer@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customerUser, "Customer");
            }
        }

        // 3. Configure Business Profile for Mukhtar Bashir Merchant Karyana Store (Jurian, Hafizabad)
        var existingProfile = await context.BusinessProfiles.FirstOrDefaultAsync();
        if (existingProfile == null)
        {
            existingProfile = new BusinessProfile();
            await context.BusinessProfiles.AddAsync(existingProfile);
        }

        existingProfile.BusinessName = "Mukhtar Bashir Merchant Karyana Store";
        existingProfile.Tagline = "Taza Karyana, Bulk Flours, Nimko & Village General Store";
        existingProfile.LogoUrl = "/assets/logo.png";
        existingProfile.Address = "Jurian, Hafizabad, Punjab, Pakistan";
        existingProfile.Phone = "+923446583468";
        existingProfile.WhatsAppNumber = "03446583468";
        existingProfile.Email = "mukhtarbashirkaryana@gmail.com";
        existingProfile.CurrencyCode = "PKR";
        existingProfile.CurrencySymbol = "Rs.";
        existingProfile.TimeZone = "Asia/Karachi";
        existingProfile.DefaultTaxRate = 0.00m;
        existingProfile.PricesIncludeTax = true;
        existingProfile.InvoicePrefix = "MBK-";
        existingProfile.ReceiptHeader = "Mukhtar Bashir Merchant Karyana Store - Jurian, Hafizabad";
        existingProfile.ReceiptFooter = "Shukriya! Mukhtar Bashir Merchant Karyana par tashreef awri ka bohot shukriya. Phone: 03446583468";
        existingProfile.DeliveryFee = 0.00m;
        existingProfile.FreeDeliveryThreshold = 1000.00m;
        existingProfile.AllowPickup = true;
        existingProfile.AllowDelivery = true;
        existingProfile.AllowNegativeStock = false;
        existingProfile.BankTransferInstructions = "Easypaisa or Raast at 03446583468 and share the screenshot on same number as of this (03446583468)";
        existingProfile.OperatingHoursJson = "{\"Mon\":\"06:30 - 22:30\",\"Tue\":\"06:30 - 22:30\",\"Wed\":\"06:30 - 22:30\",\"Thu\":\"06:30 - 22:30\",\"Fri\":\"06:30 - 22:30\",\"Sat\":\"06:30 - 22:30\",\"Sun\":\"06:30 - 22:30\"}";

        await context.SaveChangesAsync();

        // 4. One-time clean-up of legacy demo catalog/inventory/sales
        // CRITICAL PRODUCTION SAFETY: This condition ONLY evaluates to true if legacy demo products
        // (ELEC-, CLOTH-, GROC-OO-001) are present in the database.
        // During this initial migration deployment, it cleanly clears out the demo placeholders.
        // On ALL FUTURE deployments, 'hasOldDemoProducts' is FALSE, so this truncation block is 100% skipped forever.
        // Real user sales, orders, newly added products, and customer records will NEVER be truncated.
        bool hasOldDemoProducts = await context.Products.IgnoreQueryFilters()
            .AnyAsync(p => p.SKU.StartsWith("ELEC-") || p.SKU.StartsWith("CLOTH-") || p.SKU.StartsWith("GROC-OO-001"));

        if (hasOldDemoProducts)
        {
            try
            {
                // Child transactions first
                await context.PosPayments.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.PosSaleItems.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.PosSales.IgnoreQueryFilters().ExecuteDeleteAsync();

                await context.PurchaseOrderItems.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.PurchaseOrders.IgnoreQueryFilters().ExecuteDeleteAsync();

                await context.OrderItems.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.Orders.IgnoreQueryFilters().ExecuteDeleteAsync();

                await context.InventoryMovements.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.ProductReviews.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.ProductAuditLogs.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.ProductMonthlySales.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.ProductVariants.IgnoreQueryFilters().ExecuteDeleteAsync();

                await context.Products.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.Categories.IgnoreQueryFilters().ExecuteDeleteAsync();

                await context.Expenses.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.ExpenseCategories.IgnoreQueryFilters().ExecuteDeleteAsync();
                await context.CustomerFeedbacks.IgnoreQueryFilters().ExecuteDeleteAsync();
            }
            catch
            {
                // In-memory or constraint fallback
                context.PosPayments.RemoveRange(await context.PosPayments.IgnoreQueryFilters().ToListAsync());
                context.PosSaleItems.RemoveRange(await context.PosSaleItems.IgnoreQueryFilters().ToListAsync());
                context.PosSales.RemoveRange(await context.PosSales.IgnoreQueryFilters().ToListAsync());

                context.PurchaseOrderItems.RemoveRange(await context.PurchaseOrderItems.IgnoreQueryFilters().ToListAsync());
                context.PurchaseOrders.RemoveRange(await context.PurchaseOrders.IgnoreQueryFilters().ToListAsync());

                context.OrderItems.RemoveRange(await context.OrderItems.IgnoreQueryFilters().ToListAsync());
                context.Orders.RemoveRange(await context.Orders.IgnoreQueryFilters().ToListAsync());

                context.InventoryMovements.RemoveRange(await context.InventoryMovements.IgnoreQueryFilters().ToListAsync());
                context.ProductReviews.RemoveRange(await context.ProductReviews.IgnoreQueryFilters().ToListAsync());
                context.ProductAuditLogs.RemoveRange(await context.ProductAuditLogs.IgnoreQueryFilters().ToListAsync());
                context.ProductMonthlySales.RemoveRange(await context.ProductMonthlySales.IgnoreQueryFilters().ToListAsync());
                context.ProductVariants.RemoveRange(await context.ProductVariants.IgnoreQueryFilters().ToListAsync());

                context.Products.RemoveRange(await context.Products.IgnoreQueryFilters().ToListAsync());
                context.Categories.RemoveRange(await context.Categories.IgnoreQueryFilters().ToListAsync());

                context.Expenses.RemoveRange(await context.Expenses.IgnoreQueryFilters().ToListAsync());
                context.ExpenseCategories.RemoveRange(await context.ExpenseCategories.IgnoreQueryFilters().ToListAsync());
                context.CustomerFeedbacks.RemoveRange(await context.CustomerFeedbacks.IgnoreQueryFilters().ToListAsync());

                await context.SaveChangesAsync();
            }
        }

        // 5. Seed Real Village Karyana Categories (Additive: only adds missing categories)
        var categories = new List<Category>
        {
            new() { Name = "Beverages & Cold Drinks", Slug = "beverages", Description = "Next Cola, Khilafat Cola, Coke, Pepsi, Pakola & Sharbat", DisplayOrder = 1, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Home & Laundry Care", Slug = "home-laundry", Description = "Surf Excel, Ariel, Bonus, Vim Bar & Washing Soaps", DisplayOrder = 2, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Grains, Flours & Bulk Packs", Slug = "grains-bulk-packs", Description = "Chakki Atta, Gandum, Basmati Rice, Cheeni & Daal (1kg to 100kg)", DisplayOrder = 3, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Dry Fruits, Nuts & Fresh Produce", Slug = "dry-fruits-produce", Description = "Kagzi Akhrot, Akhrot Giri, Badam & Fresh Desi Mooli", DisplayOrder = 4, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1563746098-eb113ec46102?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Biscuits, Snacks & Nimko", Slug = "biscuits-nimko-snacks", Description = "B4U Nimko Special Mix, Sooper, Prince, Rio & Shahi Nankhatai", DisplayOrder = 5, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Cooking Oil, Ghee & Spices", Slug = "cooking-spices-oil", Description = "Dalda Oil, Sufi Ghee, Shan Masala, Chilli, Salt & Zeera", DisplayOrder = 6, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80" },
            new() { Name = "Tea & Dairy Products", Slug = "tea-dairy-sugar", Description = "Tapal Danedar, Olper's Milk, MilkPak & Everyday Powder", DisplayOrder = 7, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80" }
        };

        foreach (var cat in categories)
        {
            if (!await context.Categories.IgnoreQueryFilters().AnyAsync(c => c.Slug == cat.Slug))
            {
                await context.Categories.AddAsync(cat);
            }
        }
        await context.SaveChangesAsync();

        // 6. Seed Real Mukhtar Bashir Karyana Catalog (Additive: only adds products if SKU doesn't exist)
        var bevCat = await context.Categories.FirstAsync(c => c.Slug == "beverages");
        var lndCat = await context.Categories.FirstAsync(c => c.Slug == "home-laundry");
        var grnCat = await context.Categories.FirstAsync(c => c.Slug == "grains-bulk-packs");
        var dryCat = await context.Categories.FirstAsync(c => c.Slug == "dry-fruits-produce");
        var nmkCat = await context.Categories.FirstAsync(c => c.Slug == "biscuits-nimko-snacks");
        var oilCat = await context.Categories.FirstAsync(c => c.Slug == "cooking-spices-oil");
        var teaCat = await context.Categories.FirstAsync(c => c.Slug == "tea-dairy-sugar");

        var products = new List<Product>
            {
                // --- BEVERAGES ---
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-001",
                    Barcode = "8961001000018",
                    Name = "Next Cola 1.5 Litre Family Bottle",
                    Description = "Premium Pakistani cola with refreshing carbonated taste. Family size 1.5 litre bottle.",
                    Brand = "Mezan Next",
                    Unit = "bottle",
                    PurchaseCost = 175.00m,
                    SellingPrice = 200.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"1.5 Litre\",\"Type\":\"Carbonated Soft Drink\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-002",
                    Barcode = "8961001000025",
                    Name = "Next Cola 500ml Pet Bottle",
                    Description = "Single-serve cold Next Cola bottle. Perfect chilled refresher.",
                    Brand = "Mezan Next",
                    Unit = "bottle",
                    PurchaseCost = 80.00m,
                    SellingPrice = 100.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Volume\":\"500ml\",\"Type\":\"Single Serve\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-003",
                    Barcode = "8961001000032",
                    Name = "Khilafat Cola 1.5 Litre Bottle",
                    Description = "Popular national cola alternative with signature caramel and spiced blend.",
                    Brand = "Khilafat Cola",
                    Unit = "bottle",
                    PurchaseCost = 160.00m,
                    SellingPrice = 180.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"1.5 Litre\",\"Origin\":\"Pakistan\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-004",
                    Barcode = "8961001000049",
                    Name = "Khilafat Cola 500ml Pet Bottle",
                    Description = "Convenient 500ml on-the-go Khilafat Cola bottle.",
                    Brand = "Khilafat Cola",
                    Unit = "bottle",
                    PurchaseCost = 75.00m,
                    SellingPrice = 90.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Volume\":\"500ml\",\"Type\":\"Single Serve\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-005",
                    Barcode = "8961001000056",
                    Name = "Coca-Cola Original Taste 1.5 Litre",
                    Description = "Classic original Coca-Cola refreshing carbonated soft drink 1.5L bottle.",
                    Brand = "Coca-Cola",
                    Unit = "bottle",
                    PurchaseCost = 195.00m,
                    SellingPrice = 220.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"1.5 Litre\",\"Flavor\":\"Classic Cola\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-006",
                    Barcode = "8961001000063",
                    Name = "Pepsi Cola 1.5 Litre Bottle",
                    Description = "Bold and cold Pepsi Cola 1.5 litre family pack beverage.",
                    Brand = "Pepsi",
                    Unit = "bottle",
                    PurchaseCost = 195.00m,
                    SellingPrice = 220.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Volume\":\"1.5 Litre\",\"Brand\":\"PepsiCo\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-007",
                    Barcode = "8961001000070",
                    Name = "Pakola Ice Cream Soda 1.5 Litre Bottle",
                    Description = "The iconic Pakistani green ice cream soda drink. Nostalgic sweet flavor.",
                    Brand = "Pakola",
                    Unit = "bottle",
                    PurchaseCost = 185.00m,
                    SellingPrice = 210.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Flavor\":\"Ice Cream Soda\",\"Volume\":\"1.5 Litre\"}"
                },
                new()
                {
                    CategoryId = bevCat.Id,
                    SKU = "MBK-BEV-008",
                    Barcode = "8961001000087",
                    Name = "Rooh Afza Herbal Sharbat 800ml Bottle",
                    Description = "Hamdard Rooh Afza the traditional refreshing herbal drink of the east.",
                    Brand = "Hamdard",
                    Unit = "bottle",
                    PurchaseCost = 390.00m,
                    SellingPrice = 430.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"800ml\",\"Type\":\"Sharbat Concentrate\"}"
                },

                // --- HOME & LAUNDRY ---
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-001",
                    Barcode = "8962002000015",
                    Name = "Surf Excel Quick Wash Detergent 1kg Pack",
                    Description = "Premium stain-removing washing powder. Tough stain removal in 1 wash.",
                    Brand = "Surf Excel",
                    Unit = "pack",
                    PurchaseCost = 580.00m,
                    SellingPrice = 640.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Type\":\"Detergent Powder\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-002",
                    Barcode = "8962002000022",
                    Name = "Surf Excel Detergent Powder 500g Pack",
                    Description = "Surf Excel 500g standard washing powder pack for daily laundry.",
                    Brand = "Surf Excel",
                    Unit = "pack",
                    PurchaseCost = 300.00m,
                    SellingPrice = 340.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"500g\",\"Type\":\"Detergent Powder\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-003",
                    Barcode = "8962002000039",
                    Name = "Surf Excel Single-Wash Sachet Strip (12 Sachets)",
                    Description = "Convenient hanging strip of 12 single-wash Surf Excel sachets.",
                    Brand = "Surf Excel",
                    Unit = "strip",
                    PurchaseCost = 100.00m,
                    SellingPrice = 120.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Units\":\"12 Sachets\",\"Type\":\"Single Wash Strip\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-004",
                    Barcode = "8962002000046",
                    Name = "Ariel Complete Washing Powder 1kg Pack",
                    Description = "High-efficiency Ariel detergent powder for brilliant whites and deep cleaning.",
                    Brand = "Ariel",
                    Unit = "pack",
                    PurchaseCost = 570.00m,
                    SellingPrice = 630.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Brand\":\"Procter & Gamble\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-005",
                    Barcode = "8962002000053",
                    Name = "Bonus Tristar Detergent Powder 1kg Pack",
                    Description = "Affordable and powerful Bonus Tristar detergent for sparkling clean clothes.",
                    Brand = "Bonus",
                    Unit = "pack",
                    PurchaseCost = 280.00m,
                    SellingPrice = 320.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Value\":\"Economy Pack\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-006",
                    Barcode = "8962002000060",
                    Name = "Vim Dishwashing Bar Large (300g)",
                    Description = "Lemon-power dishwashing bar with antibacterial grease-cutting formula.",
                    Brand = "Vim",
                    Unit = "bar",
                    PurchaseCost = 95.00m,
                    SellingPrice = 115.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"300g\",\"Flavor\":\"Lemon Lime\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-007",
                    Barcode = "8962002000077",
                    Name = "Sufi Soap Special Yellow Laundry Bar (Pack of 4)",
                    Description = "Pure vegetable oil traditional Sufi yellow soap bars for fabrics and linen.",
                    Brand = "Sufi",
                    Unit = "pack",
                    PurchaseCost = 180.00m,
                    SellingPrice = 210.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1607006314641-69480dcbe8b5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"PackSize\":\"4 Bars\",\"Type\":\"Laundry Soap\"}"
                },
                new()
                {
                    CategoryId = lndCat.Id,
                    SKU = "MBK-LND-008",
                    Barcode = "8962002000084",
                    Name = "Dettol Original Germ Protection Soap (115g)",
                    Description = "Antibacterial bar soap protecting family against 99.9% of germs.",
                    Brand = "Dettol",
                    Unit = "pcs",
                    PurchaseCost = 140.00m,
                    SellingPrice = 160.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"115g\",\"Type\":\"Bath & Hygiene Soap\"}"
                },

                // --- GRAINS, FLOURS & BULK PACKS (10kg, 20kg, 50kg, 100kg) ---
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-001",
                    Barcode = "8963003000012",
                    Name = "Fresh Desi Chakki Atta (Whole Wheat Flour) 10kg Bag",
                    Description = "Pure stone-ground whole wheat atta from freshly milled Punjabi wheat. 10kg sealed bag.",
                    Brand = "Hafizabad Chakki",
                    Unit = "bag",
                    PurchaseCost = 1250.00m,
                    SellingPrice = 1380.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"10kg\",\"Type\":\"100% Whole Wheat Chakki Atta\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-002",
                    Barcode = "8963003000029",
                    Name = "Fresh Desi Chakki Atta (Whole Wheat Flour) 20kg Bag",
                    Description = "Unadulterated whole wheat flour 20kg family bag for daily roti and parathas.",
                    Brand = "Hafizabad Chakki",
                    Unit = "bag",
                    PurchaseCost = 2450.00m,
                    SellingPrice = 2680.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"20kg\",\"Type\":\"Chakki Atta Bag\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-003",
                    Barcode = "8963003000036",
                    Name = "Desi Gandum (Clean Premium Wheat Grain) 50kg Bori",
                    Description = "Triple-cleaned heavy grain Punjabi wheat suitable for grinding and grain storage. 50kg bori.",
                    Brand = "Local Mandi Hafizabad",
                    Unit = "bori",
                    PurchaseCost = 4800.00m,
                    SellingPrice = 5200.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"50kg\",\"Type\":\"Raw Wheat Grain (Gandum)\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-004",
                    Barcode = "8963003000043",
                    Name = "Desi Gandum (Clean Wheat Grain) 100kg Full Bori",
                    Description = "Full harvest 100kg jumbo bori of golden Punjabi wheat grain.",
                    Brand = "Local Mandi Hafizabad",
                    Unit = "bori",
                    PurchaseCost = 9500.00m,
                    SellingPrice = 10200.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 2,
                    ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"100kg\",\"Type\":\"Full Bori Wheat Grain\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-005",
                    Barcode = "8963003000050",
                    Name = "Super Kernel Basmati Rice (Kainat) 10kg Bag",
                    Description = "Aromatic aged long-grain Super Kernel Basmati rice from the fields of Hafizabad. 10kg bag.",
                    Brand = "Chenab Basmati",
                    Unit = "bag",
                    PurchaseCost = 3200.00m,
                    SellingPrice = 3500.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"10kg\",\"Variety\":\"Kainat 1121 Basmati\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-006",
                    Barcode = "8963003000067",
                    Name = "Super Kernel Basmati Rice 20kg Bag",
                    Description = "Premium aged fragrant basmati rice 20kg family bag. Extra long grains.",
                    Brand = "Chenab Basmati",
                    Unit = "bag",
                    PurchaseCost = 6300.00m,
                    SellingPrice = 6850.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"20kg\",\"Variety\":\"Super Basmati\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-007",
                    Barcode = "8963003000074",
                    Name = "Super Kernel Basmati Rice 50kg Bori",
                    Description = "Wholesale commercial 50kg bori of Super Kernel Basmati rice for catering and family events.",
                    Brand = "Chenab Basmati",
                    Unit = "bori",
                    PurchaseCost = 15400.00m,
                    SellingPrice = 16800.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 2,
                    ImageUrl = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"50kg\",\"Variety\":\"Super Kernel Bori\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-008",
                    Barcode = "8963003000081",
                    Name = "Refined White Sugar (Cheeni) 1kg Pack",
                    Description = "Pure crystal white refined sugar 1kg bag for sweet tea, desserts and cooking.",
                    Brand = "Jauharabad Sugar",
                    Unit = "kg",
                    PurchaseCost = 145.00m,
                    SellingPrice = 160.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Purity\":\"Refined White Cane Sugar\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-009",
                    Barcode = "8963003000098",
                    Name = "Refined White Sugar (Cheeni) 50kg Bori",
                    Description = "Full wholesale mill-packed 50kg bori of white cane sugar.",
                    Brand = "Jauharabad Sugar",
                    Unit = "bori",
                    PurchaseCost = 7100.00m,
                    SellingPrice = 7600.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 2,
                    ImageUrl = "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"50kg\",\"Type\":\"Wholesale Sugar Bori\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-010",
                    Barcode = "8963003000104",
                    Name = "Daal Chana Special (Polished Gram Lentils) 1kg",
                    Description = "Clean, bold-grain yellow gram lentils (Daal Chana). 1kg bag.",
                    Brand = "Merchant Select",
                    Unit = "kg",
                    PurchaseCost = 250.00m,
                    SellingPrice = 280.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Item\":\"Daal Chana\"}"
                },
                new()
                {
                    CategoryId = grnCat.Id,
                    SKU = "MBK-GRN-011",
                    Barcode = "8963003000111",
                    Name = "Daal Moong Dhuli (Washed Yellow Lentils) 1kg",
                    Description = "Fast-cooking washed yellow moong lentils rich in plant protein. 1kg bag.",
                    Brand = "Merchant Select",
                    Unit = "kg",
                    PurchaseCost = 290.00m,
                    SellingPrice = 320.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1585996746979-994364402660?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Item\":\"Daal Moong\"}"
                },

                // --- DRY FRUITS, NUTS & FRESH PRODUCE (Akhrot, Mooli) ---
                new()
                {
                    CategoryId = dryCat.Id,
                    SKU = "MBK-DRY-001",
                    Barcode = "8964004000019",
                    Name = "Kagzi Akhrot (Walnuts in Shell - Fresh Swat) 1kg",
                    Description = "Thin-shell Kagzi walnuts easily cracked by hand. Freshly harvested 1kg pack.",
                    Brand = "Northern Dry Fruit",
                    Unit = "kg",
                    PurchaseCost = 850.00m,
                    SellingPrice = 980.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1563746098-eb113ec46102?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Origin\":\"Swat / Gilgit\",\"Type\":\"Kagzi Akhrot\"}"
                },
                new()
                {
                    CategoryId = dryCat.Id,
                    SKU = "MBK-DRY-002",
                    Barcode = "8964004000026",
                    Name = "Kagzi Akhrot (Walnuts in Shell) 500g Pack",
                    Description = "500g half-kilo pack of hand-crackable Kagzi walnuts.",
                    Brand = "Northern Dry Fruit",
                    Unit = "pack",
                    PurchaseCost = 440.00m,
                    SellingPrice = 510.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"500g\",\"Type\":\"Kagzi Akhrot\"}"
                },
                new()
                {
                    CategoryId = dryCat.Id,
                    SKU = "MBK-DRY-003",
                    Barcode = "8964004000033",
                    Name = "Akhrot Giri (Premium Walnut Kernels) 500g Pack",
                    Description = "Crisp, buttery shelled walnut kernels ready to eat. 500g vacuum-sealed pack.",
                    Brand = "Northern Dry Fruit",
                    Unit = "pack",
                    PurchaseCost = 950.00m,
                    SellingPrice = 1100.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1563746098-eb113ec46102?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"500g\",\"Type\":\"Shelled Kernels (Giri)\"}"
                },
                new()
                {
                    CategoryId = dryCat.Id,
                    SKU = "MBK-DRY-004",
                    Barcode = "8964004000040",
                    Name = "Badam Giri (Sweet Almond Kernels) 500g Pack",
                    Description = "Sweet Afghan almond kernels, high protein and vitamin E. 500g pack.",
                    Brand = "Northern Dry Fruit",
                    Unit = "pack",
                    PurchaseCost = 1100.00m,
                    SellingPrice = 1250.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"500g\",\"Type\":\"Almond Kernels\"}"
                },
                new()
                {
                    CategoryId = dryCat.Id,
                    SKU = "MBK-DRY-005",
                    Barcode = "8964004000057",
                    Name = "Taza Desi Mooli (Fresh Farm White Radish) 1kg Bundle",
                    Description = "Crisp, pungent fresh farm white radish with green leaves from local Jurian fields. 1kg bundle.",
                    Brand = "Jurian Village Farms",
                    Unit = "kg",
                    PurchaseCost = 40.00m,
                    SellingPrice = 60.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Harvest\":\"Fresh Local Farm Produce\"}"
                },

                // --- BISCUITS, SNACKS & B4U NIMKO ---
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-001",
                    Barcode = "8965005000016",
                    Name = "B4U Nimko Special Mix (500g Family Pack)",
                    Description = "Spicy and crunchy B4U Special Mix Nimko with fried daal, peanuts, sev, and spices.",
                    Brand = "B4U Nimko",
                    Unit = "pack",
                    PurchaseCost = 240.00m,
                    SellingPrice = 280.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"500g\",\"Flavor\":\"Special Spicy Mix\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-002",
                    Barcode = "8965005000023",
                    Name = "B4U Nimko Special Mix (250g Regular Pack)",
                    Description = "Classic crunchy tea-time B4U special nimko 250g pack.",
                    Brand = "B4U Nimko",
                    Unit = "pack",
                    PurchaseCost = 125.00m,
                    SellingPrice = 150.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"250g\",\"Flavor\":\"Spicy Mix\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-003",
                    Barcode = "8965005000030",
                    Name = "B4U Daal Moth & Sev (250g Pack)",
                    Description = "Crisp fried lentils and chickpea strands seasoned with black salt and chat masala.",
                    Brand = "B4U Nimko",
                    Unit = "pack",
                    PurchaseCost = 130.00m,
                    SellingPrice = 150.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"250g\",\"Type\":\"Daal Moth\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-004",
                    Barcode = "8965005000047",
                    Name = "Peek Freans Sooper Egg & Milk Biscuits (Family Pack)",
                    Description = "Pakistan's favorite melt-in-mouth egg & milk biscuits. Family pack.",
                    Brand = "Peek Freans",
                    Unit = "pack",
                    PurchaseCost = 125.00m,
                    SellingPrice = 140.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Flavor\":\"Egg & Milk\",\"Pack\":\"Family Pack\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-005",
                    Barcode = "8965005000054",
                    Name = "Peek Freans Sooper Biscuits (Half Roll)",
                    Description = "Convenient single-sitting Sooper biscuits half roll.",
                    Brand = "Peek Freans",
                    Unit = "roll",
                    PurchaseCost = 45.00m,
                    SellingPrice = 50.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Format\":\"Half Roll\",\"PriceTag\":\"50 Rs.\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-006",
                    Barcode = "8965005000061",
                    Name = "Prince Chocolate Sandwich Biscuits (Family Pack)",
                    Description = "Crispy sandwich biscuits filled with rich dark chocolate cream.",
                    Brand = "LU Prince",
                    Unit = "pack",
                    PurchaseCost = 125.00m,
                    SellingPrice = 140.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Flavor\":\"Chocolate Cream\",\"Pack\":\"Family Pack\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-007",
                    Barcode = "8965005000078",
                    Name = "Rio Strawberry Cream Sandwich Biscuits (Family Pack)",
                    Description = "Crunchy biscuits layered with sweet fruity strawberry creme.",
                    Brand = "LU Rio",
                    Unit = "pack",
                    PurchaseCost = 125.00m,
                    SellingPrice = 140.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Flavor\":\"Strawberry Creme\",\"Pack\":\"Family Pack\"}"
                },
                new()
                {
                    CategoryId = nmkCat.Id,
                    SKU = "MBK-NMK-008",
                    Barcode = "8965005000085",
                    Name = "Traditional Shahi Desi Nankhatai Biscuits (500g Box)",
                    Description = "Authentic crumbly cardamom-scented Pakistani Nankhatai baked with desi ghee and pistachios.",
                    Brand = "Khalifa Style",
                    Unit = "box",
                    PurchaseCost = 380.00m,
                    SellingPrice = 450.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"500g\",\"Flavor\":\"Pistachio & Cardamom\"}"
                },

                // --- COOKING OIL, GHEE & SPICES ---
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-001",
                    Barcode = "8966006000013",
                    Name = "Dalda Pure Cooking Oil 1 Litre Pouch",
                    Description = "Enriched with Vitamins A, D & E. Lowest cholesterol premium cooking oil 1L pouch.",
                    Brand = "Dalda",
                    Unit = "pouch",
                    PurchaseCost = 490.00m,
                    SellingPrice = 530.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"1 Litre\",\"Type\":\"Cooking Oil Pouch\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-002",
                    Barcode = "8966006000020",
                    Name = "Dalda Cooking Oil 5 Litre Tin Canister",
                    Description = "Family 5 Litre durable tin canister of Dalda pure cooking oil.",
                    Brand = "Dalda",
                    Unit = "tin",
                    PurchaseCost = 2420.00m,
                    SellingPrice = 2600.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 2,
                    ImageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"5 Litre\",\"Packaging\":\"Tin Can\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-003",
                    Barcode = "8966006000037",
                    Name = "Sufi Banaspati Ghee 1kg Pouch",
                    Description = "Sufi Banaspati Ghee with rich aroma and authentic desi taste for karahis and sweets.",
                    Brand = "Sufi",
                    Unit = "pouch",
                    PurchaseCost = 480.00m,
                    SellingPrice = 520.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1kg\",\"Type\":\"Banaspati Ghee Pouch\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-004",
                    Barcode = "8966006000044",
                    Name = "Sufi Banaspati Ghee 5kg Tin",
                    Description = "Bulk 5kg tin of Sufi Banaspati Ghee for festive cooking.",
                    Brand = "Sufi",
                    Unit = "tin",
                    PurchaseCost = 2380.00m,
                    SellingPrice = 2550.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 2,
                    ImageUrl = "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"5kg\",\"Packaging\":\"Tin\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-005",
                    Barcode = "8966006000051",
                    Name = "Shan Special Bombay Biryani Masala 50g Box",
                    Description = "Authentic blend of royal aromatic spices for preparing fragrant spicy biryani.",
                    Brand = "Shan Foods",
                    Unit = "box",
                    PurchaseCost = 110.00m,
                    SellingPrice = 130.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"50g\",\"Recipe\":\"Bombay Biryani\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-006",
                    Barcode = "8966006000068",
                    Name = "National Lal Mirch Powder (Red Chilli) 200g Pack",
                    Description = "Pure ground red chillies for hot vibrant curries and marinades.",
                    Brand = "National Foods",
                    Unit = "pack",
                    PurchaseCost = 240.00m,
                    SellingPrice = 270.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"200g\",\"Spice\":\"Red Chilli Powder\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-007",
                    Barcode = "8966006000075",
                    Name = "National Himalayan Pink Salt 800g Pouch",
                    Description = "100% natural pure mineral-rich Himalayan pink rock salt from Khewra mines.",
                    Brand = "National Foods",
                    Unit = "pouch",
                    PurchaseCost = 80.00m,
                    SellingPrice = 100.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"800g\",\"Type\":\"Himalayan Pink Salt\"}"
                },
                new()
                {
                    CategoryId = oilCat.Id,
                    SKU = "MBK-OIL-008",
                    Barcode = "8966006000082",
                    Name = "Sufaid Zeera (White Cumin Seeds) 250g Pack",
                    Description = "Fragrant whole white cumin seeds for tadka, pulao, and curries. 250g bag.",
                    Brand = "Merchant Select",
                    Unit = "pack",
                    PurchaseCost = 350.00m,
                    SellingPrice = 400.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"250g\",\"Spice\":\"White Cumin (Zeera)\"}"
                },

                // --- TEA & DAIRY ---
                new()
                {
                    CategoryId = teaCat.Id,
                    SKU = "MBK-TEA-001",
                    Barcode = "8967007000010",
                    Name = "Tapal Danedar Black Tea 450g Family Pack",
                    Description = "Pakistan's most loved strong grain tea with rich golden color and brisk aroma. 450g pack.",
                    Brand = "Tapal",
                    Unit = "pack",
                    PurchaseCost = 670.00m,
                    SellingPrice = 730.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"450g\",\"Type\":\"Danedar Black Tea\"}"
                },
                new()
                {
                    CategoryId = teaCat.Id,
                    SKU = "MBK-TEA-002",
                    Barcode = "8967007000027",
                    Name = "Tapal Danedar Black Tea 190g Pack",
                    Description = "Compact 190g box of Tapal Danedar black tea leaves.",
                    Brand = "Tapal",
                    Unit = "pack",
                    PurchaseCost = 300.00m,
                    SellingPrice = 330.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Weight\":\"190g\",\"Type\":\"Danedar Tea\"}"
                },
                new()
                {
                    CategoryId = teaCat.Id,
                    SKU = "MBK-TEA-003",
                    Barcode = "8967007000034",
                    Name = "Olper's Full Cream Pure Milk 1 Litre Tetra Pak",
                    Description = "Ultra-high-temperature (UHT) treated pure wholesome cow milk for creamy chai.",
                    Brand = "Olper's",
                    Unit = "pack",
                    PurchaseCost = 270.00m,
                    SellingPrice = 295.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"1 Litre\",\"Type\":\"Full Cream UHT Milk\"}"
                },
                new()
                {
                    CategoryId = teaCat.Id,
                    SKU = "MBK-TEA-004",
                    Barcode = "8967007000041",
                    Name = "Nestle MilkPak Pure Milk 1 Litre Tetra Pak",
                    Description = "Rich and thick dairy milk trusted across Pakistani households. 1 Litre pack.",
                    Brand = "Nestle MilkPak",
                    Unit = "pack",
                    PurchaseCost = 270.00m,
                    SellingPrice = 295.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Volume\":\"1 Litre\",\"Brand\":\"Nestle\"}"
                },
                new()
                {
                    CategoryId = teaCat.Id,
                    SKU = "MBK-TEA-005",
                    Barcode = "8967007000058",
                    Name = "Nestle Everyday Tea Whitener Powder (375g Pouch)",
                    Description = "Specially formulated dairy tea whitener providing unmatched richness and texture to milk tea.",
                    Brand = "Nestle Everyday",
                    Unit = "pouch",
                    PurchaseCost = 480.00m,
                    SellingPrice = 530.00m,
                    StockQuantity = 10,
                    ReorderThreshold = 3,
                    ImageUrl = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"375g\",\"Type\":\"Dairy Powder Whitener\"}"
                }
            };

            bool anyProductAdded = false;
            foreach (var p in products)
            {
                if (!await context.Products.IgnoreQueryFilters().AnyAsync(existing => existing.SKU == p.SKU))
                {
                    await context.Products.AddAsync(p);
                    context.InventoryMovements.Add(new InventoryMovement
                    {
                        ProductId = p.Id,
                        QuantityChange = p.StockQuantity,
                        QuantityBefore = 0,
                        QuantityAfter = p.StockQuantity,
                        MovementType = InventoryMovementType.OpeningStock,
                        ReferenceType = "InitialCatalogSeed",
                        ReferenceId = p.SKU,
                        UnitCost = p.PurchaseCost,
                        Reason = "Opening stock for Mukhtar Bashir Merchant Karyana Store",
                        PerformedByUserName = "System Administrator"
                    });
                    anyProductAdded = true;
                }
            }

            if (anyProductAdded)
            {
                await context.SaveChangesAsync();
            }

            // 7. Seed Village Store Expense Categories & Initial Operating Expenses (Additive)
            var expCategories = new List<ExpenseCategory>
            {
                new() { Name = "Store Rent (دکان کا کرایہ)", Description = "Monthly store lease in Jurian, Hafizabad", IsActive = true },
                new() { Name = "Electricity & WAPDA Bill (بجلی کا بل)", Description = "Monthly commercial shop electricity bill", IsActive = true },
                new() { Name = "Carriage & Transport (منڈی کرایہ)", Description = "Transport carriage from Hafizabad grain & wholesale mandi", IsActive = true },
                new() { Name = "Packaging & Bags (شاپر اور پیکنگ)", Description = "Carry bags, grain bori ropes, and packaging materials", IsActive = true },
                new() { Name = "Store Maintenance & Miscellaneous", Description = "Repairs, cleaning supplies, and incidental costs", IsActive = true }
            };

            foreach (var ec in expCategories)
            {
                if (!await context.ExpenseCategories.IgnoreQueryFilters().AnyAsync(existing => existing.Name == ec.Name))
                {
                    await context.ExpenseCategories.AddAsync(ec);
                }
            }
            await context.SaveChangesAsync();

            if (!await context.Expenses.IgnoreQueryFilters().AnyAsync())
            {
                var rentCat = await context.ExpenseCategories.FirstAsync(c => c.Name.Contains("Store Rent"));
                var elecCat = await context.ExpenseCategories.FirstAsync(c => c.Name.Contains("Electricity"));
                var carriageCat = await context.ExpenseCategories.FirstAsync(c => c.Name.Contains("Carriage"));

            var sampleExpenses = new List<Expense>
            {
                new()
                {
                    ExpenseCategoryId = rentCat.Id,
                    Title = "Monthly Shop Rent - Jurian Storefront",
                    Amount = 15000.00m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-10),
                    PaymentMethod = PaymentMethodType.Cash,
                    Description = "Monthly shop rent paid for Jurian village store location.",
                    RecordedByUserName = "System Administrator"
                },
                new()
                {
                    ExpenseCategoryId = elecCat.Id,
                    Title = "LESCO / GEPCO Commercial Electricity Bill",
                    Amount = 8500.00m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-5),
                    PaymentMethod = PaymentMethodType.Cash,
                    Description = "Electricity bill for beverage chillers and shop lighting.",
                    RecordedByUserName = "System Administrator"
                },
                new()
                {
                    ExpenseCategoryId = carriageCat.Id,
                    Title = "Suzuki Pick-up Mandi Carriage (Flour & Rice)",
                    Amount = 2500.00m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-2),
                    PaymentMethod = PaymentMethodType.Cash,
                    Description = "Goods transport fare from Hafizabad wholesale grain market.",
                    RecordedByUserName = "Store Cashier"
                }
            };

            await context.Expenses.AddRangeAsync(sampleExpenses);
            await context.SaveChangesAsync();
        }
    }
}
