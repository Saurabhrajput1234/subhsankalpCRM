# Test Signup API
Write-Host "Testing Signup API..." -ForegroundColor Green

$apiUrl = "http://localhost:5007/api/auth/signup"
$signupData = @{
    fullName = "Test User"
    username = "testuser123"
    email = "test123@example.com"
    mobile = "9876543210"
    role = "Associate"
    password = "password123"
    companySecretKey = "subhsankalp2023"
} | ConvertTo-Json

Write-Host "Request URL: $apiUrl" -ForegroundColor Yellow
Write-Host "Request Data:" -ForegroundColor Yellow
Write-Host $signupData -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $signupData -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")