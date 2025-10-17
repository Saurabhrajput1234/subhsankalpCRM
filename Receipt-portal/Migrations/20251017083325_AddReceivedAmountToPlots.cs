using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class AddReceivedAmountToPlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ReceivedAmount",
                table: "Plots",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 17, 8, 33, 24, 453, DateTimeKind.Utc).AddTicks(8335), "$2a$11$IFGSKPFT6NqZ8mJUakecDuQpxJT//h73wnymTxbpZVDjS5647bGy.", new DateTime(2025, 10, 17, 8, 33, 24, 453, DateTimeKind.Utc).AddTicks(8341) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceivedAmount",
                table: "Plots");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 13, 0, 20, 789, DateTimeKind.Utc).AddTicks(4299), "$2a$11$ktZVUMaZVQS5bAN6DEq.X.C0TgoOeBW.WPO7PrXL.bF0CfLERpNTi", new DateTime(2025, 10, 11, 13, 0, 20, 789, DateTimeKind.Utc).AddTicks(4303) });
        }
    }
}
