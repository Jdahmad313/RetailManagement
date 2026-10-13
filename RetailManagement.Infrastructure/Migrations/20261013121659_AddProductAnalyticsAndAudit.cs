using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetailManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductAnalyticsAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SKU = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OldSellingPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NewSellingPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OldPurchaseCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NewPurchaseCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OldStock = table.Column<int>(type: "int", nullable: true),
                    NewStock = table.Column<int>(type: "int", nullable: true),
                    ChangeSummary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangedByUserName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductMonthlySales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SKU = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    UnitsSold = table.Column<int>(type: "int", nullable: false),
                    TotalRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GrossProfit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LastSaleDateUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductMonthlySales", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductAuditLogs");

            migrationBuilder.DropTable(
                name: "ProductMonthlySales");
        }
    }
}
