@echo off
echo Testing backend connection...
echo.

echo Checking if backend is running on port 5007...
curl -s http://localhost:5007/swagger/v1/swagger.json > nul
if %errorlevel% == 0 (
    echo ✅ Backend is running on port 5007
    echo ✅ Swagger JSON is accessible
    echo.
    echo You can access:
    echo - API: http://localhost:5007/api
    echo - Swagger UI: http://localhost:5007/swagger
) else (
    echo ❌ Backend is not running on port 5007
    echo.
    echo To start the backend:
    echo cd "Receipt-portal"
    echo dotnet run
)

echo.
pause