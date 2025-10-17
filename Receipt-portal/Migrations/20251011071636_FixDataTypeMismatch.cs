using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class FixDataTypeMismatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, add a temporary column
            migrationBuilder.AddColumn<string>(
                name: "Other_Temp",
                table: "Receipts",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            // Copy data from decimal to string, converting decimal values to string
            migrationBuilder.Sql(@"
                UPDATE Receipts 
                SET Other_Temp = CASE 
                    WHEN Other = 0 THEN ''
                    ELSE CAST(Other AS NVARCHAR(255))
                END
            ");

            // Drop the old column
            migrationBuilder.DropColumn(
                name: "Other",
                table: "Receipts");

            // Rename the temp column to the original name
            migrationBuilder.RenameColumn(
                name: "Other_Temp",
                table: "Receipts",
                newName: "Other");

            // Make the column non-nullable with default empty string
            migrationBuilder.AlterColumn<string>(
                name: "Other",
                table: "Receipts",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 7, 16, 35, 767, DateTimeKind.Utc).AddTicks(59), "$2a$11$Y4Xw5feZeQbvCMgmnpUtsudE65oFrY7oe9OEKKD7rbkIPFnrSSj46", new DateTime(2025, 10, 11, 7, 16, 35, 767, DateTimeKind.Utc).AddTicks(66) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add temporary decimal column
            migrationBuilder.AddColumn<decimal>(
                name: "Other_Temp",
                table: "Receipts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Convert string back to decimal (only if it's a valid number)
            migrationBuilder.Sql(@"
                UPDATE Receipts 
                SET Other_Temp = CASE 
                    WHEN Other = '' OR Other IS NULL THEN 0
                    WHEN ISNUMERIC(Other) = 1 THEN CAST(Other AS DECIMAL(18,2))
                    ELSE 0
                END
            ");

            // Drop the string column
            migrationBuilder.DropColumn(
                name: "Other",
                table: "Receipts");

            // Rename temp column back
            migrationBuilder.RenameColumn(
                name: "Other_Temp",
                table: "Receipts",
                newName: "Other");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 10, 11, 56, 25, 316, DateTimeKind.Utc).AddTicks(6263), "$2a$11$PfVlYj8zG5o4jRLavA3qiucD3sM/HlgDv7dB7zlmyC3PMeaiDcTcq", new DateTime(2025, 10, 10, 11, 56, 25, 316, DateTimeKind.Utc).AddTicks(6267) });
        }
    }
}
