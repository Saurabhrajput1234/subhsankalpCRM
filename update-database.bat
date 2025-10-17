@echo off
echo Updating database with new migration...
echo.

echo Step 1: Stopping any running backend processes...
taskkill /f /im "Subh-sankalp-estate.exe" 2>nul
timeout /t 2 /nobreak > nul

echo Step 2: Building the project...
dotnet build
if %errorlevel% neq 0 (
    echo Build failed! Please fix the errors and try again.
    pause
    exit /b 1
)

echo Step 3: Applying database migration...
dotnet ef database update
if %errorlevel% neq 0 (
    echo Migration failed! Please check the error and try again.
    pause
    exit /b 1
)

echo.
echo ✅ Database updated successfully!
echo.
echo You can now start the backend with: dotnet run
echo.
pause