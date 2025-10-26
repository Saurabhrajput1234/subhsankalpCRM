# Convert Neon Connection String to .NET Format

Write-Host "=== Neon Connection String Converter ===" -ForegroundColor Green

Write-Host "`nPaste your Neon connection string here:" -ForegroundColor Yellow
Write-Host "(Format: postgresql://username:password@host/database?sslmode=require)" -ForegroundColor Gray
$neonConnectionString = Read-Host "Neon Connection String"

if ($neonConnectionString -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
    $username = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $database = $matches[4]
    
    $dotnetConnectionString = "Host=$host;Database=$database;Username=$username;Password=$password;SSL Mode=Require;Trust Server Certificate=true"
    
    Write-Host "`n✅ Converted Connection String:" -ForegroundColor Green
    Write-Host $dotnetConnectionString -ForegroundColor Cyan
    
    # Update appsettings.json
    Write-Host "`nUpdating appsettings.json..." -ForegroundColor Yellow
    $appsettings = Get-Content "appsettings.json" | ConvertFrom-Json
    $appsettings.ConnectionStrings.DefaultConnection = $dotnetConnectionString
    $appsettings | ConvertTo-Json -Depth 10 | Set-Content "appsettings.json"
    
    Write-Host "✅ appsettings.json updated!" -ForegroundColor Green
    
    # Test connection
    Write-Host "`nTesting connection..." -ForegroundColor Yellow
    dotnet build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        
        Write-Host "Running database migration..." -ForegroundColor Yellow
        dotnet ef database update
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 Database setup complete!" -ForegroundColor Green
            Write-Host "Your Receipt Portal is now using Neon PostgreSQL!" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Migration failed. Please check the connection details." -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build failed." -ForegroundColor Red
    }
} else {
    Write-Host "❌ Invalid connection string format." -ForegroundColor Red
    Write-Host "Expected format: postgresql://username:password@host/database?sslmode=require" -ForegroundColor Yellow
}