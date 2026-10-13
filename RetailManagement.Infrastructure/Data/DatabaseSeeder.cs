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
        // 1. Seed Roles
        var roles = new[] { "Admin", "Manager", "Cashier", "Customer" };
        foreach (var r in roles)
        {
            if (!await roleManager.RoleExistsAsync(r))
            {
                await roleManager.CreateAsync(new AppRole(r));
            }
        }

        // 2. Seed Default Admin User
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

        // 3. Seed Default Cashier
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

        // 4. Seed Default Customer
        var customerEmail = "customer@retail.local";
        var customerUser = await userManager.FindByEmailAsync(customerEmail);
        if (customerUser == null)
        {
            customerUser = new AppUser
            {
                UserName = customerEmail,
                Email = customerEmail,
                FullName = "John Doe Customer",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(customerUser, "Customer@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customerUser, "Customer");
            }
        }

        // 5. Seed Business Profile (Pakistani Localization)
        var existingProfile = await context.BusinessProfiles.FirstOrDefaultAsync();
        if (existingProfile == null)
        {
            var profile = new BusinessProfile
            {
                BusinessName = "Apex Retail & Supermarket",
                Tagline = "Everyday Quality & Premium Essentials",
                LogoUrl = "/assets/logo.png",
                Address = "Plot 14-C, Main Boulevard, Gulberg III, Lahore, Pakistan",
                Phone = "+92 300 1234567",
                Email = "info@apexretail.pk",
                CurrencyCode = "PKR",
                CurrencySymbol = "Rs.",
                TimeZone = "Asia/Karachi",
                DefaultTaxRate = 5.00m,
                PricesIncludeTax = false,
                InvoicePrefix = "INV-",
                ReceiptHeader = "Apex Retail - Express Checkout (Lahore)",
                ReceiptFooter = "Thank you for shopping at Apex Retail! 7-day hassle-free return policy with original receipt.",
                DeliveryFee = 200.00m,
                FreeDeliveryThreshold = 3000.00m,
                AllowPickup = true,
                AllowDelivery = true,
                AllowNegativeStock = false
            };
            await context.BusinessProfiles.AddAsync(profile);
            await context.SaveChangesAsync();
        }
        else if (existingProfile.CurrencyCode == "USD" || existingProfile.CurrencySymbol == "$")
        {
            existingProfile.CurrencyCode = "PKR";
            existingProfile.CurrencySymbol = "Rs.";
            existingProfile.Phone = "+92 300 1234567";
            existingProfile.Address = "Plot 14-C, Main Boulevard, Gulberg III, Lahore, Pakistan";
            existingProfile.Email = "info@apexretail.pk";
            await context.SaveChangesAsync();
        }

        // 6. Seed Categories
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new() { Name = "Electronics", Slug = "electronics", Description = "High-grade gadgets, peripherals, and audio devices", DisplayOrder = 1, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60" },
                new() { Name = "Apparel & Fashion", Slug = "apparel-fashion", Description = "Modern casual clothing, footwear, and accessories", DisplayOrder = 2, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60" },
                new() { Name = "Organic Groceries", Slug = "organic-groceries", Description = "Fresh farm produce, pantry staples, and beverages", DisplayOrder = 3, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60" },
                new() { Name = "Health & Pharmacy", Slug = "health-pharmacy", Description = "Daily wellness, vitamins, and healthcare essentials", DisplayOrder = 4, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60" },
                new() { Name = "Home & Living", Slug = "home-living", Description = "Smart living, decor, and personal care accessories", DisplayOrder = 5, IsActive = true, ImageUrl = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60" }
            };

            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        // 7. Seed Products
        if (!await context.Products.AnyAsync())
        {
            var electronics = await context.Categories.FirstAsync(c => c.Slug == "electronics");
            var apparel = await context.Categories.FirstAsync(c => c.Slug == "apparel-fashion");
            var groceries = await context.Categories.FirstAsync(c => c.Slug == "organic-groceries");
            var pharmacy = await context.Categories.FirstAsync(c => c.Slug == "health-pharmacy");
            var home = await context.Categories.FirstAsync(c => c.Slug == "home-living");

            var products = new List<Product>
            {
                new()
                {
                    CategoryId = electronics.Id,
                    SKU = "ELEC-NC-001",
                    Barcode = "890123450001",
                    Name = "Apex Pro Wireless Noise-Cancelling Headphones",
                    Description = "Over-ear bluetooth 5.3 headphones with active 40dB noise cancellation, 45h battery life, and high-res audio codec.",
                    Brand = "ApexAudio",
                    Unit = "pcs",
                    PurchaseCost = 65.00m,
                    SellingPrice = 129.99m,
                    DiscountPrice = 109.99m,
                    StockQuantity = 25,
                    ReorderThreshold = 5,
                    ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Color\":\"Midnight Black\",\"Battery\":\"45 Hours\",\"Connectivity\":\"Bluetooth 5.3\"}"
                },
                new()
                {
                    CategoryId = electronics.Id,
                    SKU = "ELEC-KB-002",
                    Barcode = "890123450002",
                    Name = "Vanguard RGB Mechanical Gaming Keyboard",
                    Description = "Tactile mechanical switches, custom per-key RGB backlighting, aluminum top plate, and detachable USB-C braided cable.",
                    Brand = "ApexVanguard",
                    Unit = "pcs",
                    PurchaseCost = 42.00m,
                    SellingPrice = 89.50m,
                    DiscountPrice = null,
                    StockQuantity = 38,
                    ReorderThreshold = 6,
                    ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"SwitchType\":\"Tactile Brown\",\"Layout\":\"ANSI 87-Key\"}"
                },
                new()
                {
                    CategoryId = apparel.Id,
                    SKU = "CLOTH-TS-001",
                    Barcode = "890123450003",
                    Name = "Organic Pima Cotton Crewneck T-Shirt",
                    Description = "Ultra-soft 100% Peruvian pima cotton t-shirt. Pre-shrunk, breathable, with reinforced double stitching.",
                    Brand = "ThreadCraft",
                    Unit = "pcs",
                    PurchaseCost = 9.50m,
                    SellingPrice = 28.00m,
                    DiscountPrice = 22.50m,
                    StockQuantity = 90,
                    ReorderThreshold = 15,
                    ImageUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Material\":\"100% Pima Cotton\",\"Fit\":\"Regular\"}"
                },
                new()
                {
                    CategoryId = apparel.Id,
                    SKU = "CLOTH-JN-002",
                    Barcode = "890123450004",
                    Name = "Flex-Comfort Slim Fit Denim Jeans",
                    Description = "Classic indigo wash 5-pocket denim with 2% elastane flex stretch for all-day mobility and shape retention.",
                    Brand = "DenimWorks",
                    Unit = "pcs",
                    PurchaseCost = 21.00m,
                    SellingPrice = 54.00m,
                    DiscountPrice = null,
                    StockQuantity = 45,
                    ReorderThreshold = 10,
                    ImageUrl = "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Inseam\":\"32\",\"Color\":\"Dark Indigo\"}"
                },
                new()
                {
                    CategoryId = groceries.Id,
                    SKU = "GROC-OO-001",
                    Barcode = "890123450005",
                    Name = "Extra Virgin Cold-Pressed Olive Oil 500ml",
                    Description = "Single-origin unfiltered Mediterranean extra virgin olive oil. Rich polyphenol antioxidant profile with peppery finish.",
                    Brand = "VerdeHarvest",
                    Unit = "bottle",
                    PurchaseCost = 6.20m,
                    SellingPrice = 14.99m,
                    DiscountPrice = null,
                    StockQuantity = 50,
                    ReorderThreshold = 10,
                    ImageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Volume\":\"500ml\",\"Acidity\":\"<0.3%\"}"
                },
                new()
                {
                    CategoryId = groceries.Id,
                    SKU = "GROC-CB-002",
                    Barcode = "890123450006",
                    Name = "Single-Origin Ethiopian Yirgacheffe Beans 1kg",
                    Description = "Whole bean medium roast coffee with floral jasmine aroma, bergamot notes, and a silky bright citrus finish.",
                    Brand = "AltitudeRoasters",
                    Unit = "bag",
                    PurchaseCost = 11.50m,
                    SellingPrice = 24.50m,
                    DiscountPrice = 19.99m,
                    StockQuantity = 30,
                    ReorderThreshold = 8,
                    ImageUrl = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"Weight\":\"1000g\",\"Roast\":\"Medium\"}"
                },
                new()
                {
                    CategoryId = pharmacy.Id,
                    SKU = "PHARM-MV-001",
                    Barcode = "890123450007",
                    Name = "Immune Defense Complex Multivitamins 90ct",
                    Description = "High potency Vitamin C, D3, Zinc, and Elderberry extract formulation for daily immune support. Non-GMO and vegan.",
                    Brand = "VitalPharm",
                    Unit = "bottle",
                    PurchaseCost = 7.80m,
                    SellingPrice = 18.75m,
                    DiscountPrice = null,
                    StockQuantity = 65,
                    ReorderThreshold = 12,
                    ImageUrl = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = false,
                    AttributesJson = "{\"Count\":\"90 Veg Capsules\",\"Dosage\":\"1 daily\"}"
                },
                new()
                {
                    CategoryId = home.Id,
                    SKU = "HOME-SCL-001",
                    Barcode = "890123450008",
                    Name = "Smart Body Composition Bluetooth Scale",
                    Description = "Tempered glass high precision digital scale measuring BMI, body fat percentage, muscle mass, and syncs with iOS/Android.",
                    Brand = "SmartHomePro",
                    Unit = "pcs",
                    PurchaseCost = 15.00m,
                    SellingPrice = 36.00m,
                    DiscountPrice = 29.99m,
                    StockQuantity = 20,
                    ReorderThreshold = 5,
                    ImageUrl = "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=600&auto=format&fit=crop&q=80",
                    IsActive = true,
                    IsFeatured = true,
                    AttributesJson = "{\"MaxCapacity\":\"180kg / 400lbs\",\"Sync\":\"Bluetooth 5.0\"}"
                }
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();

            // Create initial stock movements
            foreach (var p in products)
            {
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
                    Reason = "Opening stock catalog population",
                    PerformedByUserName = "System Administrator"
                });
            }
            await context.SaveChangesAsync();
        }

        // 8. Seed Expense Categories & Initial Expenses
        if (!await context.ExpenseCategories.AnyAsync())
        {
            var expCategories = new List<ExpenseCategory>
            {
                new() { Name = "Store Rent & Lease", Description = "Monthly physical store and warehouse lease charges", IsActive = true },
                new() { Name = "Utilities & Internet", Description = "Electricity, heating, water, and broadband services", IsActive = true },
                new() { Name = "Staff Salaries", Description = "Store managers, cashiers, and stock personnel payroll", IsActive = true },
                new() { Name = "Packaging & Supplies", Description = "Shopping bags, receipt rolls, boxes, and tape", IsActive = true },
                new() { Name = "Marketing & Promotion", Description = "Local social media ads, storefront signage, flyers", IsActive = true }
            };

            await context.ExpenseCategories.AddRangeAsync(expCategories);
            await context.SaveChangesAsync();

            var rentCat = await context.ExpenseCategories.FirstAsync(c => c.Name == "Store Rent & Lease");
            var utilCat = await context.ExpenseCategories.FirstAsync(c => c.Name == "Utilities & Internet");
            var pkgCat = await context.ExpenseCategories.FirstAsync(c => c.Name == "Packaging & Supplies");

            var sampleExpenses = new List<Expense>
            {
                new()
                {
                    ExpenseCategoryId = rentCat.Id,
                    Title = "Storefront Monthly Lease",
                    Amount = 1850.00m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-10),
                    PaymentMethod = PaymentMethodType.BankTransfer,
                    Description = "Monthly lease for main store commercial space.",
                    RecordedByUserName = "System Administrator"
                },
                new()
                {
                    ExpenseCategoryId = utilCat.Id,
                    Title = "Commercial Electricity & Heating",
                    Amount = 240.50m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-6),
                    PaymentMethod = PaymentMethodType.BankTransfer,
                    Description = "Electric bill for refrigeration and store lighting.",
                    RecordedByUserName = "System Administrator"
                },
                new()
                {
                    ExpenseCategoryId = pkgCat.Id,
                    Title = "Thermal Receipt Paper & Eco Carry Bags",
                    Amount = 115.00m,
                    ExpenseDateUtc = DateTime.UtcNow.AddDays(-2),
                    PaymentMethod = PaymentMethodType.Cash,
                    Description = "Restock of 50 receipt rolls and 500 paper shopping bags.",
                    RecordedByUserName = "Store Cashier"
                }
            };

            await context.Expenses.AddRangeAsync(sampleExpenses);
            await context.SaveChangesAsync();
        }
    }
}
