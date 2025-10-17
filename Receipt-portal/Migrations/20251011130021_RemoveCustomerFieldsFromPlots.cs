using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCustomerFieldsFromPlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssociateName",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "CustomerMobile",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "ReceivedAmount",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "ReferenceName",
                table: "Plots");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 13, 0, 20, 789, DateTimeKind.Utc).AddTicks(4299), "$2a$11$ktZVUMaZVQS5bAN6DEq.X.C0TgoOeBW.WPO7PrXL.bF0CfLERpNTi", new DateTime(2025, 10, 11, 13, 0, 20, 789, DateTimeKind.Utc).AddTicks(4303) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssociateName",
                table: "Plots",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerMobile",
                table: "Plots",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Plots",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ReceivedAmount",
                table: "Plots",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceName",
                table: "Plots",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 12, 18, 13, 564, DateTimeKind.Utc).AddTicks(250), "$2a$11$Zt1QGlf.AgH6hF6Ts7y/Deqav/FxTZomuHXTQ430OdWipyMGzFNmS", new DateTime(2025, 10, 11, 12, 18, 13, 564, DateTimeKind.Utc).AddTicks(261) });
        }
    }
}
