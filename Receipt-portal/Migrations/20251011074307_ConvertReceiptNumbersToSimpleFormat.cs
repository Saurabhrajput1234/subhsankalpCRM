using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class ConvertReceiptNumbersToSimpleFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing receipt numbers to 4-digit format
            // Extract last 4 digits from formats like "TKN2025100005" -> "0005"
            migrationBuilder.Sql(@"
                UPDATE Receipts 
                SET ReceiptNo = RIGHT('0000' + RIGHT(ReceiptNo, 4), 4)
                WHERE LEN(ReceiptNo) > 4
            ");

            // For any receipts that don't have 4 digits at the end, assign sequential numbers
            migrationBuilder.Sql(@"
                WITH NumberedReceipts AS (
                    SELECT Id, 
                           ROW_NUMBER() OVER (ORDER BY CreatedAt) as RowNum
                    FROM Receipts 
                    WHERE LEN(ReceiptNo) != 4 OR ReceiptNo NOT LIKE '[0-9][0-9][0-9][0-9]'
                )
                UPDATE r
                SET ReceiptNo = RIGHT('0000' + CAST(nr.RowNum AS VARCHAR), 4)
                FROM Receipts r
                INNER JOIN NumberedReceipts nr ON r.Id = nr.Id
            ");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 7, 43, 7, 213, DateTimeKind.Utc).AddTicks(1698), "$2a$11$CYqykmEPRscN07qv20jGze7v5A2b7io5zjUBbgNPJo113XB2jGRfS", new DateTime(2025, 10, 11, 7, 43, 7, 213, DateTimeKind.Utc).AddTicks(1702) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Note: This down migration cannot perfectly restore the original format
            // as we don't store the original format. This is a one-way conversion.
            // If needed, you would need to restore from a backup.
            
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 7, 42, 11, 41, DateTimeKind.Utc).AddTicks(5248), "$2a$11$9sFxpL6QJ8xFtY/c0vDbLetKs.77PWM6FxDPL5ZwAt4VYhETR.K2W", new DateTime(2025, 10, 11, 7, 42, 11, 41, DateTimeKind.Utc).AddTicks(5257) });
        }
    }
}
