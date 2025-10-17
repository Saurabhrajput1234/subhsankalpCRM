using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class AddSignupSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 10, 10, 33, 47, 665, DateTimeKind.Utc).AddTicks(3289), "$2a$11$5BUOhwr0dcey.0tfFCzv4eqL1jyM0IFFdaqRuxYVuFma1bJdH81rS", new DateTime(2025, 10, 10, 10, 33, 47, 665, DateTimeKind.Utc).AddTicks(3292) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 10, 8, 11, 30, 156, DateTimeKind.Utc).AddTicks(5224), "$2a$11$bLCPhfvX4yMF7AMGu46hEukVSPbtovKt1vydqVwBGO/vZWwO1hXwa", new DateTime(2025, 10, 10, 8, 11, 30, 156, DateTimeKind.Utc).AddTicks(5231) });
        }
    }
}
