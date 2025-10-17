using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class AddRtgsCheckedField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssociateRemarks",
                table: "Receipts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "RtgsChecked",
                table: "Receipts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 10, 11, 56, 25, 316, DateTimeKind.Utc).AddTicks(6263), "$2a$11$PfVlYj8zG5o4jRLavA3qiucD3sM/HlgDv7dB7zlmyC3PMeaiDcTcq", new DateTime(2025, 10, 10, 11, 56, 25, 316, DateTimeKind.Utc).AddTicks(6267) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssociateRemarks",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "RtgsChecked",
                table: "Receipts");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 10, 10, 33, 47, 665, DateTimeKind.Utc).AddTicks(3289), "$2a$11$5BUOhwr0dcey.0tfFCzv4eqL1jyM0IFFdaqRuxYVuFma1bJdH81rS", new DateTime(2025, 10, 10, 10, 33, 47, 665, DateTimeKind.Utc).AddTicks(3292) });
        }
    }
}
