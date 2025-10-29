using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedPlotFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Area",
                table: "Plots",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "AvailablePlot",
                table: "Plots",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Block",
                table: "Plots",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Facing",
                table: "Plots",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GataKhesraNo",
                table: "Plots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Length",
                table: "Plots",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "PLCApplicable",
                table: "Plots",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RegisteredCompany",
                table: "Plots",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Road",
                table: "Plots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TypeofPLC",
                table: "Plots",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "Plots",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 29, 6, 23, 7, 882, DateTimeKind.Utc).AddTicks(7320), "$2a$11$lTVjR8o98jjwW012K81pqO5J0vaWjU.fg3hmae8acZ4cRfkJfhkwG", new DateTime(2025, 10, 29, 6, 23, 7, 882, DateTimeKind.Utc).AddTicks(7323) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Area",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "AvailablePlot",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "Block",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "Facing",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "GataKhesraNo",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "Length",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "PLCApplicable",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "RegisteredCompany",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "Road",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "TypeofPLC",
                table: "Plots");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "Plots");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 11, 30, 50, 352, DateTimeKind.Utc).AddTicks(5198), "$2a$11$w7itoHDNWHNkhp1jkTWf2ee5bacMYDQlOqi.2AjQk54jq6MOGV85S", new DateTime(2025, 10, 27, 11, 30, 50, 352, DateTimeKind.Utc).AddTicks(5201) });
        }
    }
}
