#!/usr/bin/env pwsh

Write-Host "🔄 Adding new fields to Plot model..." -ForegroundColor Cyan

# Navigate to the project directory
Set-Location -Path "Receipt-portal"

try {
    # Add migration for new plot fields
    Write-Host "Creating migration for new plot fields..." -ForegroundColor Yellow
    dotnet ef migrations add AddExtendedPlotFields

    Write-Host "✅ Migration created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 New fields added to Plot model:" -ForegroundColor Cyan
    Write-Host "• Block (string)" -ForegroundColor White
    Write-Host "• Length (decimal)" -ForegroundColor White
    Write-Host "• Width (decimal)" -ForegroundColor White
    Write-Host "• Area (decimal)" -ForegroundColor White
    Write-Host "• Road (string)" -ForegroundColor White
    Write-Host "• PLCApplicable (boolean)" -ForegroundColor White
    Write-Host "• TypeofPLC (string)" -ForegroundColor White
    Write-Host "• Facing (string)" -ForegroundColor White
    Write-Host "• RegisteredCompany (string)" -ForegroundColor White
    Write-Host "• GataKhesraNo (string)" -ForegroundColor White
    Write-Host "• AvailablePlot (boolean)" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the migration file in Migrations folder" -ForegroundColor White
    Write-Host "2. Run: dotnet ef database update" -ForegroundColor White
    Write-Host "3. Update frontend forms and tables" -ForegroundColor White

} catch {
    Write-Host "❌ Error creating migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}