# WC HUNTER - Demonio de Auto-Sincronizacion Continua con GitHub
param(
    [int]$IntervalSeconds = 10
)

$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = Get-Location }

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " [AUTO-SYNC] WC HUNTER: Sincronizacion Continua ACTIVADA" -ForegroundColor Yellow
Write-Host " Directorio vigilado: $baseDir" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

while ($true) {
    try {
        $status = git -C $baseDir status --porcelain 2>$null
        
        if ($status) {
            Start-Sleep -Seconds 2
            $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$now] Detectados cambios locales. Sincronizando..." -ForegroundColor Cyan
            
            git -C $baseDir add .
            git -C $baseDir commit -m "auto: sincronizacion automatica [$now]"
            $pushOut = git -C $baseDir push origin main 2>&1
            
            Write-Host "[$now] Subido con exito a GitHub." -ForegroundColor Green
        }
    } catch {
        Write-Host "Error en auto-sync: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds $IntervalSeconds
}
