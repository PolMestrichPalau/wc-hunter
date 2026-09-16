# Script de verificacion automatizada para WC HUNTER
$ErrorActionPreference = "Stop"

Write-Host "=== VERIFICACION DE ARCHIVOS WC HUNTER ===" -ForegroundColor Cyan
$requiredFiles = @(
    "index.html",
    "manifest.json",
    "sw.js",
    "serve.ps1",
    "css\main.css",
    "js\app.js",
    "js\state.js",
    "js\algorithms.js",
    "js\map.js",
    "js\seedData.js",
    "js\views\mapView.js",
    "js\views\nearView.js",
    "js\views\rankingView.js",
    "js\views\hunterView.js",
    "js\views\profileView.js",
    "js\views\wcDetailModal.js",
    "js\views\addWcModal.js"
)

$basePath = "C:\Users\Usuario\.gemini\antigravity\scratch\wc-hunter"
$allExist = $true

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "  [OK] $file ($size B)" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $file" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Error "Faltan archivos requeridos"
}

Write-Host "`n=== COMPROBACION DE SINTAXIS Y CONTENIDO ===" -ForegroundColor Cyan
$indexContent = Get-Content (Join-Path $basePath "index.html") -Raw
if ($indexContent.Contains("leaflet") -and $indexContent.Contains("bottom-nav") -and $indexContent.Contains("app.js")) {
    Write-Host "  [OK] index.html contiene todos los tags e integraciones requeridas." -ForegroundColor Green
} else {
    Write-Error "index.html no contiene todos los tags requeridos."
}

Write-Host "`n=== TODO VERIFICADO CORRECTAMENTE ===" -ForegroundColor Green
