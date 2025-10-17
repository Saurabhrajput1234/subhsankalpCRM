using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class UpdateReceiptNumbersTo4Digit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 7, 42, 11, 41, DateTimeKind.Utc).AddTicks(5248), "$2a$11$9sFxpL6QJ8xFtY/c0vDbLetKs.77PWM6FxDPL5ZwAt4VYhETR.K2W", new DateTime(2025, 10, 11, 7, 42, 11, 41, DateTimeKind.Utc).AddTicks(5257) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 11, 7, 16, 35, 767, DateTimeKind.Utc).AddTicks(59), "$2a$11$Y4Xw5feZeQbvCMgmnpUtsudE65oFrY7oe9OEKKD7rbkIPFnrSSj46", new DateTime(2025, 10, 11, 7, 16, 35, 767, DateTimeKind.Utc).AddTicks(66) });
        }
    }
}
