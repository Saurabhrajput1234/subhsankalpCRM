using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class AddPanAadharAndCompanyNameToReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Receipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PanAadhar",
                table: "Receipts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 10, 54, 42, 954, DateTimeKind.Utc).AddTicks(4432), "$2a$11$Dmn1D0Gtb4zVGN6O9Mcf8e3ORwAmrKrirIBXK2jXhdFAyTx4zONMK", new DateTime(2025, 10, 27, 10, 54, 42, 954, DateTimeKind.Utc).AddTicks(4436) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "PanAadhar",
                table: "Receipts");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 5, 35, 59, 615, DateTimeKind.Utc).AddTicks(2061), "$2a$11$g.TBTsUMJCc3qJB.MncE.umNMWnZQ3apJBtHkpbEA082J3sjTScnK", new DateTime(2025, 10, 27, 5, 35, 59, 615, DateTimeKind.Utc).AddTicks(2066) });
        }
    }
}
