using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class SeparatePanAndAadharFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PanAadhar",
                table: "Receipts",
                newName: "PanNumber");

            migrationBuilder.AddColumn<string>(
                name: "AadharNumber",
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
                values: new object[] { new DateTime(2025, 10, 27, 11, 30, 50, 352, DateTimeKind.Utc).AddTicks(5198), "$2a$11$w7itoHDNWHNkhp1jkTWf2ee5bacMYDQlOqi.2AjQk54jq6MOGV85S", new DateTime(2025, 10, 27, 11, 30, 50, 352, DateTimeKind.Utc).AddTicks(5201) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AadharNumber",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "PanNumber",
                table: "Receipts",
                newName: "PanAadhar");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 10, 54, 42, 954, DateTimeKind.Utc).AddTicks(4432), "$2a$11$Dmn1D0Gtb4zVGN6O9Mcf8e3ORwAmrKrirIBXK2jXhdFAyTx4zONMK", new DateTime(2025, 10, 27, 10, 54, 42, 954, DateTimeKind.Utc).AddTicks(4436) });
        }
    }
}
