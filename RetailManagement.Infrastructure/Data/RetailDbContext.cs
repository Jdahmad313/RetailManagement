using System.Reflection;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RetailManagement.Domain.Common;
using RetailManagement.Domain.Entities;
using RetailManagement.Infrastructure.Identity;

namespace RetailManagement.Infrastructure.Data;

public class RetailDbContext : IdentityDbContext<AppUser, AppRole, string>
{
    public RetailDbContext(DbContextOptions<RetailDbContext> options) : base(options)
    {
    }

    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<PosSale> PosSales => Set<PosSale>();
    public DbSet<PosSaleItem> PosSaleItems => Set<PosSaleItem>();
    public DbSet<PosPayment> PosPayments => Set<PosPayment>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();
    public DbSet<OtpVerification> OtpVerifications => Set<OtpVerification>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<CustomerFeedback> CustomerFeedbacks => Set<CustomerFeedback>();
    public DbSet<ProductAuditLog> ProductAuditLogs => Set<ProductAuditLog>();
    public DbSet<ProductMonthlySales> ProductMonthlySales => Set<ProductMonthlySales>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply decimal precision (18,2) globally to all decimal properties
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            var decimalProps = entityType.ClrType.GetProperties()
                .Where(p => p.PropertyType == typeof(decimal) || p.PropertyType == typeof(decimal?));

            foreach (var prop in decimalProps)
            {
                builder.Entity(entityType.ClrType).Property(prop.Name).HasColumnType("decimal(18,2)");
            }
        }

        // Apply Global Soft Delete Query Filter
        builder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Order>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PosSale>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ExpenseCategory>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Supplier>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted);

        // Product Configurations
        builder.Entity<Product>(b =>
        {
            b.HasIndex(p => p.SKU).IsUnique();
            b.HasIndex(p => p.Barcode);
            b.Property(p => p.RowVersion).IsRowVersion();
            b.HasOne(p => p.Category)
             .WithMany(c => c.Products)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Category Configurations
        builder.Entity<Category>(b =>
        {
            b.HasIndex(c => c.Slug);
            b.HasOne(c => c.ParentCategory)
             .WithMany(c => c.SubCategories)
             .HasForeignKey(c => c.ParentCategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Order Configurations
        builder.Entity<Order>(b =>
        {
            b.HasIndex(o => o.OrderNumber).IsUnique();
            b.HasOne(o => o.Customer)
             .WithMany(c => c.Orders)
             .HasForeignKey(o => o.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<OrderItem>(b =>
        {
            b.HasOne(oi => oi.Order)
             .WithMany(o => o.Items)
             .HasForeignKey(oi => oi.OrderId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(oi => oi.Product)
             .WithMany()
             .HasForeignKey(oi => oi.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // POS Sale Configurations
        builder.Entity<PosSale>(b =>
        {
            b.HasIndex(s => s.ReceiptNumber).IsUnique();
            b.HasOne(s => s.Customer)
             .WithMany()
             .HasForeignKey(s => s.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PosSaleItem>(b =>
        {
            b.HasOne(si => si.PosSale)
             .WithMany(s => s.Items)
             .HasForeignKey(si => si.PosSaleId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(si => si.Product)
             .WithMany()
             .HasForeignKey(si => si.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PosPayment>(b =>
        {
            b.HasOne(p => p.PosSale)
             .WithMany(s => s.Payments)
             .HasForeignKey(p => p.PosSaleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Inventory Movement Configurations
        builder.Entity<InventoryMovement>(b =>
        {
            b.HasOne(im => im.Product)
             .WithMany(p => p.InventoryMovements)
             .HasForeignKey(im => im.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Expense Configurations
        builder.Entity<Expense>(b =>
        {
            b.HasOne(e => e.ExpenseCategory)
             .WithMany(ec => ec.Expenses)
             .HasForeignKey(e => e.ExpenseCategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Purchase Order Configurations
        builder.Entity<PurchaseOrder>(b =>
        {
            b.HasIndex(po => po.PurchaseOrderNumber).IsUnique();
            b.HasOne(po => po.Supplier)
             .WithMany(s => s.PurchaseOrders)
             .HasForeignKey(po => po.SupplierId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PurchaseOrderItem>(b =>
        {
            b.HasOne(poi => poi.PurchaseOrder)
             .WithMany(po => po.Items)
             .HasForeignKey(poi => poi.PurchaseOrderId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(poi => poi.Product)
             .WithMany()
             .HasForeignKey(poi => poi.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<AuditableEntity>();
        var now = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
