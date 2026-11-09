# Verificacion automatizada para WC HUNTER
# Uso:  powershell -ExecutionPolicy Bypass -File tests\verify.ps1
$ErrorActionPreference = "Stop"
$basePath = Split-Path -Parent $PSScriptRoot   # carpeta raiz del proyecto (portable)
$failed = $false

Write-Host "=== 1. ARCHIVOS REQUERIDOS ===" -ForegroundColor Cyan
$requiredFiles = @(
    "index.html", "manifest.json", "sw.js", "serve.ps1", "css\main.css",
    "assets\icons\icon-192.png", "assets\icons\icon-512.png",
    "js\app.js", "js\state.js", "js\algorithms.js", "js\map.js", "js\geo.js", "js\utils.js", "js\seedData.js",
    "js\engines\wcEngine.js", "js\engines\gameEngine.js", "js\engines\userEngine.js",
    "js\views\mapView.js", "js\views\nearView.js", "js\views\rankingView.js", "js\views\hunterView.js",
    "js\views\profileView.js", "js\views\wcDetailModal.js", "js\views\addWcModal.js"
)
foreach ($file in $requiredFiles) {
    if (Test-Path (Join-Path $basePath $file)) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $file" -ForegroundColor Red
        $failed = $true
    }
}

Write-Host "`n=== 2. INDEX.HTML ===" -ForegroundColor Cyan
$indexContent = Get-Content (Join-Path $basePath "index.html") -Raw
foreach ($needle in @("leaflet", "bottom-nav", "js/app.js", "manifest.json")) {
    if ($indexContent.Contains($needle)) { Write-Host "  [OK] contiene '$needle'" -ForegroundColor Green }
    else { Write-Host "  [FALLA] no contiene '$needle'" -ForegroundColor Red; $failed = $true }
}

Write-Host "`n=== 3. SINTAXIS JS + PRUEBAS DE LOGICA (requiere Node.js) ===" -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "  [AVISO] Node.js no esta instalado: se omiten sintaxis y pruebas de logica." -ForegroundColor Yellow
} else {
    Get-ChildItem (Join-Path $basePath "js") -Recurse -Filter *.js | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { Write-Host "  [FALLA] sintaxis: $($_.Name)" -ForegroundColor Red; $failed = $true }
    }
    Write-Host "  [OK] sintaxis revisada" -ForegroundColor Green
    node (Join-Path $basePath "tests\logic.test.mjs")
    if ($LASTEXITCODE -ne 0) { $failed = $true }
}

if ($failed) {
    Write-Host "`n=== VERIFICACION FALLIDA ===" -ForegroundColor Red
    exit 1
}
Write-Host "`n=== VERIFICACION COMPLETADA ===" -ForegroundColor Green
