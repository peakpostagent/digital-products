# Regenerate etsy-seo-tag-generator.zip from src/.
# Run after changing manifest.json or any source file.
#
# Usage: powershell -ExecutionPolicy Bypass -File build-zip.ps1

param([string]$Version = "")

$ErrorActionPreference = "Stop"
$srcDir = Join-Path $PSScriptRoot "src"
$suffix = if ($Version) { "-v$Version" } else { "" }
$outZip = Join-Path $PSScriptRoot "etsy-seo-tag-generator$suffix.zip"

if (-not (Test-Path $srcDir)) { throw "src/ not found at $srcDir" }

$manifestPath = Join-Path $srcDir "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
Write-Host "Manifest version: $($manifest.version)"
Write-Host "Manifest name: $($manifest.name)"

if (Test-Path $outZip) { Remove-Item $outZip -Force; Write-Host "Removed prior zip" }

$items = Get-ChildItem -Path $srcDir -Force
Compress-Archive -Path $items.FullName -DestinationPath $outZip -CompressionLevel Optimal -Force

$zipSize = (Get-Item $outZip).Length
Write-Host ""
Write-Host "Built: $outZip"
Write-Host "Size: $([math]::Round($zipSize/1KB, 1)) KB"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($outZip)
Write-Host ""
Write-Host "Contents:"
foreach ($entry in $archive.Entries | Sort-Object FullName) {
  $kb = [math]::Round($entry.Length/1KB, 1)
  Write-Host ("  {0,8} KB  {1}" -f $kb, $entry.FullName)
}
$archive.Dispose()
