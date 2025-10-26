using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Subh_sankalp_estate.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgreSQLMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Plots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PlotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlotSize = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BasicRate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ReceivedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Mobile = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Receipts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReceiptNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReceiptType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FromName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    RelationType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RelationName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    Mobile = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TokenExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReceivedAmount = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ReferenceName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SiteName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PlotVillaNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlotSize = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BasicRate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Other = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    RtgsNeft = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CashChecked = table.Column<bool>(type: "boolean", nullable: false),
                    ChequeChecked = table.Column<bool>(type: "boolean", nullable: false),
                    RtgsChecked = table.Column<bool>(type: "boolean", nullable: false),
                    ChequeNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AdminDiscount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AdminRemarks = table.Column<string>(type: "text", nullable: false),
                    AssociateRemarks = table.Column<string>(type: "text", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    PlotId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Receipts_Plots_PlotId",
                        column: x => x.PlotId,
                        principalTable: "Plots",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Receipts_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Receipts_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransactionReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceiptId = table.Column<long>(type: "bigint", nullable: false),
                    PlotId = table.Column<int>(type: "integer", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Plots_PlotId",
                        column: x => x.PlotId,
                        principalTable: "Plots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Receipts_ReceiptId",
                        column: x => x.ReceiptId,
                        principalTable: "Receipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "Mobile", "PasswordHash", "Role", "UpdatedAt", "Username" },
                values: new object[] { 1, new DateTime(2025, 10, 26, 9, 55, 6, 337, DateTimeKind.Utc).AddTicks(7867), "admin@realestate.com", "System Administrator", true, "", "$2a$11$M1X0RazV17yO45aPGsltOOz05FXhwZCV4rFlsmZC0JHfBbWofLALK", "Admin", new DateTime(2025, 10, 26, 9, 55, 6, 337, DateTimeKind.Utc).AddTicks(7870), "admin" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CreatedByUserId",
                table: "Payments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PlotId",
                table: "Payments",
                column: "PlotId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ReceiptId",
                table: "Payments",
                column: "ReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_ApprovedByUserId",
                table: "Receipts",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_CreatedByUserId",
                table: "Receipts",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_PlotId",
                table: "Receipts",
                column: "PlotId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Receipts");

            migrationBuilder.DropTable(
                name: "Plots");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
