# PowerShell script to generate CSV data for Hare Krishna Township Phase 2 plots
# This will create a CSV file with 800 plots

$siteName = "Hare Krishna Township Phase 2"
$totalPlots = 800
$plotSize = "1000 sq ft"  # You can change this
$basicRate = 2500        # You can change this

$csvContent = @()
$csvContent += "Plot Number,Plot Size,Basic Rate"

for ($i = 1; $i -le $totalPlots; $i++) {
    $plotNumber = "HKT2-{0:D3}" -f $i
    $csvContent += "$plotNumber,$plotSize,$basicRate"
}

$fileName = "hkt_phase2_800_plots.csv"
$csvContent | Out-File -FilePath $fileName -Encoding UTF8

Write-Host "Generated $fileName with $totalPlots plots"
Write-Host "Site Name: $siteName"
Write-Host "Plot Size: $plotSize"
Write-Host "Basic Rate: Rs. $basicRate"
Write-Host ""
Write-Host "You can now:"
Write-Host "1. Open the CSV file and modify plot sizes/rates as needed"
Write-Host "2. Use the Bulk Create Plots feature in the admin panel"
Write-Host "3. Upload this data to create all plots at once"