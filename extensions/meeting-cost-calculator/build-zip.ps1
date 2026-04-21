# Regenerate meeting-cost-calculator.zip from src/.
# Run after changing manifest.json, dropping in extpay-sdk.js, or editing source.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File build-zip.ps1
#   powershell -ExecutionPolicy Bypass -File build-zip.ps1 -Version 1.2.0

param([string]$Version = "")

$ErrorActionPreference = "Stop"
$srcDir = Join-Path $PSScriptRoot "src"
$suffix = if ($Version) { "-v$Version" } else { "" }
$outZip = Join-Path $PSScriptRoot "meeting-cost-calculator$suffix.zip"

# Sanity check: src/ must exist
if (-not (Test-Path $srcDir)) {
    throw "src/ directory not found at $srcDir"
}

# SDK sanity check — warn but don't fail, since the extension falls back to free-tier
# gracefully when the SDK is absent.
$sdkPath = Join-Path $srcDir "lib\extpay-sdk.js"
if (-not (Test-Path $sdkPath)) {
    Write-Warning "extpay-sdk.js NOT FOUND at lib\extpay-sdk.js"
    Write-Warning "Pro tier will silently fall back to free for all users."
    Write-Warning "Download from extensionpay.com (v3.1+) before uploading to CWS."
}

# Read manifest version so output zip can be verified
$manifestPath = Join-Path $srcDir "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
Write-Host "Manifest version: $($manifest.version)"
Write-Host "Manifest name: $($manifest.name)"

# Remove any prior output so the new zip is clean
if (Test-Path $outZip) {
    Remove-Item $outZip -Force
    Write-Host "Removed prior $outZip"
}

# Zip contents of src/ at zip root (not the src/ folder itself — CWS expects
# manifest.json at zip top level).
$items = Get-ChildItem -Path $srcDir -Force
Compress-Archive -Path $items.FullName -DestinationPath $outZip -CompressionLevel Optimal -Force

# Report result
$zipSize = (Get-Item $outZip).Length
Write-Host ""
Write-Host "Built: $outZip"
Write-Host "Size: $([math]::Round($zipSize/1KB, 1)) KB"

# List contents for verification
Write-Host ""
Write-Host "Contents:"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($outZip)
foreach ($entry in $archive.Entries | Sort-Object FullName) {
    $kb = [math]::Round($entry.Length/1KB, 1)
    Write-Host ("  {0,8} KB  {1}" -f $kb, $entry.FullName)
}
$archive.Dispose()
